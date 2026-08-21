/*#region License
Copyright 2026 Ethan Morton

Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at

	http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License.
#endregion*/

//#region Type Definitions
/**
 * A ChildElement is an HTMLElement/string/function that represents the child of another element.
 * @typedef {(HTMLElement|string|Component|ChildElement[])} ChildElement
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
 * button().and(btn => btn.onclick = someFunction)
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
 * router("/404", {
 *   "/": index(),
 *   "/404": notFound(),
 *   "/combined/path": somePage(),
 *   "/composed": {
 *     "/path": otherPage(),
 *     "/hello": "Hello, World!"
 *   }
 * })
 * ```
 * @typedef {Object.<string, (Routes|HTMLElement|string|Component)>} Routes
 */

/**
 * HTMLElement attributes.
 * @typedef {Object.<string, string>} Attrs
 */

/**
 * Function that executes when a signal is updated.
 * @callback Subscriber
 * @param {any} value
 */

/**
 * Function to update the value of a signal. The value is passed in as an argument
 * and can be directly modified. The signal state will be set to whatever the function returns.
 * @callback Updater
 * @param {any} value
 * @returns {any}
 */

/**
 * This callback defines how a child element should be created when a signal is updated.
 * Since this is a function, it shouldn't return a function.
 * @callback Procreate
 * @param {any} $state
 * @return {(HTMLElement|string)}
 */

/**
 * This callback defines how child elements should be created when a signal is updated.
 * Since this is a function, it shouldn't return a function.
 * @callback ProcreateMany
 * @param {any} $state
 * @return {(HTMLElement|string)[]}
 */

/**
 * Maps an event into data used to set the value of a signal.
 * @callback MapEvent
 * @param {Event} event
 * @param {any} signalValue
 * @return {any}
 */

/**
 * Maps an event into data used to set the value of a signal.
 * @callback MapAttr
 * @param {any} signalValue
 * @return {any}
 */
//#endregion

//#region Library Checks
function checkSymbolConflicts() {
	const defined = [];
	for (const name of ['and', '$eventIn', '$attrOut', '$childrenOut', '$childOut']) {
		if (HTMLElement.prototype[name]) {
			defined.push(name);
		}
	}
	if (defined.length > 0) {
		throw Error(`xsml: methods already defined by something else under HTMLElement.prototype: ${defined.join(", ")}`);
	}
}
checkSymbolConflicts();
//#endregion

//#region Signals
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
	 * @type {Subscriber[]}
	 * @protected
	 */
	this._subs = [];
}

/**
 * Gets the state of the signal.
 * @return {any}
 */
$.prototype.get = function() {return this._state;}

/**
 * Sets the state of this signal and notifies every subscriber.
 * @param {any} value
 */
$.prototype.set = function(value) {
	this._state = value;
	this._subs.forEach(notify => notify(value));
};

/**
 * Uses a function to modify the current value of a signal.
 * The signal state is set to the return value of the function.
 * All subscribers are then notified.
 * @param {Updater} callback
 */
$.prototype.update = function(callback) {
	this._state = callback(this._state);
	this._subs.forEach(notify => notify(this._state));
};

/**
 * Adds a custom subscriber to this signal which will be called when the signal's value is updated.
 * @param {Subscriber} sub
 */
$.prototype.pushSub = function(sub) {this._subs.push(sub);}

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
	this.addEventListener(event, e => signal.set(mapEvent(e, signal.get())));
	return this;
};

/**
 * Registers this element's attribute to be updated when the set method is called on this signal.
 * This can be called multiple on times an element for different attributes.
 * You should not call this multiple times on an element for the same attribute.
 *
 * If the callback is undefined, the attribute will be directly set to the value of the signal.
 * @param {$} signal
 * @param {string} attr
 * @param {(MapAttr|undefined)} mapAttr
 * @return {HTMLElement}
 */
HTMLElement.prototype.$attrOut = function(signal, attr, mapAttr) {
	const update = mapAttr === undefined
		? value => this.setAttribute(attr, value)
		: value => this.setAttribute(attr, mapAttr(value));
	update(signal.get());
	signal._subs.push(update);
	return this;
};

/**
 * Registers this element's children to be replaced with the result of the procreate callback
 * when the set method is called on this signal.
 * This should only be called once per element.
 *
 * If the callback is undefined, it assumes the signal holds an array of valid elements
 * and tries to render them directly.
 * @param {$} signal
 * @param {(ProcreateMany|undefined)} procreate
 * @return {HTMLElement}
 */
HTMLElement.prototype.$childrenOut = function(signal, procreate) {
	const update = procreate === undefined
		? value => this.replaceChildren(...value)
		: value => this.replaceChildren(...procreate(value));
	update(signal.get());
	signal._subs.push(update);
	return this;
};

/**
 * Registers this element's child to be replaced with the result of the procreate callback
 * when the set method is called on this signal.
 * This should only be called once per element.
 *
 * If the callback is undefined, it assumes the signal holds a valid element
 * and tries to render it directly.
 * @param {$} signal
 * @param {(Procreate|undefined)} procreate
 * @return {HTMLElement}
 */
HTMLElement.prototype.$childOut = function(signal, procreate) {
	const update = procreate === undefined
		? value => this.replaceChildren(value)
		: value => this.replaceChildren(procreate(value));
	update(signal.get());
	signal._subs.push(update);
	return this;
};
//#endregion

//#region Elements
/**
 * This method allows modification of an element from within the component structure.
 * It returns the element it was called on so your hierarchy in code is not disrupted.
 * ## Example
 * ```js
 * button().and(btn => btn.onclick = someFunction)
 * ```
 * @param {AndCallback} callback
 * @returns {HTMLElement}
 */
HTMLElement.prototype.and = function(callback) {
	callback(this);
	return this;
};

