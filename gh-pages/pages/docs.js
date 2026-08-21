import {$, div, aside, ul, li, button, h2, h3, p, section, code, a} from "../../xsml.js";
import {pageLayout} from "../components/layout.js";
import {codeBlock} from "../components/codeBlock.js";

const START_EXAMPLE = `
app/
├── app.js
├── index.html
└── xsml.js
`;

const START_HTML = `
<script type="module" src="./app.js"></script>
`;

const START_JS = `
import { xsml, div } from "./xsml.js";

xsml(
    div("Hello, World!")
);
`;

const ELEMENTS_JS = `
import { div, button, a, img } from "./xsml.js";

function component() {
    return div(
        img({ src: "/path/to/image.png" }),
        a({ href: "/path/to/page" },
            button("Go to page")
        )
    );
}
`;

const ATTRIBUTES_JS = `
div(
    { id: "some-id", class: "some-class" },
    // ...optional child elements
)
`;

const ATTRIBUTES_EVENT_JS = `
button()
    .and(btn => btn.onclick = () => console.log("this will print"))
`;

const CONTROL_FLOW_LOOP_JS = `
ul(
    ["first", "second", "third"].map(item => li(item))
)
`;

const CONTROL_FLOW_COND_JS = `
const someCondition = false;
div(
    someCondition
        ? div()
        : undefined
)
`;

const SIGNALS_CREATE_JS = `
const someState0 = new $("initial state");
const someState1 = new $(69);
const someState2 = new $({ someObject: "" });
`;

const SIGNALS_COUNTER_JS = `
function counter() {
    const count = new $(0);
    return div(
        button({ id: "counter-btn" }, "Increment")
            .$eventIn(count, "click", (_, value) => value + 1),
        label({ for: "counter-btn" })
            .$childOut(count, value => \`Counter: \${value}\`)
    );
}
`;

const SIGNALS_LOOP_JS = `
function list() {
    const items = new $(["first", "second", "third"]);
    return ul()
        .$childrenOut(items, list => list.map(item => li(item)));
}
`;

const SIGNALS_COND_JS = `
function toggle() {
    const isVideo = new $(false);
    return div()
        .$childOut(isVideo, useVideo => useVideo ? video() : img());
}
`;

const ROUTING_JS = `
import { xsml, div, router } from "./xsml.js";

xsml(
    router("/404", {
        "/": div("Hello, World!"),
        "/404": div("File Not Found"),
        "/other-page": div("Some other page"),
    })
);
`;

/**
 * @typedef {{id: string, title: string, render: () => import("../../xsml.js").ChildElement[]}} DocTopic
 */

