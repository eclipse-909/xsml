import {$, div, aside, ul, li, button, h2, h3, p, section, code, a, strong} from "../../xsml.js";
import {pageLayout} from "../components/layout.js";
import {codeBlock} from "../components/codeBlock.js";

const START_EXAMPLE = `
app/
├── app.js
├── index.html
└── xsml.js
`;

const START_HTML = `
<script type="module" async src="./app.js"></script>
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

const SIGNALS_BAD_ATTROUT_JS = `
// Wrong: $attrOut only ever calls setAttribute, so this never touches
// the label's displayed text.
label().$attrOut(count, "textContent", value => \`Counter: \${value}\`)
`;

const SIGNALS_GOOD_ATTROUT_JS = `
// Right: use $childOut to drive what's displayed inside the element.
label().$childOut(count, value => \`Counter: \${value}\`)
`;

const SIGNALS_BAD_DOUBLE_JS = `
// Wrong: calling $childrenOut twice on the same element doesn't merge
// anything \u2014 the two subscribers just layer their output on top of
// each other whenever either signal updates.
ul()
    .$childrenOut(list, l => l.map(item => li(item)))
    .$childrenOut(otherList, l => l.map(item => li(item)))
`;

const SIGNALS_GOOD_COMBINE_JS = `
// Right: combine the data first, then drive one $childrenOut from it.
ul().$childrenOut(list, l =>
    l.map(item => li(item)).concat(otherList.get().map(item => li(item)))
)
`;

const SIGNALS_PERSISTENCE_JS = `
// A signal declared inside a route function is re-created (and reset)
// every time that route function runs.
function profilePage() {
    const draft = new $(""); // resets every visit
    return input().$eventIn(draft, "input", e => e.target.value);
}

// Lift it out of the function (module scope, or a parent that isn't
// re-created) if the state should survive navigating away and back.
const draft = new $("");
function profilePagePersisted() {
    return input().$eventIn(draft, "input", e => e.target.value);
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

const START_MULTIPAGE_JS = `
// page-a.html loads page-a.js, page-b.html loads page-b.js.
// Each entry point is completely independent \u2014 no router needed.
import { xsml, div, a } from "./xsml.js";

xsml(
    div(
        "Page A",
        a({ href: "/page-b.html" }, "Go to page B")
    )
);
`;

const START_BAD_IMPORT_JS = `
// Wrong: no file extension, and no "type=module" on the script tag
// means "import" is a syntax error in the browser.
import { xsml, div } from "xsml";
`;

const START_GOOD_IMPORT_JS = `
// Right: relative path with extension, loaded as an ES module.
import { xsml, div } from "./xsml.js";
`;

const ELEMENTS_STATIC_ARRAY_JS = `
import { div, li, ul } from "./xsml.js";

// Arrays are flattened, so you can mix single elements and arrays freely.
function nav() {
    return ul(
        li("Home"),
        ["Docs", "Examples", "GitHub"].map(label => li(label))
    );
}
`;

const ELEMENTS_BAD_CHILD_JS = `
// Wrong: a raw number is not a valid child and throws at render time.
div(42)
`;

const ELEMENTS_GOOD_CHILD_JS = `
// Right: stringify it yourself.
div(String(42))
`;

const ELEMENTS_MEMORY_JS = `
// Wasteful if "heavyDashboard" is content-heavy and only shown on one route:
// it's built immediately and stays in memory even while hidden.
router("/404", {
    "/dashboard": heavyDashboard(),
    "/404": div("Not Found"),
});

// Better: pass the function itself, not its result. xsml calls it only
// when that route is actually rendered, and lets it be collected when it isn't.
router("/404", {
    "/dashboard": heavyDashboard,
    "/404": div("Not Found"),
});
`;

const ATTRIBUTES_CONDITIONAL_JS = `
// Attributes with false/null/undefined are removed instead of being set \u2014
// handy for conditionally toggling a boolean attribute.
button(
    { disabled: isLoading },
    "Submit"
)
`;

const ATTRIBUTES_BAD_DUPLICATE_JS = `
// Wrong: setting "class" in the attrs object AND overwriting it in .and()
// leaves whichever one runs last \u2014 confusing and easy to break later.
div({ class: "card" })
    .and(el => el.className = "card highlighted")
`;

const ATTRIBUTES_GOOD_DUPLICATE_JS = `
// Right: decide on one source of truth for each attribute.
div({ class: "card highlighted" })
`;

const ATTRIBUTES_AND_MISC_JS = `
// .and() isn't just for events \u2014 it's a general escape hatch for any
// imperative tweak that doesn't fit the declarative attrs object.
input({ type: "text" })
    .and(el => el.focus())
`;

const COMPONENTS_PROPS_JS = `
function greeting(name) {
    return p("Hello, ", name, "!");
}

div(
    greeting("Ada"),
    greeting("Grace")
)
`;

const COMPONENTS_BAD_PROPS_JS = `
// Wrong: mutating a plain (non-signal) prop later does nothing to the
// already-rendered element \u2014 plain props are read once, at call time.
function label(text) {
    return p(text);
}

const el = label("initial");
someLaterCode = "updated"; // el's text never changes
`;

const COMPONENTS_GOOD_PROPS_JS = `
// Right: pass a signal as the prop, and subscribe to it inside.
function label(textSignal) {
    return p().$childOut(textSignal, value => value);
}

const text = new $("initial");
const el = label(text);
text.set("updated"); // el's text updates
`;

const CONTROL_FLOW_BAD_NESTED_JS = `
// Wrong: nested ternaries are hard to read and easy to get wrong.
div(
    status === "loading"
        ? spinner()
        : status === "error"
            ? errorMessage()
            : status === "empty"
                ? emptyState()
                : results()
)
`;

const CONTROL_FLOW_GOOD_FACTORED_JS = `
// Right: factor the branching into a small function.
function statusView(status) {
    switch (status) {
        case "loading": return spinner();
        case "error": return errorMessage();
        case "empty": return emptyState();
        default: return results();
    }
}

div(statusView(status))
`;

const CONTROL_FLOW_STATIC_VS_REACTIVE_JS = `
// This only renders the list once, from whatever "items" is at the time
// this function runs. If "items" changes later, nothing here will update.
function list(items) {
    return ul(items.map(item => li(item)));
}
`;

const ROUTING_NESTED_JS = `
router("/404", {
    "/": home,
    "/nested": {
        "/routing": {
            "/table": nestedTable,
        },
    },
})
// folds into a flat table:
// { "/": home, "/nested/routing/table": nestedTable }
`;

const ROUTING_BAD_MULTIPLE_JS = `
// Wrong: two routers each attach their own click/popstate listeners,
// so link clicks and back/forward navigation behave unpredictably.
xsml(
    div(
        router("/404", { "/": home }),
        router("/404", { "/settings": settings })
    )
);
`;

const ROUTING_GOOD_SINGLE_JS = `
// Right: one router, with every route folded into its table.
xsml(
    router("/404", {
        "/": home,
        "/settings": settings,
    })
);
`;

const ROUTING_LINK_JS = `
// Plain <a href> works out of the box \u2014 the router intercepts same-origin
// left-clicks automatically. No special "navigate" function needed.
a({ href: "/settings" }, "Settings")
`;

/**
 * @typedef {{id: string, title: string, render: () => import("../../xsml.js").ChildElement[]}} DocTopic
 */

/**
 * A small "do this / avoid this / note" callout used to compare
 * patterns and anti-patterns inline with the surrounding prose.
 * @param {("good"|"bad"|"note")} kind
 * @param {string} labelText
 * @param {...import("../../xsml.js").ChildElement} children
 * @returns {HTMLElement}
 */
function callout(kind, labelText, ...children) {
	return div({class: `docs-callout docs-callout-${kind}`},
		strong({class: "docs-callout-label"}, labelText),
		p(...children)
	);
}

/** @type {DocTopic[]} */
const TOPICS = [
	{
		id: "start",
		title: "Start",
		render: () => [
			h2("Start"),
			p("Create the following files and copy ", code("xsml.js"), " into your project."),
			codeBlock("html", START_EXAMPLE),
			p("Set up ", code("index.html"), " how you like, and include your app script. The script should go in or after the body."),
			codeBlock("html", START_HTML),
			p("In ", code("app.js"), ", the ", code("xsml"), " function is the entry point, and it renders everything when called."),
			codeBlock("javascript", START_JS),
			p("If you open ", code("index.html"), " in the browser, you should see \u201cHello, World!\u201d"),
			callout("bad", "Avoid", "Importing without a relative path and extension, or without a module script tag, won't work in the browser \u2014 xsml has no build step to fix this up for you."),
			codeBlock("javascript", START_BAD_IMPORT_JS),
			callout("good", "Do", "Always import with a relative, extension-qualified path, loaded via a ", code('<script type="module">'), "."),
			codeBlock("javascript", START_GOOD_IMPORT_JS),
			h3("Multi-page without a router"),
			p("You don't need the router at all for a simple multi-page site \u2014 each HTML file just gets its own entry-point script and links between pages with a plain ", code("a()"), "."),
			codeBlock("javascript", START_MULTIPAGE_JS),
			callout("note", "Note", "Reach for the ", code("router"), " (see the Routing tab) only once you actually want client-side navigation without full page reloads.")
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
			p("A ", code("function"), " child is re-rendered each time it's displayed, and can be garbage-collected when it's not. This resets any signal state declared inside it."),
			p("Arrays are flattened recursively, so you can freely mix single elements and mapped arrays in the same argument list:"),
			codeBlock("javascript", ELEMENTS_STATIC_ARRAY_JS),
			callout("bad", "Avoid", "Passing a raw number, plain object, or anything else that isn't a string, ", code("HTMLElement"), ", function, or array throws at render time."),
			codeBlock("javascript", ELEMENTS_BAD_CHILD_JS),
			callout("good", "Do", "Coerce non-string values to a string yourself before passing them as a child."),
			codeBlock("javascript", ELEMENTS_GOOD_CHILD_JS),
			h3("Pattern: pick HTMLElement vs. function by content weight"),
			p("This isn't just a style choice \u2014 it's a memory/re-render tradeoff, and it matters most for routes and rarely-visible content:"),
			codeBlock("javascript", ELEMENTS_MEMORY_JS)
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
			p(code(".and(callback)"), " calls ", code("callback(element)"), " and returns the same element, so it chains inline without disrupting your declarative tree."),
			h3("Conditional attributes"),
			p("Because ", code("false"), ", ", code("null"), ", and ", code("undefined"), " remove an attribute, a ternary in the attrs object is enough to toggle a boolean attribute without a separate branch:"),
			codeBlock("javascript", ATTRIBUTES_CONDITIONAL_JS),
			callout("bad", "Avoid", "Setting the same attribute in the attrs object and then overwriting it in ", code(".and()"), " \u2014 xsml won't warn you, and whichever assignment runs last silently wins."),
			codeBlock("javascript", ATTRIBUTES_BAD_DUPLICATE_JS),
			callout("good", "Do", "Pick a single source of truth per attribute."),
			codeBlock("javascript", ATTRIBUTES_GOOD_DUPLICATE_JS),
			h3("More than events"),
			p(code(".and()"), " is a general escape hatch for direct DOM access mid-expression \u2014 focusing an input, measuring size, or attaching a non-attribute property, not just event handlers:"),
			codeBlock("javascript", ATTRIBUTES_AND_MISC_JS)
		]
	},
	{
		id: "components",
		title: "Components",
		render: () => [
			h2("Components"),
			p("A component doesn't have a strict definition \u2014 it's just a function that returns anything xsml can render."),
			h3("Props"),
			p("Components can have props passed in like normal function arguments, but they're not reactive unless the prop is a signal."),
			p("Plain props work great for content that's fixed for the lifetime of the component:"),
			codeBlock("javascript", COMPONENTS_PROPS_JS),
			callout("bad", "Avoid", "Expecting a component to update just because some variable it closed over changed later \u2014 a plain prop is read once, when the function runs, not observed continuously."),
			codeBlock("javascript", COMPONENTS_BAD_PROPS_JS),
			callout("good", "Do", "Pass a signal as the prop and subscribe to it inside the component if it needs to update after the fact."),
			codeBlock("javascript", COMPONENTS_GOOD_PROPS_JS),
			h3("Composition"),
			p("Since a component is just a function returning something renderable, components compose the same way regular functions do \u2014 call one from inside another, pass elements as arguments, or return arrays of children. There's no special registration step and nothing to \u201cmount\u201d beyond the top-level ", code("xsml(...)"), " call.")
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
			callout("bad", "Avoid", "Chaining several ternaries for multi-branch logic \u2014 it reads poorly and is easy to get the nesting wrong."),
			codeBlock("javascript", CONTROL_FLOW_BAD_NESTED_JS),
			callout("good", "Do", "Factor if/else-if chains and switch-cases out into a small function that returns the right element."),
			codeBlock("javascript", CONTROL_FLOW_GOOD_FACTORED_JS),
			h3("Static vs. reactive"),
			p("Both patterns above are for ", strong("static"), " (render-once) content \u2014 they run exactly once, when the surrounding function is called:"),
			codeBlock("javascript", CONTROL_FLOW_STATIC_VS_REACTIVE_JS),
			p("If the list or condition needs to update after signals change later, these static patterns won't do that on their own \u2014 see ", code("$childrenOut"), "/", code("$childOut"), " on the Signals tab instead.")
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
			p("Manual signal API: ", code("get()"), ", ", code("set(value)"), ", ", code("update(fn)"), ", and ", code("pushSub(fn)"), " for running arbitrary code on every update."),
			h3("Picking the right output method"),
			callout("bad", "Avoid", code("$attrOut"), " only ever calls ", code("setAttribute"), ", so it can never update DOM-only display state like text content, no matter what attribute name you pass it."),
			codeBlock("javascript", SIGNALS_BAD_ATTROUT_JS),
			callout("good", "Do", "Use ", code("$childOut"), " whenever the reactive part is what's displayed inside the element, not a real HTML attribute."),
			codeBlock("javascript", SIGNALS_GOOD_ATTROUT_JS),
			callout("bad", "Avoid", "Calling ", code("$childrenOut"), " (or ", code("$childOut"), ") more than once on the same element \u2014 each call installs its own subscriber, so both fire independently and stomp on each other's output."),
			codeBlock("javascript", SIGNALS_BAD_DOUBLE_JS),
			callout("good", "Do", "Combine the source signals first, then drive a single ", code("$childrenOut"), " call from the combined result."),
			codeBlock("javascript", SIGNALS_GOOD_COMBINE_JS),
			h3("Signal lifetime and page navigation"),
			p("Signal state survives navigation only if the signal itself lives somewhere that isn't re-created on navigation:"),
			codeBlock("javascript", SIGNALS_PERSISTENCE_JS)
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
			h3("Nested routing tables"),
			p("Nesting an object as a value folds its keys into the parent path, which is often more readable than repeating a shared prefix:"),
			codeBlock("javascript", ROUTING_NESTED_JS),
			callout("bad", "Avoid", "Mounting more than one router in the same app \u2014 each router independently attaches its own click/popstate listeners, so navigation becomes unpredictable."),
			codeBlock("javascript", ROUTING_BAD_MULTIPLE_JS),
			callout("good", "Do", "Mount exactly one router and fold every page's routes into its single table."),
			codeBlock("javascript", ROUTING_GOOD_SINGLE_JS),
			h3("Navigating"),
			p("You don't need to call anything to navigate \u2014 same-origin left-clicks on a plain ", code("a()"), " with no modifier keys, no ", code('target="_blank"'), ", and no ", code("download"), " are intercepted automatically:"),
			codeBlock("javascript", ROUTING_LINK_JS),
			p("For the full reference, see the ", a({href: "https://github.com/eclipse-909/xsml#readme", target: "_blank", rel: "noopener noreferrer"}, "README"), " on GitHub.")
		]
	}
];

export function docs() {
	const activeTopic = new $(TOPICS[0].id);
	// Tracks each tab's scroll position individually, so switching tabs
	// doesn't carry over the scroll offset from the tab you just left.
	const scrollPositions = {};

	return pageLayout("docs-content",
		div({class: "docs-layout"},
			aside({class: "docs-sidebar"},
				ul({class: "docs-tab-list"},
					TOPICS.map(topic =>
						li({class: "docs-tab-item"},
							button({type: "button"}, topic.title)
								.$eventIn(activeTopic, "click", (_, active) => {
									scrollPositions[active] = window.scrollY;
									return topic.id;
								})
								.$attrOut(activeTopic, "class", value =>
									value === topic.id ? "docs-tab docs-tab-active" : "docs-tab"
								)
						)
					)
				)
			),
			section({class: "docs-main"})
				.$childrenOut(activeTopic, id => {
					const content = TOPICS.find(topic => topic.id === id).render();
					requestAnimationFrame(() => window.scrollTo(0, scrollPositions[id] ?? 0));
					return content;
				})
		)
	);
}