/**
 * Appends `child` as a child element of `parent`
 * @param {HTMLElement} parent
 * @param {ChildElement} child
 * @throws {Error}
 */
function renderElement(parent, child) {
	// undefined/null is helpful for conditionally rendering elements
	if (child === null || child === undefined) {return;}

	const childType = typeof child;
	if (child instanceof HTMLElement) {
		parent.appendChild(child);
	} else if (childType === 'function') {
		renderElement(parent, child());
	} else if (childType === 'string') {
		parent.appendChild(document.createTextNode(child));
	} else if (Array.isArray(child)) {
		child.forEach(c => renderElement(parent, c));
	} else {
		throw Error(`Invalid element type. Expected HTMLElement/Component/string, got ${child?.constructor ?? child}`);
	}
}

/**
 * @param {(Attrs|ChildElement)} value
 * @returns {boolean}
 */
function isAttr(value) {
	return typeof value === 'object'
		&& value !== null
		&& !(value instanceof HTMLElement)
		&& !Array.isArray(value);
}

/**
 * Basic element constructor. All provided tag functions call this.
 * You shouldn't need this unless you need to create an element with a custom tag name.
 * For example, you might have a custom web component.
 * @param {string} name
 * @param {(Attrs|ChildElement|undefined)} attrsOrChild
 * @param  {...ChildElement} remainingChildren
 * @returns {HTMLElement}
 * @throws {Error}
 */
export function element(name, attrsOrChild, ...remainingChildren) {
	let attrs = {};
	let children = [];
	if (isAttr(attrsOrChild)) {
		attrs = attrsOrChild;
		children = remainingChildren;
	} else {
		children = attrsOrChild === undefined
			? remainingChildren
			: [attrsOrChild, ...remainingChildren];
	}
	const parent = document.createElement(name);
	for (const attr in attrs) {
		const value = attrs[attr];
		if (value === false || value === null || value === undefined) {
			parent.removeAttribute(attr);
		} else {
			parent.setAttribute(attr, value);
		}
	}
	children.forEach(child => renderElement(parent, child));
	return parent;
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
		if (routeType === 'string' || routeType === 'function' || route instanceof HTMLElement) {
			collapsed[newPath] = route;
		} else if (routeType === 'object') {
			// If the route is an object, we can just assume it's a nested route table
			// and hope it was configured correctly.
			collapseRoutes(route, collapsed, newPath);
		} else {
			throw Error(`Invalid router configuration. Expected type HTMLElement/Component/Route/string, got ${routeType}`);
		}
	}
	return collapsed;
}

/**
 * @param {HTMLElement} routerElement
 * @param {(Routes|HTMLElement|string|Component)} content
 * @throws {Error}
 */
function displayRoute(routerElement, content) {
	const contentType = typeof content;
	if (contentType === 'string') {
		routerElement.textContent = content;
	} else if (contentType === 'function') {
		displayRoute(routerElement, content());
	} else if (content instanceof HTMLElement) {
		routerElement.replaceChildren(content);
	} else if (Array.isArray(content)) {
		routerElement.replaceChildren();
		content.forEach(c => renderElement(routerElement, c));
	} else {
		throw Error(`Invalid route for pathname: ${location.pathname} - content: ${content}`);
	}
}

/**
 * @param {HTMLElement} routerElement
 * @param {string} notFoundPath
 * @param {Routes} routes
 * @throws {Error}
 */
function renderRoute(routerElement, notFoundPath, routes) {
	displayRoute(routerElement, routes[location.pathname] ?? routes[notFoundPath]);
}

/**
 * Creates a router for a client-side rendered single-page application.
 * You must only create one router in the whole application.
 * Creating multiple routers will lead to weird behavior.
 *
 * Routes are used to configure a router. It is recommended to use a "/" path, but it's not required.
 * You can specify a fallback path and compose router objects.
 * The route must either be an HTMLElement, string, function, or a recursive route object.
 * The router directly reads the `document.pathname`.
 * The router does not check to make sure your paths are reachable or has duplicates.
 * ## Example
 * ```js
 * router("/404", {
 *   "/": index(),
 *   "/404": notFound(),
 *   "/combined/path": somePage(),
 *   "/composed": {
 *     "/path": otherPage(),
 *     "/hello": "Hello, World!"
 *   }
 * })
 * ```
 * @param {string} notFoundPath
 * @param {(Attrs|Routes)} attrs
 * @param {(Routes|undefined)} routes
 * @returns {HTMLElement}
 * @throws {Error}
 */
export function router(notFoundPath, attrs, routes = undefined) {
	if (routes === undefined) {
		// If routes is undefined then it means attributes weren't supplied,
		// and the attrs variable actually contains the route table.
		routes = attrs;
		attrs = {};
	}
	const router = div({ ...attrs, id: "xsml-router" });
	const collapsedRoutes = collapseRoutes(routes);
	document.addEventListener('click', (e) => {
		const link = e.target.closest('a');
		if (
			!link ||
			link.origin !== location.origin ||
			link.target === '_blank' ||
			link.hasAttribute('download') ||
			e.button !== 0 ||
			e.metaKey || e.ctrlKey || e.shiftKey || e.altKey
		) return;
		if (link.pathname === location.pathname && link.hash) return; // let same-page anchors scroll natively
		e.preventDefault();
		history.pushState({}, '', link.pathname);
		renderRoute(router, notFoundPath, collapsedRoutes);
	});
	window.onpopstate = _ => renderRoute(router, notFoundPath, collapsedRoutes);
	renderRoute(router, notFoundPath, collapsedRoutes);
	return router;
}

/**
 * This is the entry point of the xsml app.
 * This appends ui as a child of the body element after all other children.
 * @param {ChildElement} ui
 */
