//#region Type Definitions
/**
 * A ChildNode is a child HTMLElement or string of another element.
 * @typedef {(HTMLElement|string|Component)} ChildElement
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
 * @typedef {Object.<string, (Routes|HTMLElement|string|Component)>} Routes
 */

/**
 * HTMLElement attributes.
 * @typedef {Object.<string, string>} Attrs
 */

/**
 * @callback Subscriber
 * @param {any} value
 */

/**
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
 * Maps an event into data used to set the value of a signal
 * @callback MapEvent
 * @param {Event} event
 * @param {any} signalValue
 * @return {any}
 */

/**
 * Maps an event into data used to set the value of a signal
 * @callback MapAttr
 * @param {any} signalValue
 * @return {any}
 */
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
 * Sets the state of this signal and updates every subscriber.
 * @param {any} value
 */
$.prototype.set = function(value) {
	this._state = value;
	for (const sub of this._subs) {
		sub(value);
	}
};

/**
 * Uses a function to modify the current value then notify all subscribers.
 * @param {Updater} callback
 */
$.prototype.update = function(callback) {
	this._state = callback(this._state);
	for (const sub of this._subs) {
		sub(this._state);
	}
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
 * @param {$} signal
 * @param {string} attr
 * @param {MapAttr} mapAttr
 * @return {HTMLElement}
 */
HTMLElement.prototype.$attrOut = function(signal, attr, mapAttr) {
	const update = value => this[attr] = mapAttr(value);
	update(signal.get());
	signal._subs.push(update);
	return this;
};

/**
 * Registers this element's children to be replaced with the result of the procreate callback
 * when the set method is called on this signal.
 * This can be called multiple on times an element for different attributes.
 * You should not call this multiple times on an element for the same attribute.
 * @param {$} signal
 * @param {ProcreateMany} procreate
 * @return {HTMLElement}
 */
HTMLElement.prototype.$childrenOut = function(signal, procreate) {
	const update = value => this.replaceChildren(...procreate(value));
	update(signal.get());
	signal._subs.push(update);
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
HTMLElement.prototype.$childOut = function(signal, procreate) {
	const update = value => this.replaceChildren(procreate(value));
	update(signal.get());
	signal._subs.push(update);
	return this;
};
//#endregion

//#region Elements
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
 * Appends `child` as a child element of `parent`
 * @param {HTMLElement} parent
 * @param {ChildElement} child
 * @throws {Error}
 */
function renderElement(parent, child) {
	const childType = typeof child;
	if (child instanceof HTMLElement) {
		parent.appendChild(child);
	} else if (childType === 'function') {
		renderElement(parent, child());
	} else if (childType === 'string') {
		parent.textContent = (parent.textContent ?? "") + child;
	} else if (childType === 'undefined') {
		// undefined is helpful for conditionally rendering elements
	} else {
		throw Error(`Invalid child type. Expected HTMLElement/Component/string, got ${child.constructor}`);
	}
}

/**
 * Basic element constructor. You shouldn't need this unless you need to create an element with a custom tag name.
 * For example, you might have a custom web component.
 * @param {string} name
 * @param {Attrs} attrs
 * @param  {...ChildElement} children
 * @returns {HTMLElement}
 * @throws {Error}
 */
export function element(name, attrs, ...children) {
	const parent = document.createElement(name);
	for (const attr in attrs) {
		parent.setAttribute(attr, attrs[attr]);
	}
	for (const child of children) {
		renderElement(parent, child);
	}
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
			collapseRoutes(route, collapsed, newPath);
		} else {
			throw Error(`Invalid router configuration. Expected type HTMLElement/Component/Route/string, got ${routeType}`);
		}
	}
	return collapsed;
}

/**
 * @param {HTMLElement} router
 * @param {(Routes|HTMLElement|string|Component)} content
 * @throws {Error}
 */
function displayRoute(router, content) {
	const contentType = typeof content;
	if (contentType === 'string') {
		router.textContent = content;
	} else if (contentType === 'function') {
		displayRoute(router, content());
	} else if (content instanceof HTMLElement) {
		router.replaceChildren(content);
	} else {
		throw Error(`Invalid route for pathname: ${location.pathname} - content: ${content}`);
	}
}

/**
 * @param {HTMLElement} router
 * @param {string} notFoundPath
 * @param {Routes} routes
 * @throws {Error}
 */
function renderRoute(router, notFoundPath, routes) {
	const content = routes[location.pathname] ?? routes[notFoundPath];
	displayRoute(router, content);
}

/**
 * Creates a router for a client-side rendered single-page application.
 * You must only create one router in the whole application.
 * Creating multiple routers will lead to weird behavior.
 *
 * Routes are used to configure a router. It is recommended to use a "/" path, but it's not required.
 * You can specify a fallback path and compose router objects.
 * The route must either be an HTMLElement, string, or a recursive route object.
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
			renderRoute(router, notFoundPath, collapsedRoutes);
		}
	});
	window.onpopstate = _ => renderRoute(router, notFoundPath, collapsedRoutes);
	renderRoute(router, notFoundPath, collapsedRoutes);
	return router;
}

/**
 * This is the entry point of the jsml app.
 * This appends ui as a child of the body after all other children.
 * @param {ChildElement} ui
 */
export function jsml(ui) {renderElement(document.body, ui);}
//#endregion

//#region Tag Functions
// Functions for standard HTML5 tags.
// Only tags that can go in a body are included (base, html, head, and body are excluded).
// Experimental tags are marked as such.
// Deprecated tags are excluded.
// See https://developer.mozilla.org/en-US/docs/Web/HTML/Guides/Content_categories

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
 * @experimental https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Elements/fencedframe
 * @param {Attrs} attrs
 * @param  {...ChildElement} children
 * @returns {HTMLElement}
 */
export function fencedframe(attrs, ...children) {return element("fencedframe", attrs, ...children);}
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
 * @experimental https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Elements/geolocation
 * @param {Attrs} attrs
 * @param  {...ChildElement} children
 * @returns {HTMLElement}
 */
export function geolocation(attrs, ...children) {return element("geolocation", attrs, ...children);}
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
export function math(attrs, ...children) {return element("math", attrs, ...children);}
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
export function slot(attrs, ...children) {return element("slot", attrs, ...children);}
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
 * Var is capitalized to not conflict with the javascript keyword var.
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
//#endregion