/** @type {DocTopic[]} */
const TOPICS = [
	{
		id: "start",
		title: "Start",
		render: () => [
			h2("Start"),
			p("Create the following files and copy ", code("xsml.js"), " into your project."),
			codeBlock("html", START_EXAMPLE),
			p("Set up ", code("index.html"), " how you like, and include your app script."),
			codeBlock("html", START_HTML),
			p("In ", code("app.js"), ", the ", code("xsml"), " function is the entry point, and it renders everything when called."),
			codeBlock("javascript", START_JS),
			p("If you open ", code("index.html"), " in the browser, you should see \u201cHello, World!\u201d")
		]
	},
	{
		id: "elements",
		title: "Elements",
		render: () => [
			h2("Elements"),
			p("An element is something that can resolve to an HTML element. xsml provides functions for supported HTML tags that can be found in a document body."),
			codeBlock("javascript", ELEMENTS_JS),
			p("These functions return a real ", code("HTMLElement"), "."),
			h3("String, HTMLElement, or function?"),
			p("Strings, HTMLElements, and no-argument functions that return any of these three types are all handled by xsml. Arrays are also supported for statically repeating content."),
			p("A ", code("string"), " child always just sets ", code("textContent"), " \u2014 ", code("innerHTML"), " and ", code("innerText"), " are never used, so xsml is safe from XSS by default."),
			p("An ", code("HTMLElement"), " child is built once, immediately, and kept around even when it's not visible \u2014 cheap for small trees, wasteful for large content-heavy ones."),
			p("A ", code("function"), " child is re-rendered each time it's displayed, and can be garbage-collected when it's not. This resets any signal state declared inside it.")
		]
	},
	{
		id: "attributes",
		title: "Attributes",
		render: () => [
			h2("Attributes"),
			p("Attributes are defined as a plain object passed as the first argument of an element function."),
			codeBlock("javascript", ATTRIBUTES_JS),
			p("Attributes are optional \u2014 xsml checks whether the first argument is a plain object to decide whether it's attributes or a child."),
			p("Attributes with a value of ", code("false"), ", ", code("null"), ", or ", code("undefined"), " are removed from the element instead of being set."),
			p(code("setAttribute"), " is used internally, which expects strings, so you can't set event-handler functions this way. Use ", code(".and()"), " instead:"),
			codeBlock("javascript", ATTRIBUTES_EVENT_JS),
			p(code(".and(callback)"), " calls ", code("callback(element)"), " and returns the same element, so it chains inline without disrupting your declarative tree.")
		]
	},
	{
		id: "components",
		title: "Components",
		render: () => [
			h2("Components"),
			p("A component doesn't have a strict definition \u2014 it's just a function that returns anything xsml can render."),
			h3("Props"),
			p("Components can have props passed in like normal function arguments, but they're not reactive unless the prop is a signal.")
		]
	},
	{
		id: "control-flow",
		title: "Control Flow",
		render: () => [
			h2("Control Flow"),
			h3("Loops"),
			p("Use whatever JS syntax works best for you \u2014 loops are just array mapping."),
			codeBlock("javascript", CONTROL_FLOW_LOOP_JS),
			h3("Conditionals"),
			p("The ternary operator works well for a single conditional element. ", code("undefined"), " or ", code("null"), " means \u201cdon't render anything.\u201d"),
			codeBlock("javascript", CONTROL_FLOW_COND_JS),
			p("For static (render-once) content, the patterns above are all you need. For content that must update reactively after signals change, see the Signals tab.")
		]
	},
	{
		id: "signals",
		title: "Signals",
		render: () => [
			h2("Signals"),
			p("Signals are xsml's reactive primitive. The dollar sign (", code("$"), ") represents \u201csignal\u201d everywhere in the code. Always create one with ", code("new"), "."),
			codeBlock("javascript", SIGNALS_CREATE_JS),
			p("A counter button and label, wired together with signals:"),
			codeBlock("javascript", SIGNALS_COUNTER_JS),
			p(code(".$eventIn(signal, event, mapEvent)"), " listens for a DOM event and uses it to set the signal's value."),
			p(code(".$childOut(signal, procreate)"), " replaces an element's single child whenever the signal updates \u2014 the natural way to reactively drive text content."),
			p(code(".$attrOut(signal, attr, mapAttr)"), " updates a real HTML attribute whenever the signal updates."),
			h3("Reactive loops"),
			codeBlock("javascript", SIGNALS_LOOP_JS),
			p(code(".$childrenOut(signal, procreate)"), " replaces all of an element's children whenever the signal updates."),
			h3("Reactive conditionals"),
			codeBlock("javascript", SIGNALS_COND_JS),
			p("Manual signal API: ", code("get()"), ", ", code("set(value)"), ", ", code("update(fn)"), ", and ", code("pushSub(fn)"), " for running arbitrary code on every update.")
		]
	},
	{
		id: "routing",
		title: "Routing",
		render: () => [
			h2("Routing & Single-Page Applications"),
			p("If you don't use a router, you can make a multipage application \u2014 each HTML file gets its own entry point."),
			p("If you use a router, your server needs to support client-side routing (a dev server like Vite works well)."),
			codeBlock("javascript", ROUTING_JS),
			p("The first argument is the fallback path, the second is (optional) attributes for the router's own wrapping element, and the third is the routing table."),
			h3("Caveats"),
			p("Only create one router per application. The router does not check for duplicate or unreachable routes, and slashes are not automatically inserted in the routing table."),
			p("Routing table values can be an ", code("HTMLElement"), ", a ", code("string"), ", a route function, or a nested routing table object \u2014 nested tables are folded into the parent path automatically."),
			p("For the full reference, see the ", a({href: "https://github.com/eclipse-909/xsml#readme", target: "_blank", rel: "noopener noreferrer"}, "README"), " on GitHub.")
		]
	}
];

export function docs() {
	const activeTopic = new $(TOPICS[0].id);

	return pageLayout("docs-content",
		div({class: "docs-layout"},
			aside({class: "docs-sidebar"},
				ul({class: "docs-tab-list"},
					TOPICS.map(topic =>
						li({class: "docs-tab-item"},
							button({class: "docs-tab", type: "button"}, topic.title)
								.and(btn => btn.onclick = () => activeTopic.set(topic.id))
								.$attrOut(activeTopic, "class", value =>
									value === topic.id ? "docs-tab docs-tab-active" : "docs-tab"
								)
						)
					)
				)
			),
			section({class: "docs-main"})
				.$childrenOut(activeTopic, id => TOPICS.find(topic => topic.id === id).render())
		)
	);
}