export function xsml(ui) {
	window.onbeforeunload = (_) => {
		document.documentElement.style.visibility = 'hidden';
	};
	window.onload = (_) => {
		document.documentElement.style.visibility = 'visible';
	};
	renderElement(document.body, ui);
	document.documentElement.style.visibility = 'visible';
}
//#endregion

//#region Tag Functions
// Functions for standard HTML5 tags.
// Only tags that can go in a body are included (base, html, head, and body are excluded).
// Experimental tags are marked as such.
// Deprecated tags are excluded.
// See https://developer.mozilla.org/en-US/docs/Web/HTML/Guides/Content_categories

/**
 * @param {(Attrs|ChildElement|undefined)} attrsOrChild
 * @param  {...ChildElement} remainingChildren
 * @returns {HTMLElement}
 */
export function a(attrsOrChild = undefined, ...remainingChildren) {return element("a", attrsOrChild, ...remainingChildren);}
/**
 * @param {(Attrs|ChildElement|undefined)} attrsOrChild
 * @param  {...ChildElement} remainingChildren
 * @returns {HTMLElement}
 */
export function abbr(attrsOrChild = undefined, ...remainingChildren) {return element("abbr", attrsOrChild, ...remainingChildren);}
/**
 * @param {(Attrs|ChildElement|undefined)} attrsOrChild
 * @param  {...ChildElement} remainingChildren
 * @returns {HTMLElement}
 */
export function address(attrsOrChild = undefined, ...remainingChildren) {return element("address", attrsOrChild, ...remainingChildren);}
/**
 * @param {(Attrs|ChildElement|undefined)} attrsOrChild
 * @param  {...ChildElement} remainingChildren
 * @returns {HTMLElement}
 */
export function area(attrsOrChild = undefined, ...remainingChildren) {return element("area", attrsOrChild, ...remainingChildren);}
/**
 * @param {(Attrs|ChildElement|undefined)} attrsOrChild
 * @param  {...ChildElement} remainingChildren
 * @returns {HTMLElement}
 */
export function article(attrsOrChild = undefined, ...remainingChildren) {return element("article", attrsOrChild, ...remainingChildren);}
/**
 * @param {(Attrs|ChildElement|undefined)} attrsOrChild
 * @param  {...ChildElement} remainingChildren
 * @returns {HTMLElement}
 */
export function aside(attrsOrChild = undefined, ...remainingChildren) {return element("aside", attrsOrChild, ...remainingChildren);}
/**
 * @param {(Attrs|ChildElement|undefined)} attrsOrChild
 * @param  {...ChildElement} remainingChildren
 * @returns {HTMLElement}
 */
export function audio(attrsOrChild = undefined, ...remainingChildren) {return element("audio", attrsOrChild, ...remainingChildren);}
/**
 * @param {(Attrs|ChildElement|undefined)} attrsOrChild
 * @param  {...ChildElement} remainingChildren
 * @returns {HTMLElement}
 */
export function b(attrsOrChild = undefined, ...remainingChildren) {return element("b", attrsOrChild, ...remainingChildren);}
/**
 * @param {(Attrs|ChildElement|undefined)} attrsOrChild
 * @param  {...ChildElement} remainingChildren
 * @returns {HTMLElement}
 */
export function bdi(attrsOrChild = undefined, ...remainingChildren) {return element("bdi", attrsOrChild, ...remainingChildren);}
/**
 * @param {(Attrs|ChildElement|undefined)} attrsOrChild
 * @param  {...ChildElement} remainingChildren
 * @returns {HTMLElement}
 */
export function bdo(attrsOrChild = undefined, ...remainingChildren) {return element("bdo", attrsOrChild, ...remainingChildren);}
/**
 * @param {(Attrs|ChildElement|undefined)} attrsOrChild
 * @param  {...ChildElement} remainingChildren
 * @returns {HTMLElement}
 */
export function blockquote(attrsOrChild = undefined, ...remainingChildren) {return element("blockquote", attrsOrChild, ...remainingChildren);}
/**
 * @param {(Attrs|ChildElement|undefined)} attrsOrChild
 * @param  {...ChildElement} remainingChildren
 * @returns {HTMLElement}
 */
export function br(attrsOrChild = undefined, ...remainingChildren) {return element("br", attrsOrChild, ...remainingChildren);}
/**
 * @param {(Attrs|ChildElement|undefined)} attrsOrChild
 * @param  {...ChildElement} remainingChildren
 * @returns {HTMLElement}
 */
export function button(attrsOrChild = undefined, ...remainingChildren) {return element("button", attrsOrChild, ...remainingChildren);}
/**
 * @param {(Attrs|ChildElement|undefined)} attrsOrChild
 * @param  {...ChildElement} remainingChildren
 * @returns {HTMLElement}
 */
export function canvas(attrsOrChild = undefined, ...remainingChildren) {return element("canvas", attrsOrChild, ...remainingChildren);}
/**
 * @param {(Attrs|ChildElement|undefined)} attrsOrChild
 * @param  {...ChildElement} remainingChildren
 * @returns {HTMLElement}
 */
export function caption(attrsOrChild = undefined, ...remainingChildren) {return element("caption", attrsOrChild, ...remainingChildren);}
/**
 * @param {(Attrs|ChildElement|undefined)} attrsOrChild
 * @param  {...ChildElement} remainingChildren
 * @returns {HTMLElement}
 */
export function cite(attrsOrChild = undefined, ...remainingChildren) {return element("cite", attrsOrChild, ...remainingChildren);}
/**
 * @param {(Attrs|ChildElement|undefined)} attrsOrChild
 * @param  {...ChildElement} remainingChildren
 * @returns {HTMLElement}
 */
