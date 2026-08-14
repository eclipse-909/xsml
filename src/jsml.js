//////////////////////
// Type Definitions //
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

/**
 * @callback $dep
 * @param {any} value
 */

/**
 * This callback defines how child elements should be created when a signal is updated.
 * @callback Procreate
 * @param {any} $state
 * @return {ChildElement[]}
 */

/**
 * Maps an event into data used to set the value of a signal
 * @callback MapEvent
 * @param {Event} event
 * @return {any}
 */

/////////////
// Signals //
/////////////

/**
 * Creates a new signal with initial state.
 * @param {any} init
 */
export function $(init) {
	/**
	 * @type {any}
	 * @private
	 */
	this._state = init;
	/**
	 * @type {$dep[]}
	 * @protected
	 */
	this._deps = [];
}

/**
 * Gets the state of the signal.
 * @return {any}
 */
$.prototype.get = function() {
	return this._state;
};

/**
 * Sets the state of this signal and updates every subscriber.
 * @param {any} value
 */
$.prototype.set = function(value) {
	this._state = value;
	for (const dep of this._deps) {
		dep(value);
	}
};

/**
 * Registers this element's event listener to map the event then use that to set the signal.
 * This can be called multiple on times an element for different events.
 * You should not call this multiple times on an element for the same event.
 * @param {$} signal
 * @param {string} event
 * @param {MapEvent} mapEvent
 * @return {HTMLElement}
 */
HTMLElement.prototype.$eventIn = function(signal, event, mapEvent) {
	this.addEventListener(event, e => signal.set(mapEvent(e)));
	return this;
};

/**
 * Registers this element's attribute to be updated when the set method is called on this signal.
 * This can be called multiple on times an element for different attributes.
 * You should not call this multiple times on an element for the same attribute.
 * @param {$} signal
 * @param {string} attr
 * @return {HTMLElement}
 */
HTMLElement.prototype.$attrOut = function(signal, attr) {
	signal._deps.push(value => this[attr] = value);
	return this;
};

/**
 * Registers this element's children to be replaced with the result of the procreate callback
 * when the set method is called on this signal.
 * This can be called multiple on times an element for different attributes.
 * You should not call this multiple times on an element for the same attribute.
 * @param {$} signal
 * @param {Procreate} procreate
 * @return {HTMLElement}
 */
HTMLElement.prototype.$childrenOut = function(signal, procreate) {
	signal._deps.push(value => this.replaceChildren(...procreate(value)));
	return this;
};

//TODO

//////////////
// Elements //
//////////////

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
 * Basic element constructor. You shouldn't need this unless you need to create an element with a custom tag name.
 * For example, you might have a custom web component.
 * @param {string} name
 * @param {Attrs} attrs
 * @param  {...ChildElement} children
 * @returns {HTMLElement}
 */
