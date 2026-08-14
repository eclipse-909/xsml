import {jsml, div, a, button, router} from "/jsml.js";

function printSomething() {
	console.log("hello world");
}

function index() {
	return div(
		{style: "width:100%;height:100%;background:red;"},
		div({}, "Hello, World!"),
		a({
			href: "/other"},
			button({}, "Go to other page")
		),
		button({},
			"Print something"
		).and(self => self.onclick = printSomething)
	);
}

function other() {
	return div({
		style: "width:100%;height:100%;background:red;"},
		div({}, "Other Page"),
		a({
			href: "/"},
			button({}, "Return to index")
		),
		a({
			href: "/path/to"},
			button({}, "Go to path")
		)
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

window.someFunction = () => {};

someFunction();