export function code(attrsOrChild = undefined, ...remainingChildren) {return element("code", attrsOrChild, ...remainingChildren);}
/**
 * @param {(Attrs|ChildElement|undefined)} attrsOrChild
 * @param  {...ChildElement} remainingChildren
 * @returns {HTMLElement}
 */
export function col(attrsOrChild = undefined, ...remainingChildren) {return element("col", attrsOrChild, ...remainingChildren);}
/**
 * @param {(Attrs|ChildElement|undefined)} attrsOrChild
 * @param  {...ChildElement} remainingChildren
 * @returns {HTMLElement}
 */
export function colgroup(attrsOrChild = undefined, ...remainingChildren) {return element("colgroup", attrsOrChild, ...remainingChildren);}
/**
 * @param {(Attrs|ChildElement|undefined)} attrsOrChild
 * @param  {...ChildElement} remainingChildren
 * @returns {HTMLElement}
 */
export function data(attrsOrChild = undefined, ...remainingChildren) {return element("data", attrsOrChild, ...remainingChildren);}
/**
 * @param {(Attrs|ChildElement|undefined)} attrsOrChild
 * @param  {...ChildElement} remainingChildren
 * @returns {HTMLElement}
 */
export function datalist(attrsOrChild = undefined, ...remainingChildren) {return element("datalist", attrsOrChild, ...remainingChildren);}
/**
 * @param {(Attrs|ChildElement|undefined)} attrsOrChild
 * @param  {...ChildElement} remainingChildren
 * @returns {HTMLElement}
 */
export function dd(attrsOrChild = undefined, ...remainingChildren) {return element("dd", attrsOrChild, ...remainingChildren);}
/**
 * @param {(Attrs|ChildElement|undefined)} attrsOrChild
 * @param  {...ChildElement} remainingChildren
 * @returns {HTMLElement}
 */
export function del(attrsOrChild = undefined, ...remainingChildren) {return element("del", attrsOrChild, ...remainingChildren);}
/**
 * @param {(Attrs|ChildElement|undefined)} attrsOrChild
 * @param  {...ChildElement} remainingChildren
 * @returns {HTMLElement}
 */
export function details(attrsOrChild = undefined, ...remainingChildren) {return element("details", attrsOrChild, ...remainingChildren);}
/**
 * @param {(Attrs|ChildElement|undefined)} attrsOrChild
 * @param  {...ChildElement} remainingChildren
 * @returns {HTMLElement}
 */
export function dfn(attrsOrChild = undefined, ...remainingChildren) {return element("dfn", attrsOrChild, ...remainingChildren);}
/**
 * @param {(Attrs|ChildElement|undefined)} attrsOrChild
 * @param  {...ChildElement} remainingChildren
 * @returns {HTMLElement}
 */
export function dialog(attrsOrChild = undefined, ...remainingChildren) {return element("dialog", attrsOrChild, ...remainingChildren);}
/**
 * @param {(Attrs|ChildElement|undefined)} attrsOrChild
 * @param  {...ChildElement} remainingChildren
 * @returns {HTMLElement}
 */
export function div(attrsOrChild = undefined, ...remainingChildren) {return element("div", attrsOrChild, ...remainingChildren);}
/**
 * @param {(Attrs|ChildElement|undefined)} attrsOrChild
 * @param  {...ChildElement} remainingChildren
 * @returns {HTMLElement}
 */
export function dl(attrsOrChild = undefined, ...remainingChildren) {return element("dl", attrsOrChild, ...remainingChildren);}
/**
 * @param {(Attrs|ChildElement|undefined)} attrsOrChild
 * @param  {...ChildElement} remainingChildren
 * @returns {HTMLElement}
 */
export function dt(attrsOrChild = undefined, ...remainingChildren) {return element("dt", attrsOrChild, ...remainingChildren);}
/**
 * @param {(Attrs|ChildElement|undefined)} attrsOrChild
 * @param  {...ChildElement} remainingChildren
 * @returns {HTMLElement}
 */
export function em(attrsOrChild = undefined, ...remainingChildren) {return element("em", attrsOrChild, ...remainingChildren);}
/**
 * @param {(Attrs|ChildElement|undefined)} attrsOrChild
 * @param  {...ChildElement} remainingChildren
 * @returns {HTMLElement}
 */
export function embed(attrsOrChild = undefined, ...remainingChildren) {return element("embed", attrsOrChild, ...remainingChildren);}
/**
 * @experimental https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Elements/fencedframe
 * @param {(Attrs|ChildElement|undefined)} attrsOrChild
 * @param  {...ChildElement} remainingChildren
 * @returns {HTMLElement}
 */
export function fencedframe(attrsOrChild = undefined, ...remainingChildren) {return element("fencedframe", attrsOrChild, ...remainingChildren);}
/**
 * @param {(Attrs|ChildElement|undefined)} attrsOrChild
 * @param  {...ChildElement} remainingChildren
 * @returns {HTMLElement}
 */
export function fieldset(attrsOrChild = undefined, ...remainingChildren) {return element("fieldset", attrsOrChild, ...remainingChildren);}
/**
 * @param {(Attrs|ChildElement|undefined)} attrsOrChild
 * @param  {...ChildElement} remainingChildren
 * @returns {HTMLElement}
 */
export function figcaption(attrsOrChild = undefined, ...remainingChildren) {return element("figcaption", attrsOrChild, ...remainingChildren);}
/**
 * @param {(Attrs|ChildElement|undefined)} attrsOrChild
 * @param  {...ChildElement} remainingChildren
 * @returns {HTMLElement}
 */
export function figure(attrsOrChild = undefined, ...remainingChildren) {return element("figure", attrsOrChild, ...remainingChildren);}
/**
 * @param {(Attrs|ChildElement|undefined)} attrsOrChild
 * @param  {...ChildElement} remainingChildren
 * @returns {HTMLElement}
 */