export function element(name, attrs, ...children) {
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

// The rest of the file is functions for standard HTML5 tags
// TODO: remove the tags that don't belong in the body (html, meta, body, etc)

/**
 * @param {Attrs} attrs
 * @param  {...ChildElement} children
 * @returns {HTMLElement}
 */
export function a(attrs, ...children) {return element("a", attrs, ...children);}
/**
 * @param {Attrs} attrs
 * @param  {...ChildElement} children
 * @returns {HTMLElement}
 */
export function abbr(attrs, ...children) {return element("abbr", attrs, ...children);}
/**
 * @param {Attrs} attrs
 * @param  {...ChildElement} children
 * @returns {HTMLElement}
 */
export function address(attrs, ...children) {return element("address", attrs, ...children);}
/**
 * @param {Attrs} attrs
 * @param  {...ChildElement} children
 * @returns {HTMLElement}
 */
export function area(attrs, ...children) {return element("area", attrs, ...children);}
/**
 * @param {Attrs} attrs
 * @param  {...ChildElement} children
 * @returns {HTMLElement}
 */
export function article(attrs, ...children) {return element("article", attrs, ...children);}
/**
 * @param {Attrs} attrs
 * @param  {...ChildElement} children
 * @returns {HTMLElement}
 */
export function aside(attrs, ...children) {return element("aside", attrs, ...children);}
/**
 * @param {Attrs} attrs
 * @param  {...ChildElement} children
 * @returns {HTMLElement}
 */
export function audio(attrs, ...children) {return element("audio", attrs, ...children);}
/**
 * @param {Attrs} attrs
 * @param  {...ChildElement} children
 * @returns {HTMLElement}
 */
export function b(attrs, ...children) {return element("b", attrs, ...children);}
/**
 * @param {Attrs} attrs
 * @param  {...ChildElement} children
 * @returns {HTMLElement}
 */
export function base(attrs, ...children) {return element("base", attrs, ...children);}
/**
 * @param {Attrs} attrs
 * @param  {...ChildElement} children
 * @returns {HTMLElement}
 */
export function bdi(attrs, ...children) {return element("bdi", attrs, ...children);}
/**
 * @param {Attrs} attrs
 * @param  {...ChildElement} children
 * @returns {HTMLElement}
 */
export function bdo(attrs, ...children) {return element("bdo", attrs, ...children);}
/**
 * @param {Attrs} attrs
 * @param  {...ChildElement} children
 * @returns {HTMLElement}
 */
export function blockquote(attrs, ...children) {return element("blockquote", attrs, ...children);}
/**
 * @param {Attrs} attrs
 * @param  {...ChildElement} children
 * @returns {HTMLElement}
 */
export function body(attrs, ...children) {return element("body", attrs, ...children);}
/**
 * @param {Attrs} attrs
 * @param  {...ChildElement} children
 * @returns {HTMLElement}
 */
export function br(attrs, ...children) {return element("br", attrs, ...children);}
/**
 * @param {Attrs} attrs
 * @param  {...ChildElement} children
 * @returns {HTMLElement}
 */
export function button(attrs, ...children) {return element("button", attrs, ...children);}
/**
 * @param {Attrs} attrs
 * @param  {...ChildElement} children
 * @returns {HTMLElement}
 */
export function canvas(attrs, ...children) {return element("canvas", attrs, ...children);}
/**
 * @param {Attrs} attrs
 * @param  {...ChildElement} children
 * @returns {HTMLElement}
 */
export function caption(attrs, ...children) {return element("caption", attrs, ...children);}
/**
 * @param {Attrs} attrs
 * @param  {...ChildElement} children
 * @returns {HTMLElement}
 */
export function cite(attrs, ...children) {return element("cite", attrs, ...children);}
/**
 * @param {Attrs} attrs
 * @param  {...ChildElement} children
 * @returns {HTMLElement}
 */
export function code(attrs, ...children) {return element("code", attrs, ...children);}
/**
 * @param {Attrs} attrs
 * @param  {...ChildElement} children
 * @returns {HTMLElement}
 */
export function col(attrs, ...children) {return element("col", attrs, ...children);}
/**
 * @param {Attrs} attrs
 * @param  {...ChildElement} children
 * @returns {HTMLElement}
 */
export function colgroup(attrs, ...children) {return element("colgroup", attrs, ...children);}
/**
 * @param {Attrs} attrs
 * @param  {...ChildElement} children
 * @returns {HTMLElement}
 */
export function data(attrs, ...children) {return element("data", attrs, ...children);}
/**
 * @param {Attrs} attrs
 * @param  {...ChildElement} children
 * @returns {HTMLElement}
 */
export function datalist(attrs, ...children) {return element("datalist", attrs, ...children);}
/**
 * @param {Attrs} attrs
 * @param  {...ChildElement} children
 * @returns {HTMLElement}
 */
export function dd(attrs, ...children) {return element("dd", attrs, ...children);}
/**
 * @param {Attrs} attrs
 * @param  {...ChildElement} children
 * @returns {HTMLElement}
 */
export function del(attrs, ...children) {return element("del", attrs, ...children);}
/**
 * @param {Attrs} attrs
 * @param  {...ChildElement} children
 * @returns {HTMLElement}
 */
export function details(attrs, ...children) {return element("details", attrs, ...children);}
/**
 * @param {Attrs} attrs
 * @param  {...ChildElement} children
 * @returns {HTMLElement}
 */
export function dfn(attrs, ...children) {return element("dfn", attrs, ...children);}
/**
 * @param {Attrs} attrs
 * @param  {...ChildElement} children
 * @returns {HTMLElement}
 */
export function dialog(attrs, ...children) {return element("dialog", attrs, ...children);}
/**
 * @param {Attrs} attrs
 * @param  {...ChildElement} children
 * @returns {HTMLElement}
 */
export function div(attrs, ...children) {return element("div", attrs, ...children);}
/**
 * @param {Attrs} attrs
 * @param  {...ChildElement} children
 * @returns {HTMLElement}
 */
export function dl(attrs, ...children) {return element("dl", attrs, ...children);}
/**
 * @param {Attrs} attrs
 * @param  {...ChildElement} children
 * @returns {HTMLElement}
 */
export function dt(attrs, ...children) {return element("dt", attrs, ...children);}
/**
 * @param {Attrs} attrs
 * @param  {...ChildElement} children
 * @returns {HTMLElement}
 */
export function em(attrs, ...children) {return element("em", attrs, ...children);}
/**
 * @param {Attrs} attrs
 * @param  {...ChildElement} children
 * @returns {HTMLElement}
 */
export function embed(attrs, ...children) {return element("embed", attrs, ...children);}
/**
 * @param {Attrs} attrs
 * @param  {...ChildElement} children
 * @returns {HTMLElement}
 */
export function fieldset(attrs, ...children) {return element("fieldset", attrs, ...children);}
/**
 * @param {Attrs} attrs
 * @param  {...ChildElement} children
 * @returns {HTMLElement}
 */
export function figcaption(attrs, ...children) {return element("figcaption", attrs, ...children);}
/**
 * @param {Attrs} attrs
 * @param  {...ChildElement} children
 * @returns {HTMLElement}
 */
export function figure(attrs, ...children) {return element("figure", attrs, ...children);}
/**
 * @param {Attrs} attrs
 * @param  {...ChildElement} children
 * @returns {HTMLElement}
 */
export function footer(attrs, ...children) {return element("footer", attrs, ...children);}
/**
 * @param {Attrs} attrs
 * @param  {...ChildElement} children
 * @returns {HTMLElement}
 */
export function form(attrs, ...children) {return element("form", attrs, ...children);}
/**
 * @param {Attrs} attrs
 * @param  {...ChildElement} children
 * @returns {HTMLElement}
 */
export function h1(attrs, ...children) {return element("h1", attrs, ...children);}
/**
 * @param {Attrs} attrs
 * @param  {...ChildElement} children
 * @returns {HTMLElement}
 */
export function h2(attrs, ...children) {return element("h2", attrs, ...children);}
/**
 * @param {Attrs} attrs
 * @param  {...ChildElement} children
 * @returns {HTMLElement}
 */
export function h3(attrs, ...children) {return element("h3", attrs, ...children);}
/**
 * @param {Attrs} attrs
 * @param  {...ChildElement} children
 * @returns {HTMLElement}
 */
export function h4(attrs, ...children) {return element("h4", attrs, ...children);}
/**
 * @param {Attrs} attrs
 * @param  {...ChildElement} children
 * @returns {HTMLElement}
 */
export function h5(attrs, ...children) {return element("h5", attrs, ...children);}
/**
 * @param {Attrs} attrs
 * @param  {...ChildElement} children
 * @returns {HTMLElement}
 */
export function h6(attrs, ...children) {return element("h6", attrs, ...children);}
/**
 * @param {Attrs} attrs
 * @param  {...ChildElement} children
 * @returns {HTMLElement}
 */
export function head(attrs, ...children) {return element("head", attrs, ...children);}
/**
 * @param {Attrs} attrs
 * @param  {...ChildElement} children
 * @returns {HTMLElement}
 */
export function header(attrs, ...children) {return element("header", attrs, ...children);}
/**
 * @param {Attrs} attrs
 * @param  {...ChildElement} children
 * @returns {HTMLElement}
 */
export function hgroup(attrs, ...children) {return element("hgroup", attrs, ...children);}
/**
 * @param {Attrs} attrs
 * @param  {...ChildElement} children
 * @returns {HTMLElement}
 */
export function hr(attrs, ...children) {return element("hr", attrs, ...children);}
/**
 * @param {Attrs} attrs
 * @param  {...ChildElement} children
 * @returns {HTMLElement}
 */
export function html(attrs, ...children) {return element("html", attrs, ...children);}
/**
 * @param {Attrs} attrs
 * @param  {...ChildElement} children
 * @returns {HTMLElement}
 */
export function i(attrs, ...children) {return element("i", attrs, ...children);}
/**
 * @param {Attrs} attrs
 * @param  {...ChildElement} children
 * @returns {HTMLElement}
 */
export function iframe(attrs, ...children) {return element("iframe", attrs, ...children);}
/**
 * @param {Attrs} attrs
 * @param  {...ChildElement} children
 * @returns {HTMLElement}
 */
export function img(attrs, ...children) {return element("img", attrs, ...children);}
/**
 * @param {Attrs} attrs
 * @param  {...ChildElement} children
 * @returns {HTMLElement}
 */
export function input(attrs, ...children) {return element("input", attrs, ...children);}
/**
 * @param {Attrs} attrs
 * @param  {...ChildElement} children
 * @returns {HTMLElement}
 */
export function ins(attrs, ...children) {return element("ins", attrs, ...children);}
/**
 * @param {Attrs} attrs
 * @param  {...ChildElement} children
 * @returns {HTMLElement}
 */
export function kbd(attrs, ...children) {return element("kbd", attrs, ...children);}
/**
 * @param {Attrs} attrs
 * @param  {...ChildElement} children
 * @returns {HTMLElement}
 */
export function label(attrs, ...children) {return element("label", attrs, ...children);}
/**
 * @param {Attrs} attrs
 * @param  {...ChildElement} children
 * @returns {HTMLElement}
 */
export function legend(attrs, ...children) {return element("legend", attrs, ...children);}
/**
 * @param {Attrs} attrs
 * @param  {...ChildElement} children
 * @returns {HTMLElement}
 */
export function li(attrs, ...children) {return element("li", attrs, ...children);}
/**
 * @param {Attrs} attrs
 * @param  {...ChildElement} children
 * @returns {HTMLElement}
 */
export function link(attrs, ...children) {return element("link", attrs, ...children);}
/**
 * @param {Attrs} attrs
 * @param  {...ChildElement} children
 * @returns {HTMLElement}
 */
export function main(attrs, ...children) {return element("main", attrs, ...children);}
/**
 * @param {Attrs} attrs
 * @param  {...ChildElement} children
 * @returns {HTMLElement}
 */
export function map(attrs, ...children) {return element("map", attrs, ...children);}
/**
 * @param {Attrs} attrs
 * @param  {...ChildElement} children
 * @returns {HTMLElement}
 */
export function mark(attrs, ...children) {return element("mark", attrs, ...children);}
/**
 * @param {Attrs} attrs
 * @param  {...ChildElement} children
 * @returns {HTMLElement}
 */
export function menu(attrs, ...children) {return element("menu", attrs, ...children);}
/**
 * @param {Attrs} attrs
 * @param  {...ChildElement} children
 * @returns {HTMLElement}
 */
export function meta(attrs, ...children) {return element("meta", attrs, ...children);}
/**
 * @param {Attrs} attrs
 * @param  {...ChildElement} children
 * @returns {HTMLElement}
 */
export function meter(attrs, ...children) {return element("meter", attrs, ...children);}
/**
 * @param {Attrs} attrs
 * @param  {...ChildElement} children
 * @returns {HTMLElement}
 */
export function nav(attrs, ...children) {return element("nav", attrs, ...children);}
/**
 * @param {Attrs} attrs
 * @param  {...ChildElement} children
 * @returns {HTMLElement}
 */
export function noscript(attrs, ...children) {return element("noscript", attrs, ...children);}
/**
 * @param {Attrs} attrs
 * @param  {...ChildElement} children
 * @returns {HTMLElement}
 */
export function object(attrs, ...children) {return element("object", attrs, ...children);}
/**
 * @param {Attrs} attrs
 * @param  {...ChildElement} children
 * @returns {HTMLElement}
 */
export function ol(attrs, ...children) {return element("ol", attrs, ...children);}
/**
 * @param {Attrs} attrs
 * @param  {...ChildElement} children
 * @returns {HTMLElement}
 */
export function optgroup(attrs, ...children) {return element("optgroup", attrs, ...children);}
/**
 * @param {Attrs} attrs
 * @param  {...ChildElement} children
 * @returns {HTMLElement}
 */
export function option(attrs, ...children) {return element("option", attrs, ...children);}
/**
 * @param {Attrs} attrs
 * @param  {...ChildElement} children
 * @returns {HTMLElement}
 */
export function output(attrs, ...children) {return element("output", attrs, ...children);}
/**
 * @param {Attrs} attrs
 * @param  {...ChildElement} children
 * @returns {HTMLElement}
 */
export function p(attrs, ...children) {return element("p", attrs, ...children);}
/**
 * @param {Attrs} attrs
 * @param  {...ChildElement} children
 * @returns {HTMLElement}
 */
export function param(attrs, ...children) {return element("param", attrs, ...children);}
/**
 * @param {Attrs} attrs
 * @param  {...ChildElement} children
 * @returns {HTMLElement}
 */
export function picture(attrs, ...children) {return element("picture", attrs, ...children);}
/**
 * @param {Attrs} attrs
 * @param  {...ChildElement} children
 * @returns {HTMLElement}
 */
export function pre(attrs, ...children) {return element("pre", attrs, ...children);}
/**
 * @param {Attrs} attrs
 * @param  {...ChildElement} children
 * @returns {HTMLElement}
 */
export function progress(attrs, ...children) {return element("progress", attrs, ...children);}
/**
 * @param {Attrs} attrs
 * @param  {...ChildElement} children
 * @returns {HTMLElement}
 */
export function q(attrs, ...children) {return element("q", attrs, ...children);}
/**
 * @param {Attrs} attrs
 * @param  {...ChildElement} children
 * @returns {HTMLElement}
 */
export function rp(attrs, ...children) {return element("rp", attrs, ...children);}
/**
 * @param {Attrs} attrs
 * @param  {...ChildElement} children
 * @returns {HTMLElement}
 */
export function rt(attrs, ...children) {return element("rt", attrs, ...children);}
/**
 * @param {Attrs} attrs
 * @param  {...ChildElement} children
 * @returns {HTMLElement}
 */
export function ruby(attrs, ...children) {return element("ruby", attrs, ...children);}
/**
 * @param {Attrs} attrs
 * @param  {...ChildElement} children
 * @returns {HTMLElement}
 */
export function s(attrs, ...children) {return element("s", attrs, ...children);}
/**
 * @param {Attrs} attrs
 * @param  {...ChildElement} children
 * @returns {HTMLElement}
 */
export function samp(attrs, ...children) {return element("samp", attrs, ...children);}
/**
 * @param {Attrs} attrs
 * @param  {...ChildElement} children
 * @returns {HTMLElement}
 */
export function script(attrs, ...children) {return element("script", attrs, ...children);}
/**
 * @param {Attrs} attrs
 * @param  {...ChildElement} children
 * @returns {HTMLElement}
 */
export function search(attrs, ...children) {return element("search", attrs, ...children);}
/**
 * @param {Attrs} attrs
 * @param  {...ChildElement} children
 * @returns {HTMLElement}
 */
export function section(attrs, ...children) {return element("section", attrs, ...children);}
/**
 * @param {Attrs} attrs
 * @param  {...ChildElement} children
 * @returns {HTMLElement}
 */
export function select(attrs, ...children) {return element("select", attrs, ...children);}
/**
 * @param {Attrs} attrs
 * @param  {...ChildElement} children
 * @returns {HTMLElement}
 */
export function small(attrs, ...children) {return element("small", attrs, ...children);}
/**
 * @param {Attrs} attrs
 * @param  {...ChildElement} children
 * @returns {HTMLElement}
 */
export function source(attrs, ...children) {return element("source", attrs, ...children);}
/**
 * @param {Attrs} attrs
 * @param  {...ChildElement} children
 * @returns {HTMLElement}
 */
export function span(attrs, ...children) {return element("span", attrs, ...children);}
/**
 * @param {Attrs} attrs
 * @param  {...ChildElement} children
 * @returns {HTMLElement}
 */
export function strong(attrs, ...children) {return element("strong", attrs, ...children);}
/**
 * @param {Attrs} attrs
 * @param  {...ChildElement} children
 * @returns {HTMLElement}
 */
export function style(attrs, ...children) {return element("style", attrs, ...children);}
/**
 * @param {Attrs} attrs
 * @param  {...ChildElement} children
 * @returns {HTMLElement}
 */
export function sub(attrs, ...children) {return element("sub", attrs, ...children);}
/**
 * @param {Attrs} attrs
 * @param  {...ChildElement} children
 * @returns {HTMLElement}
 */
export function summary(attrs, ...children) {return element("summary", attrs, ...children);}
/**
 * @param {Attrs} attrs
 * @param  {...ChildElement} children
 * @returns {HTMLElement}
 */
export function sup(attrs, ...children) {return element("sup", attrs, ...children);}
/**
 * @param {Attrs} attrs
 * @param  {...ChildElement} children
 * @returns {HTMLElement}
 */
export function svg(attrs, ...children) {return element("svg", attrs, ...children);}
/**
 * @param {Attrs} attrs
 * @param  {...ChildElement} children
 * @returns {HTMLElement}
 */
export function table(attrs, ...children) {return element("table", attrs, ...children);}
/**
 * @param {Attrs} attrs
 * @param  {...ChildElement} children
 * @returns {HTMLElement}
 */
export function tbody(attrs, ...children) {return element("tbody", attrs, ...children);}
/**
 * @param {Attrs} attrs
 * @param  {...ChildElement} children
 * @returns {HTMLElement}
 */
export function td(attrs, ...children) {return element("td", attrs, ...children);}
/**
 * @param {Attrs} attrs
 * @param  {...ChildElement} children
 * @returns {HTMLElement}
 */
export function template(attrs, ...children) {return element("template", attrs, ...children);}
/**
 * @param {Attrs} attrs
 * @param  {...ChildElement} children
 * @returns {HTMLElement}
 */
export function textarea(attrs, ...children) {return element("textarea", attrs, ...children);}
/**
 * @param {Attrs} attrs
 * @param  {...ChildElement} children
 * @returns {HTMLElement}
 */
export function tfoot(attrs, ...children) {return element("tfoot", attrs, ...children);}
/**
 * @param {Attrs} attrs
 * @param  {...ChildElement} children
 * @returns {HTMLElement}
 */
export function th(attrs, ...children) {return element("th", attrs, ...children);}
/**
 * @param {Attrs} attrs
 * @param  {...ChildElement} children
 * @returns {HTMLElement}
 */
export function thead(attrs, ...children) {return element("thead", attrs, ...children);}
/**
 * @param {Attrs} attrs
 * @param  {...ChildElement} children
 * @returns {HTMLElement}
 */
export function time(attrs, ...children) {return element("time", attrs, ...children);}
/**
 * @param {Attrs} attrs
 * @param  {...ChildElement} children
 * @returns {HTMLElement}
 */
export function title(attrs, ...children) {return element("title", attrs, ...children);}
/**
 * @param {Attrs} attrs
 * @param  {...ChildElement} children
 * @returns {HTMLElement}
 */
export function tr(attrs, ...children) {return element("tr", attrs, ...children);}
/**
 * @param {Attrs} attrs
 * @param  {...ChildElement} children
 * @returns {HTMLElement}
 */
export function track(attrs, ...children) {return element("track", attrs, ...children);}
/**
 * @param {Attrs} attrs
 * @param  {...ChildElement} children
 * @returns {HTMLElement}
 */
export function u(attrs, ...children) {return element("u", attrs, ...children);}
/**
 * @param {Attrs} attrs
 * @param  {...ChildElement} children
 * @returns {HTMLElement}
 */
export function ul(attrs, ...children) {return element("ul", attrs, ...children);}
/**
 * @param {Attrs} attrs
 * @param  {...ChildElement} children
 * @returns {HTMLElement}
 */
export function Var(attrs, ...children) {return element("var", attrs, ...children);}
/**
 * @param {Attrs} attrs
 * @param  {...ChildElement} children
 * @returns {HTMLElement}
 */
export function video(attrs, ...children) {return element("video", attrs, ...children);}
/**
 * @param {Attrs} attrs
 * @param  {...ChildElement} children
 * @returns {HTMLElement}
 */
export function wbr(attrs, ...children) {return element("wbr", attrs, ...children);}