# JSML
JavaScript Markup Language (JSML) is a very simple frontend web library.
Its primary use is for client-side rendered single or multipage applications.

There is no transpiler, no magic, and no additional dependencies.
JSML is pure JavaScript,
so you just need to include `jsml.js` in your project,
and you're good to go.
This means JSML can be used with web components
and other web frameworks if you want.
Anything you can do with HTML, CSS, and JS can be done using JSML.

## Run examples
```sh
cd examples/simple
npm i # uses vite
npm run dev
```

## Reference
Also see the GitHub pages content.
* [Start](#start)
* [Elements](#elements)
  * [HTMLElement vs String vs Function](#when-to-use-a-function-vs-htmlelement-or-string)
  * [Attributes](#attributes)
* [Components](#components)
  * [Props](#props)
  * [Control Flow](#control-flow)
* [Signals](#signals)
  * [Control Flow](#control-flow-1)
* [Routing & Single-Page Applications](#routing--single-page-applications)
  * [Routing Table](#routing-table)
### Start
Create the following files and copy jsml.js into your project.
```txt
app/
├── app.js
├── index.html
└── jsml.js
```
Setup index.html how you like, and include your app script.
```html
<script type="module" src="./app.js"></script>
```
In app.js, the jsml function is the entry point,
and it renders everything when called.

```js
import { jsml, div } from "./jsml.js";

jsml(
    div("Hello, World!")
);
```
If you open index.html in the browser, you should see `Hello, World!`.

### Elements
An element is something that can resolve to an HTML element.
It can take multiple forms described below.
JSML provides functions for supported HTML tags that can be found in a body.
```js
import {div, button, a, img} from "./jsml.js";

function component() {
    return div(
        img({src: "/path/to/image.png"}),
        a({href: "/path/to/page"},
            button("Go to page")
        )
    );
}
```
These functions return an HTMLElement.

#### When to use a function vs HTMLElement or string
You can mix and match however you want.
Strings, HTMLElements, and functions with no parameters that return
any of these three types are all handled by JSML. You can also use
arrays for statically repeating content.
You can make the pages HTMLElements,
use functions for areas with lots of content,
and strings when you need raw text.

##### String
When you use a string anywhere,
it will just set the textContent of its parent.
innerHTML and innerText are strictly never used to avoid XSS vulnerabilities.

##### HTMLElement
Remember this is pure JavaScript, so when you call div() or some other
element or component, it calls that function and renders it immediatly.
If you use HTMLElements and strings for everything,
your entire application will be rendered immediately,
but only one page will be displayed at a time.
This could be desireable for small, fast applications.
Signal state is automatically preserved when changing pages.
If you have many content-heavy components that aren't being displayed,
this could use up a lot of memory.

##### Function
When you use a function,
the content will be re-rendered each time it is displayed.
When the component is not displayed, it can be garbage collected.
Signal state is reset, but you can easily figure out how to preserve it.

#### Attributes
Attributes are simply defined as an object in the first argument of
an element function like this:
```js
div(
    {id: "some-id",
    "class": "some-class"},
    //...optional child elements
)
```
Attributes are optional. Internally it checks to see if the first
argument is an attribute object or part of the children.

Attributes with a value of `false`, `null`, or `undefined` are removed
from the element instead of being added.

`HTMLElement.setAttribute` is used internally which expects strings as
attribute values, so you can't set event-handler functions
this way.
```js
button(
    {onclick: () => console.log("this will not print")},
    //...optional child elements
)
```
To use event handlers, you must either use the `and` method
or subscribe with a signal.
```js
button()
    .and(btn => btn.onclick = () => console.log("this will print"))
```
The `and` method gives you the element in the callback and returns that
same element to not disrupt your declarative component flow.
This means you can chain method calls as much as you'd like.

##### Caveats
- You should not set the same attribute multiple times across
the attribute object, `and` method, or signal subscriber.

### Components
A component doesn't have a strict definition in terms of the code,
so a component is really whatever you can turn into HTML.

#### Props
Components can have props passed in by a parent component,
but they are not reactive unless the props are signals.

#### Control Flow
##### Loops
You can use whatever syntax works best for you,
but loops are pretty straightforward.
```js
ul(
    ["first", "second", "third"].map(item => li(item))
)
```
They work differently if you want to use signals in your array,
so check out the signals section.

##### Conditionals
The ternary operator is easy for inlining a conditional expression.
For more complicated if-elses and switch-cases,
you'll probably want to factor the logic out to a separate function.

There are many ways to say that you either want to render an element or
not render it. For example, you can set `hidden: false` as an attribute.
You can set `display: hidden;` as a style.
You can also use `undefined` or `null` to represent an element that
shouldn't be rendered.
```js
const someCondition = false;
div(
    someCondition
        ? div()
        : undefined
)
```
In this example the div won't even have a child element.
It will look like this
```html
<div>
</div>
```

### Signals
Signals are the reactive element of JSML.
The dollar sign (`$`) represents "signal" everywhere in the code.

Create a signal with any data.
```js
const someState0 = new $("initial state");
const someState1 = new $(69);
const someState2 = new $({someObject: ""});
const someState3 = new $(undefined);
```
Create a counter button and label.
```js
function index() {
    const counter = new $(0);
    return div(
        button({"id": "counter-btn"}, "Increment")
            .$eventIn(counter, "click", (_, value) => value + 1),
        label({"for": "counter-btn"})
            .$attrOut(counter, "textContent", value => `Counter: ${value}`)
    );
}
```
`$eventIn` uses an event as input to a signal.
You specify how the state should be updated with
the given event and current value,
and the signal notifies all subscribers of the change.

`$attrOut` uses the signal output to update an attribute on an element.
You specify how you want the attribute to be set with the new value.

You can manually get, set, and update the value of a signal.
```js
const someState = new $("initial state");
someState.get(); // "initial state"
someState.update(value => value + " and some more state");
someState.get(); // "initial state and some more state"
someState.set("new state");
someState.get(); // "new state"
```
Setting and updating will notify subscribers of a change.

You can manually add a subscriber to a signal if you need something to happen
when a signal updates and it doesn't involve modifying an element.
```js
const someState = new $(0);
someState.pushSub(value => console.log(`state was updated: ${value}`));
```
This will print to the console when someState is updated.

#### Control Flow
`$childrenOut` uses the output of a signal to create children of an element.
It's used for any control flow that uses signals and needs to make elements.
##### Loops
```js
function component() {
    const list = new $(["first", "second", "third"]);
    return ul()
        .$childrenOut(list, l => l.map(item => li(item)));
}
```

##### Conditionals
`$childOut` does the same thing but for only one child element.
This just avoids having to create an array with one element.
```js
function component() {
    const condition = new $(true);
    return div()
        .$childOut(condition, isImg => isImg
            ? img()
            : video()
        );
}
```

### Routing & Single-Page Applications
If you don't use a router, you can make a multipage application.
Each HTML file will need its own entry point.

If you use a router, your server has to support client-side routing.
Vite is a good option for this.

You can simply use a router in your jsml function like this:
```js
import { jsml, div, router } from "./jsml.js";

jsml(
    router("/404", {}, {
        "/": div("Hello, World!"),
        "/404": div("File Not Found"),
        "/other-page": div("Some other page"),
    })
);
```
- The first argument specifies the fallback path.
- The second argument is attributes for the router element itself
  (these attributes are also optional, so they could be
  omitted in this example)
- The third argument is the routing table

#### Caveats
- The router should only be used once in an entire application
- The router doesn't check for duplicate or unreachable routes
- Slashes are not automatically inserted in the routing table

#### Routing Table
##### Keys
The keys represent the document path name.
The router uses `document.pathname` to look up which element to render.

##### Values
The values are what gets rendered.
A value can be an HTMLElement, string,
or a function with no parameters that returns any of these three types.
It can also be another routing table object.

Here are some examples:
```js
router("/", {
    "/": div(),
    "/html-element": div(),
    "/string": "textContent",
    "/function": div,
    "/combined/path/to/something": div(),
    "/nested": {
        "/routing": {
            "/table": div(),
            "/object": div()
        },
        "/table": div()
    }
})
```
Nested routing tables immediately get folded to make path name lookups easier.
This is why a function can only return an HTMLElement, string, or function,
but not another routing table.

The previous example will turn into this:
```js
router("/", {
    "/": div(),
    "/html-element": div(),
    "/string": "textContent",
    "/function": div,
    "/combined/path/to/something": div(),
    "/nested/routing/table": div(),
    "/nested/routing/object": div(),
    "/nested/table": div()
})
```