export function footer(attrsOrChild = undefined, ...remainingChildren) {return element("footer", attrsOrChild, ...remainingChildren);}
/**
 * @param {(Attrs|ChildElement|undefined)} attrsOrChild
 * @param  {...ChildElement} remainingChildren
 * @returns {HTMLElement}
 */
export function form(attrsOrChild = undefined, ...remainingChildren) {return element("form", attrsOrChild, ...remainingChildren);}
/**
 * @experimental https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Elements/geolocation
 * @param {(Attrs|ChildElement|undefined)} attrsOrChild
 * @param  {...ChildElement} remainingChildren
 * @returns {HTMLElement}
 */
export function geolocation(attrsOrChild = undefined, ...remainingChildren) {return element("geolocation", attrsOrChild, ...remainingChildren);}
/**
 * @param {(Attrs|ChildElement|undefined)} attrsOrChild
 * @param  {...ChildElement} remainingChildren
 * @returns {HTMLElement}
 */
export function h1(attrsOrChild = undefined, ...remainingChildren) {return element("h1", attrsOrChild, ...remainingChildren);}
/**
 * @param {(Attrs|ChildElement|undefined)} attrsOrChild
 * @param  {...ChildElement} remainingChildren
 * @returns {HTMLElement}
 */
export function h2(attrsOrChild = undefined, ...remainingChildren) {return element("h2", attrsOrChild, ...remainingChildren);}
/**
 * @param {(Attrs|ChildElement|undefined)} attrsOrChild
 * @param  {...ChildElement} remainingChildren
 * @returns {HTMLElement}
 */
export function h3(attrsOrChild = undefined, ...remainingChildren) {return element("h3", attrsOrChild, ...remainingChildren);}
/**
 * @param {(Attrs|ChildElement|undefined)} attrsOrChild
 * @param  {...ChildElement} remainingChildren
 * @returns {HTMLElement}
 */
export function h4(attrsOrChild = undefined, ...remainingChildren) {return element("h4", attrsOrChild, ...remainingChildren);}
/**
 * @param {(Attrs|ChildElement|undefined)} attrsOrChild
 * @param  {...ChildElement} remainingChildren
 * @returns {HTMLElement}
 */
export function h5(attrsOrChild = undefined, ...remainingChildren) {return element("h5", attrsOrChild, ...remainingChildren);}
/**
 * @param {(Attrs|ChildElement|undefined)} attrsOrChild
 * @param  {...ChildElement} remainingChildren
 * @returns {HTMLElement}
 */
export function h6(attrsOrChild = undefined, ...remainingChildren) {return element("h6", attrsOrChild, ...remainingChildren);}
/**
 * @param {(Attrs|ChildElement|undefined)} attrsOrChild
 * @param  {...ChildElement} remainingChildren
 * @returns {HTMLElement}
 */
export function header(attrsOrChild = undefined, ...remainingChildren) {return element("header", attrsOrChild, ...remainingChildren);}
/**
 * @param {(Attrs|ChildElement|undefined)} attrsOrChild
 * @param  {...ChildElement} remainingChildren
 * @returns {HTMLElement}
 */
export function hgroup(attrsOrChild = undefined, ...remainingChildren) {return element("hgroup", attrsOrChild, ...remainingChildren);}
/**
 * @param {(Attrs|ChildElement|undefined)} attrsOrChild
 * @param  {...ChildElement} remainingChildren
 * @returns {HTMLElement}
 */
export function hr(attrsOrChild = undefined, ...remainingChildren) {return element("hr", attrsOrChild, ...remainingChildren);}
/**
 * @param {(Attrs|ChildElement|undefined)} attrsOrChild
 * @param  {...ChildElement} remainingChildren
 * @returns {HTMLElement}
 */
export function i(attrsOrChild = undefined, ...remainingChildren) {return element("i", attrsOrChild, ...remainingChildren);}
/**
 * @param {(Attrs|ChildElement|undefined)} attrsOrChild
 * @param  {...ChildElement} remainingChildren
 * @returns {HTMLElement}
 */
export function iframe(attrsOrChild = undefined, ...remainingChildren) {return element("iframe", attrsOrChild, ...remainingChildren);}
/**
 * @param {(Attrs|ChildElement|undefined)} attrsOrChild
 * @param  {...ChildElement} remainingChildren
 * @returns {HTMLElement}
 */
export function img(attrsOrChild = undefined, ...remainingChildren) {return element("img", attrsOrChild, ...remainingChildren);}
/**
 * @param {(Attrs|ChildElement|undefined)} attrsOrChild
 * @param  {...ChildElement} remainingChildren
 * @returns {HTMLElement}
 */
export function input(attrsOrChild = undefined, ...remainingChildren) {return element("input", attrsOrChild, ...remainingChildren);}
/**
 * @param {(Attrs|ChildElement|undefined)} attrsOrChild
 * @param  {...ChildElement} remainingChildren
 * @returns {HTMLElement}
 */
export function ins(attrsOrChild = undefined, ...remainingChildren) {return element("ins", attrsOrChild, ...remainingChildren);}
/**
 * @param {(Attrs|ChildElement|undefined)} attrsOrChild
 * @param  {...ChildElement} remainingChildren
 * @returns {HTMLElement}
 */
export function kbd(attrsOrChild = undefined, ...remainingChildren) {return element("kbd", attrsOrChild, ...remainingChildren);}
/**
 * @param {(Attrs|ChildElement|undefined)} attrsOrChild
 * @param  {...ChildElement} remainingChildren
 * @returns {HTMLElement}
 */
export function label(attrsOrChild = undefined, ...remainingChildren) {return element("label", attrsOrChild, ...remainingChildren);}
/**
 * @param {(Attrs|ChildElement|undefined)} attrsOrChild
 * @param  {...ChildElement} remainingChildren
 * @returns {HTMLElement}
 */
