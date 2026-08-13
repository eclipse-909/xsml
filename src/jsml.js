/////////////
// Signals //
/////////////

//TODO

//////////////////////
// Type definitions //
//////////////////////

/**
 * A ChildNode is a child HTMLElement or string of another element.
 * @typedef {(HTMLElement|string)} ChildElement
 */

/**
 * A Component is a function that accepts any properties as arguments and returns an HTMLElement or string.
 * @callback Component
 * @param {...any} props
 * @returns {ChildElement}
 */

/**
 * This callback allows modification of an element from within the component structure.
 * ## Example
 * ```js
 * button({}).and(btn => btn.onclick = someFunction)
 * ```
 * @callback AndCallback
 * @param {HTMLElement} element
 */

/**
 * Routes are used to configure a router. It is recommended to use a "/" path, but it's not required.
 * You can specify a fallback path and compose router objects.
 * The route must either be an HTMLElement, string, or another route object.
 * The router directly reads the `document.pathname`.
 * The router does not check to make sure your paths are reachable or has duplicates.
 * ## Example
 * ```js
 * router("/404", {}, {
 *   "/": index(),
 *   "/404": notFound(),
 *   "/combined/path": somePage(),
 *   "/composed": {
 *     "/path": otherPage(),
 *     "/hello": "Hello, World!"
 *   }
 * })
 * ```
 * @typedef {Object.<string, (Routes|HTMLElement|string)>} Routes
 */

/**
 * HTMLElement attributes.
 * @typedef {Object.<string, string>} Attrs
 */

//////////////
// Elements //
//////////////

/**
 * @param {string} name
 * @param {Attrs} attrs
 * @param  {...ChildElement} children
 * @returns {HTMLElement}
 */
function element(name, attrs, ...children) {
	const element = document.createElement(name);
	for (const attr in attrs) {
		element.setAttribute(attr, attrs[attr]);
	}
	for (const child of children) {
		if (child instanceof HTMLElement) {
			element.appendChild(child);
		} else if (typeof child === 'string') {
			element.textContent += child;
		} else {
			throw Error(`Invalid child type. Expected HTMLElement|string, got ${child.constructor}`);
		}
	}
	return element;
}

/**
 * @param {Attrs} attrs
 * @param  {...ChildElement} children
 * @returns {HTMLElement}
 */
export function div(attrs, ...children) { return element("div", attrs, ...children); }

/**
 * @param {Attrs} attrs
 * @param  {...ChildElement} children
 * @returns {HTMLElement}
 */
export function button(attrs, ...children) { return element("button", attrs, ...children); }

/**
 * @param {Attrs} attrs
 * @param  {...ChildElement} children
 * @returns {HTMLElement}
 */
export function a(attrs, ...children) { return element("a", attrs, ...children); }

/**
 * @param {Routes} routes
 * @param {Routes} collapsed
 * @param {string} pathname
 * @return {Routes}
 * @throws {Error}
 */
function collapseRoutes(routes, collapsed = {}, pathname = "") {
	for (const path in routes) {
		const route = routes[path];
		const newPath = pathname + path;
		const routeType = typeof route;
		if (routeType === 'string' || route instanceof HTMLElement) {
			collapsed[newPath] = route;
		} else if (routeType === 'object') {
			collapseRoutes(route, collapsed, newPath);
		} else {
			throw Error(`Invalid router configuration. Expected type HTMLElement|string, got ${routeType}`);
		}
	}
	return collapsed;
}

/**
 * @param {HTMLElement} router
 * @param {string} notFoundPath
 * @param {Routes} routes
 * @throws {Error}
 */
function render(router, notFoundPath, routes) {
	// const router = document.getElementById("jsml-router");
	const route = routes[location.pathname] ?? routes[notFoundPath];
	if (typeof route === 'string') {
		router.textContent = route;
	} else if (route instanceof HTMLElement) {
		router.replaceChildren(route);
	} else {
		throw Error(`Invalid route for pathname: ${location.pathname} - route: ${route}`);
	}
}

/**
 * Creates a router for a client-side rendered single-page application.
 * You must only create one router in the whole application.
 * Creating multiple routers will lead to weird behavior.
 * @param {string} notFoundPath
 * @param {Attrs} attrs
 * @param {Routes} routes
 * @returns {HTMLElement}
 * @throws {Error}
 */
export function router(notFoundPath, attrs, routes) {
	const router = div({ id: "jsml-router", ...attrs });
	const collapsedRoutes = collapseRoutes(routes);
	document.addEventListener('click', (e) => {
		const link = e.target.closest('a');
		if (link && link.origin === location.origin) {
			e.preventDefault();
			history.pushState({}, '', link.pathname);
			render(router, notFoundPath, collapsedRoutes);
		}
	});
	window.onpopstate = (_event) => render(router, notFoundPath, collapsedRoutes);
	render(router, notFoundPath, collapsedRoutes);
	return router;
}

/**
 * This method allows modification of an element from within the component structure.
 * ## Example
 * ```js
 * button({}).and(btn => btn.onclick = someFunction)
 * ```
 * @param {AndCallback} callback
 * @returns {HTMLElement}
 */
HTMLElement.prototype.and = function(callback) {
	callback(this);
	return this;
};

/**
 * This is the entry point of the jsml app.
 * This creates the root node under the body and attaches everything to it.
 * @param {(HTMLElement|string)} ui
 */
export function jsml(ui) {
	const jsmlApp = document.createElement("div");
	jsmlApp.setAttribute("id", "jsml-app");
	document.body.appendChild(jsmlApp);
	if (ui instanceof HTMLElement) {
		jsmlApp.replaceChildren(ui);
	} else if (typeof ui === 'string') {
		jsmlApp.textContent = ui;
	} else {
		throw Error(`Expected main to return HTMLElement or string, got ${typeof ui}`);
	}
}