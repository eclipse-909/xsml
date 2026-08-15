import {jsml, $, div, a, button, router, label, ul, li} from "./jsml.js";

function printSomething() {
	console.log("hello world");
}

function index() {
	const counter = new $(0);
	return div(
		{style: "width:100%;height:100%;background:red;"},
		div({}, "Hello, World!"),
		a(
			{href: "/other"},
			button({}, "Go to other page")
		),
		button({}, "Print something")
			.and(self => self.onclick = printSomething),
		div({},
			button({"id": "counter-btn"}, "Increment")
				.$eventIn(counter, "click", (_, value) => value + 1),
			label({"for": "counter-btn"})
				.$attrOut(counter, "textContent", value => `Counter: ${value}`)
		),
		ul({},
			...["first", "second", "third"].map(item => li({}, item))
		)
	);
}

function other() {
	const list = new $(["first", "second", "third"]);
	return div(
		{style: "width:100%;height:100%;background:red;"},
		div({}, "Other Page"),
		a({
			href: "/"},
			button({}, "Return to index")
		),
		a({
			href: "/path/to"},
			button({}, "Go to path")
		),

		ul({})
			.$childrenOut(list, l => l.map(item => li({}, item)))
	);
}

function tofile() {
	return div({
		style: "width:100%;height:100%;background:red;"},
		div({}, "File Page"),
		a({
			href: "/path/to/file"},
			button({}, "Go to file")
		)
	);
}

function file() {
	return div({
		style: "width:100%;height:100%;background:red;"},
		div({}, "File Page"),
		a({
			href: "/"},
			button({}, "Return to index")
		)
	);
}

function notFound() {
	return div({
		style: "width:100%;height:100%;background:red;"},
		div({}, "404 Not Found"),
		a({
			href: "/"},
			button({}, "Return to index")
		)
	);
}

function main() {
	jsml(
		router("/404", {}, {
			"/": index(),
			"/other": other(),
			"/path": {
				"/to": tofile(),
				"/to/file": file()
			},
			"/404": notFound()
		})
	);
}

main();