export function legend(attrsOrChild = undefined, ...remainingChildren) {return element("legend", attrsOrChild, ...remainingChildren);}
/**
 * @param {(Attrs|ChildElement|undefined)} attrsOrChild
 * @param  {...ChildElement} remainingChildren
 * @returns {HTMLElement}
 */
export function li(attrsOrChild = undefined, ...remainingChildren) {return element("li", attrsOrChild, ...remainingChildren);}
/**
 * @param {(Attrs|ChildElement|undefined)} attrsOrChild
 * @param  {...ChildElement} remainingChildren
 * @returns {HTMLElement}
 */
export function link(attrsOrChild = undefined, ...remainingChildren) {return element("link", attrsOrChild, ...remainingChildren);}
/**
 * @param {(Attrs|ChildElement|undefined)} attrsOrChild
 * @param  {...ChildElement} remainingChildren
 * @returns {HTMLElement}
 */
export function main(attrsOrChild = undefined, ...remainingChildren) {return element("main", attrsOrChild, ...remainingChildren);}
/**
 * @param {(Attrs|ChildElement|undefined)} attrsOrChild
 * @param  {...ChildElement} remainingChildren
 * @returns {HTMLElement}
 */
export function map(attrsOrChild = undefined, ...remainingChildren) {return element("map", attrsOrChild, ...remainingChildren);}
/**
 * @param {(Attrs|ChildElement|undefined)} attrsOrChild
 * @param  {...ChildElement} remainingChildren
 * @returns {HTMLElement}
 */
export function mark(attrsOrChild = undefined, ...remainingChildren) {return element("mark", attrsOrChild, ...remainingChildren);}
/**
 * @param {(Attrs|ChildElement|undefined)} attrsOrChild
 * @param  {...ChildElement} remainingChildren
 * @returns {HTMLElement}
 */
export function math(attrsOrChild = undefined, ...remainingChildren) {return element("math", attrsOrChild, ...remainingChildren);}
/**
 * @param {(Attrs|ChildElement|undefined)} attrsOrChild
 * @param  {...ChildElement} remainingChildren
 * @returns {HTMLElement}
 */
export function menu(attrsOrChild = undefined, ...remainingChildren) {return element("menu", attrsOrChild, ...remainingChildren);}
/**
 * @param {(Attrs|ChildElement|undefined)} attrsOrChild
 * @param  {...ChildElement} remainingChildren
 * @returns {HTMLElement}
 */
export function meter(attrsOrChild = undefined, ...remainingChildren) {return element("meter", attrsOrChild, ...remainingChildren);}
/**
 * @param {(Attrs|ChildElement|undefined)} attrsOrChild
 * @param  {...ChildElement} remainingChildren
 * @returns {HTMLElement}
 */
export function nav(attrsOrChild = undefined, ...remainingChildren) {return element("nav", attrsOrChild, ...remainingChildren);}
/**
 * @param {(Attrs|ChildElement|undefined)} attrsOrChild
 * @param  {...ChildElement} remainingChildren
 * @returns {HTMLElement}
 */
export function noscript(attrsOrChild = undefined, ...remainingChildren) {return element("noscript", attrsOrChild, ...remainingChildren);}
/**
 * @param {(Attrs|ChildElement|undefined)} attrsOrChild
 * @param  {...ChildElement} remainingChildren
 * @returns {HTMLElement}
 */
export function object(attrsOrChild = undefined, ...remainingChildren) {return element("object", attrsOrChild, ...remainingChildren);}
/**
 * @param {(Attrs|ChildElement|undefined)} attrsOrChild
 * @param  {...ChildElement} remainingChildren
 * @returns {HTMLElement}
 */
export function ol(attrsOrChild = undefined, ...remainingChildren) {return element("ol", attrsOrChild, ...remainingChildren);}
/**
 * @param {(Attrs|ChildElement|undefined)} attrsOrChild
 * @param  {...ChildElement} remainingChildren
 * @returns {HTMLElement}
 */
export function optgroup(attrsOrChild = undefined, ...remainingChildren) {return element("optgroup", attrsOrChild, ...remainingChildren);}
/**
 * @param {(Attrs|ChildElement|undefined)} attrsOrChild
 * @param  {...ChildElement} remainingChildren
 * @returns {HTMLElement}
 */
export function option(attrsOrChild = undefined, ...remainingChildren) {return element("option", attrsOrChild, ...remainingChildren);}
/**
 * @param {(Attrs|ChildElement|undefined)} attrsOrChild
 * @param  {...ChildElement} remainingChildren
 * @returns {HTMLElement}
 */
export function output(attrsOrChild = undefined, ...remainingChildren) {return element("output", attrsOrChild, ...remainingChildren);}
/**
 * @param {(Attrs|ChildElement|undefined)} attrsOrChild
 * @param  {...ChildElement} remainingChildren
 * @returns {HTMLElement}
 */
export function p(attrsOrChild = undefined, ...remainingChildren) {return element("p", attrsOrChild, ...remainingChildren);}
/**
 * @param {(Attrs|ChildElement|undefined)} attrsOrChild
 * @param  {...ChildElement} remainingChildren
 * @returns {HTMLElement}
 */
export function picture(attrsOrChild = undefined, ...remainingChildren) {return element("picture", attrsOrChild, ...remainingChildren);}
/**
 * @param {(Attrs|ChildElement|undefined)} attrsOrChild
 * @param  {...ChildElement} remainingChildren
 * @returns {HTMLElement}
 */
export function pre(attrsOrChild = undefined, ...remainingChildren) {return element("pre", attrsOrChild, ...remainingChildren);}
/**
 * @param {(Attrs|ChildElement|undefined)} attrsOrChild
 * @param  {...ChildElement} remainingChildren
 * @returns {HTMLElement}
 */
export function progress(attrsOrChild = undefined, ...remainingChildren) {return element("progress", attrsOrChild, ...remainingChildren);}
/**
 * @param {(Attrs|ChildElement|undefined)} attrsOrChild
 * @param  {...ChildElement} remainingChildren
 * @returns {HTMLElement}
 */
export function q(attrsOrChild = undefined, ...remainingChildren) {return element("q", attrsOrChild, ...remainingChildren);}
/**
 * @param {(Attrs|ChildElement|undefined)} attrsOrChild
 * @param  {...ChildElement} remainingChildren
 * @returns {HTMLElement}
 */
export function rp(attrsOrChild = undefined, ...remainingChildren) {return element("rp", attrsOrChild, ...remainingChildren);}
/**
 * @param {(Attrs|ChildElement|undefined)} attrsOrChild
 * @param  {...ChildElement} remainingChildren
 * @returns {HTMLElement}
 */
export function rt(attrsOrChild = undefined, ...remainingChildren) {return element("rt", attrsOrChild, ...remainingChildren);}
/**
 * @param {(Attrs|ChildElement|undefined)} attrsOrChild
 * @param  {...ChildElement} remainingChildren
 * @returns {HTMLElement}
 */
export function ruby(attrsOrChild = undefined, ...remainingChildren) {return element("ruby", attrsOrChild, ...remainingChildren);}
/**
 * @param {(Attrs|ChildElement|undefined)} attrsOrChild
 * @param  {...ChildElement} remainingChildren
 * @returns {HTMLElement}
 */
export function s(attrsOrChild = undefined, ...remainingChildren) {return element("s", attrsOrChild, ...remainingChildren);}
/**
 * @param {(Attrs|ChildElement|undefined)} attrsOrChild
 * @param  {...ChildElement} remainingChildren
 * @returns {HTMLElement}
 */
export function samp(attrsOrChild = undefined, ...remainingChildren) {return element("samp", attrsOrChild, ...remainingChildren);}
/**
 * @param {(Attrs|ChildElement|undefined)} attrsOrChild
 * @param  {...ChildElement} remainingChildren
 * @returns {HTMLElement}
 */
export function script(attrsOrChild = undefined, ...remainingChildren) {return element("script", attrsOrChild, ...remainingChildren);}
/**
 * @param {(Attrs|ChildElement|undefined)} attrsOrChild
 * @param  {...ChildElement} remainingChildren
 * @returns {HTMLElement}
 */
export function search(attrsOrChild = undefined, ...remainingChildren) {return element("search", attrsOrChild, ...remainingChildren);}
/**
 * @param {(Attrs|ChildElement|undefined)} attrsOrChild
 * @param  {...ChildElement} remainingChildren
 * @returns {HTMLElement}
 */
export function section(attrsOrChild = undefined, ...remainingChildren) {return element("section", attrsOrChild, ...remainingChildren);}
/**
 * @param {(Attrs|ChildElement|undefined)} attrsOrChild
 * @param  {...ChildElement} remainingChildren
 * @returns {HTMLElement}
 */
export function select(attrsOrChild = undefined, ...remainingChildren) {return element("select", attrsOrChild, ...remainingChildren);}
/**
 * @param {(Attrs|ChildElement|undefined)} attrsOrChild
 * @param  {...ChildElement} remainingChildren
 * @returns {HTMLElement}
 */
export function slot(attrsOrChild = undefined, ...remainingChildren) {return element("slot", attrsOrChild, ...remainingChildren);}
/**
 * @param {(Attrs|ChildElement|undefined)} attrsOrChild
 * @param  {...ChildElement} remainingChildren
 * @returns {HTMLElement}
 */
export function small(attrsOrChild = undefined, ...remainingChildren) {return element("small", attrsOrChild, ...remainingChildren);}
/**
 * @param {(Attrs|ChildElement|undefined)} attrsOrChild
 * @param  {...ChildElement} remainingChildren
 * @returns {HTMLElement}
 */
export function source(attrsOrChild = undefined, ...remainingChildren) {return element("source", attrsOrChild, ...remainingChildren);}
/**
 * @param {(Attrs|ChildElement|undefined)} attrsOrChild
 * @param  {...ChildElement} remainingChildren
 * @returns {HTMLElement}
 */
export function span(attrsOrChild = undefined, ...remainingChildren) {return element("span", attrsOrChild, ...remainingChildren);}
/**
 * @param {(Attrs|ChildElement|undefined)} attrsOrChild
 * @param  {...ChildElement} remainingChildren
 * @returns {HTMLElement}
 */
export function strong(attrsOrChild = undefined, ...remainingChildren) {return element("strong", attrsOrChild, ...remainingChildren);}
/**
 * @param {(Attrs|ChildElement|undefined)} attrsOrChild
 * @param  {...ChildElement} remainingChildren
 * @returns {HTMLElement}
 */
export function style(attrsOrChild = undefined, ...remainingChildren) {return element("style", attrsOrChild, ...remainingChildren);}
/**
 * @param {(Attrs|ChildElement|undefined)} attrsOrChild
 * @param  {...ChildElement} remainingChildren
 * @returns {HTMLElement}
 */
export function sub(attrsOrChild = undefined, ...remainingChildren) {return element("sub", attrsOrChild, ...remainingChildren);}
/**
 * @param {(Attrs|ChildElement|undefined)} attrsOrChild
 * @param  {...ChildElement} remainingChildren
 * @returns {HTMLElement}
 */
export function summary(attrsOrChild = undefined, ...remainingChildren) {return element("summary", attrsOrChild, ...remainingChildren);}
/**
 * @param {(Attrs|ChildElement|undefined)} attrsOrChild
 * @param  {...ChildElement} remainingChildren
 * @returns {HTMLElement}
 */
export function sup(attrsOrChild = undefined, ...remainingChildren) {return element("sup", attrsOrChild, ...remainingChildren);}
/**
 * @param {(Attrs|ChildElement|undefined)} attrsOrChild
 * @param  {...ChildElement} remainingChildren
 * @returns {HTMLElement}
 */
export function svg(attrsOrChild = undefined, ...remainingChildren) {return element("svg", attrsOrChild, ...remainingChildren);}
/**
 * @param {(Attrs|ChildElement|undefined)} attrsOrChild
 * @param  {...ChildElement} remainingChildren
 * @returns {HTMLElement}
 */
export function table(attrsOrChild = undefined, ...remainingChildren) {return element("table", attrsOrChild, ...remainingChildren);}
/**
 * @param {(Attrs|ChildElement|undefined)} attrsOrChild
 * @param  {...ChildElement} remainingChildren
 * @returns {HTMLElement}
 */
export function tbody(attrsOrChild = undefined, ...remainingChildren) {return element("tbody", attrsOrChild, ...remainingChildren);}
/**
 * @param {(Attrs|ChildElement|undefined)} attrsOrChild
 * @param  {...ChildElement} remainingChildren
 * @returns {HTMLElement}
 */
export function td(attrsOrChild = undefined, ...remainingChildren) {return element("td", attrsOrChild, ...remainingChildren);}
/**
 * @param {(Attrs|ChildElement|undefined)} attrsOrChild
 * @param  {...ChildElement} remainingChildren
 * @returns {HTMLElement}
 */
export function template(attrsOrChild = undefined, ...remainingChildren) {return element("template", attrsOrChild, ...remainingChildren);}
/**
 * @param {(Attrs|ChildElement|undefined)} attrsOrChild
 * @param  {...ChildElement} remainingChildren
 * @returns {HTMLElement}
 */
export function textarea(attrsOrChild = undefined, ...remainingChildren) {return element("textarea", attrsOrChild, ...remainingChildren);}
/**
 * @param {(Attrs|ChildElement|undefined)} attrsOrChild
 * @param  {...ChildElement} remainingChildren
 * @returns {HTMLElement}
 */
export function tfoot(attrsOrChild = undefined, ...remainingChildren) {return element("tfoot", attrsOrChild, ...remainingChildren);}
/**
 * @param {(Attrs|ChildElement|undefined)} attrsOrChild
 * @param  {...ChildElement} remainingChildren
 * @returns {HTMLElement}
 */
export function th(attrsOrChild = undefined, ...remainingChildren) {return element("th", attrsOrChild, ...remainingChildren);}
/**
 * @param {(Attrs|ChildElement|undefined)} attrsOrChild
 * @param  {...ChildElement} remainingChildren
 * @returns {HTMLElement}
 */
export function thead(attrsOrChild = undefined, ...remainingChildren) {return element("thead", attrsOrChild, ...remainingChildren);}
/**
 * @param {(Attrs|ChildElement|undefined)} attrsOrChild
 * @param  {...ChildElement} remainingChildren
 * @returns {HTMLElement}
 */
export function time(attrsOrChild = undefined, ...remainingChildren) {return element("time", attrsOrChild, ...remainingChildren);}
/**
 * @param {(Attrs|ChildElement|undefined)} attrsOrChild
 * @param  {...ChildElement} remainingChildren
 * @returns {HTMLElement}
 */
export function title(attrsOrChild = undefined, ...remainingChildren) {return element("title", attrsOrChild, ...remainingChildren);}
/**
 * @param {(Attrs|ChildElement|undefined)} attrsOrChild
 * @param  {...ChildElement} remainingChildren
 * @returns {HTMLElement}
 */
export function tr(attrsOrChild = undefined, ...remainingChildren) {return element("tr", attrsOrChild, ...remainingChildren);}
/**
 * @param {(Attrs|ChildElement|undefined)} attrsOrChild
 * @param  {...ChildElement} remainingChildren
 * @returns {HTMLElement}
 */
export function track(attrsOrChild = undefined, ...remainingChildren) {return element("track", attrsOrChild, ...remainingChildren);}
/**
 * @param {(Attrs|ChildElement|undefined)} attrsOrChild
 * @param  {...ChildElement} remainingChildren
 * @returns {HTMLElement}
 */
export function u(attrsOrChild = undefined, ...remainingChildren) {return element("u", attrsOrChild, ...remainingChildren);}
/**
 * @param {(Attrs|ChildElement|undefined)} attrsOrChild
 * @param  {...ChildElement} remainingChildren
 * @returns {HTMLElement}
 */
export function ul(attrsOrChild = undefined, ...remainingChildren) {return element("ul", attrsOrChild, ...remainingChildren);}
/**
 * Var is capitalized to not conflict with the javascript keyword var.
 * @param {(Attrs|ChildElement|undefined)} attrsOrChild
 * @param  {...ChildElement} remainingChildren
 * @returns {HTMLElement}
 */
export function Var(attrsOrChild = undefined, ...remainingChildren) {return element("var", attrsOrChild, ...remainingChildren);}
/**
 * @param {(Attrs|ChildElement|undefined)} attrsOrChild
 * @param  {...ChildElement} remainingChildren
 * @returns {HTMLElement}
 */
export function video(attrsOrChild = undefined, ...remainingChildren) {return element("video", attrsOrChild, ...remainingChildren);}
/**
 * @param {(Attrs|ChildElement|undefined)} attrsOrChild
 * @param  {...ChildElement} remainingChildren
 * @returns {HTMLElement}
 */
export function wbr(attrsOrChild = undefined, ...remainingChildren) {return element("wbr", attrsOrChild, ...remainingChildren);}
//#endregion