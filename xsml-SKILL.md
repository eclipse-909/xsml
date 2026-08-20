---
name: xsml
description: Use this skill whenever building a front-end, web UI, single-page app, or multi-page client-rendered site with XSML (JavaScript Markup Language), a tiny dependency-free JS library by eclipse-909 (github.com/eclipse-909/xsml) for declaratively building HTML with plain JS functions plus a lightweight signal system for reactivity and a client-side router. Trigger this skill any time the user mentions "XSML", pastes or points at eclipse-909's xsml.js, or asks to add UI/pages/components/routing/reactivity to a project that already imports from a local "xsml.js" file — even if they just say "add a page" or "make this reactive" without naming XSML again. Do not use this for React, Vue, Svelte, or other unrelated frameworks, and do not confuse this with Java Speech Markup Language (an unrelated, unrelated-domain XML format that shares the acronym).
---

# XSML

XSML is a ~1100-line, zero-dependency, zero-build-step JS library for client-rendered
front-ends. There's no compiler, no JSX, no virtual DOM — every "component" is just a
plain JS function that calls other plain JS functions and returns a real `HTMLElement`
(or a string, which becomes text). It's small enough to read end-to-end, and doing so
is often faster than searching for edge cases, since the source is the ground truth.

Full source, docs, and an example app live at https://github.com/eclipse-909/xsml.
The examples in that repo are explicitly **not** meant to model best practices — the
maintainer wrote them fast, just to prove things work. Don't treat example code as
idiomatic; treat the library semantics described below as the source of truth for
patterns, but always re-fetch `xsml.js` itself (see Setup below) rather than
assuming this skill's description of it is current — the library is actively
evolving and can change out from under this skill's text.

## Setting up a project

XSML is not published on npm — there is no package to install. You copy the single
`xsml.js` file into your project and import from it directly:

```
app/
├── app.js       # entry point
├── index.html   # loads app.js as a module script
└── xsml.js      # copied from the repo, unmodified
```

Fetch the current file from the repo (this env allows `raw.githubusercontent.com`):

```bash
curl -o xsml.js https://raw.githubusercontent.com/eclipse-909/xsml/main/xsml.js
```

`index.html` just needs a module script tag pointing at your entry point:

```html
<script type="module" src="./app.js"></script>
```

`app.js` imports what it needs and calls `xsml(...)` once, at the top level, to mount
the whole UI into `document.body`:

```js
import { xsml, div } from "./xsml.js";

xsml(
    div("Hello, World!")
);
```

If the user wants a dev server with client-side routing support, Vite works well and
is what the repo's own example uses (`npm i` a `vite` devDependency, `npm run dev`).
Any static server that falls back to `index.html` for unknown paths works too, since
routing is handled entirely in JS via `history.pushState`.

## Elements

Every standard HTML5 tag that's legal inside `<body>` has a matching exported
function of the same name — `div`, `button`, `a`, `img`, `ul`, `li`, `input`,
`section`, `svg`, etc. `<var>` is exported as `Var` (capitalized) to avoid colliding
with the `var` keyword. `<base>`, `<html>`, `<head>`, `<body>`, and deprecated tags
are intentionally not included. For anything not covered (a custom element / web
component tag name, for instance), use the generic factory directly:

```js
import { element } from "./xsml.js";
function myCustomElement() {
    return element("my-custom-element", { someAttr: "value" }, "child text");
}
```

Every tag function has the same signature:

```js
tagName(attrsOrChild, ...remainingChildren)
```

The first argument is treated as an **attributes object** only if it's a plain
object (not `null`, not an `HTMLElement`, not an array). Otherwise it's treated as
the first child. This means **you don't have to pass `{}` when there are no
attributes** — `div("Hello, World!")` and `div({}, "Hello, World!")` behave
identically. Pass an attrs object only when you actually have attributes to set;
omit it freely otherwise.

```js
import { div, img, a, button } from "./xsml.js";

function card() {
    return div({ class: "card" },
        img({ src: "/photo.png", alt: "..." }),
        a({ href: "/details" },
            button("View details")
        )
    );
}
```

### What counts as a child

A child can be a string, an `HTMLElement`, a no-arg function that returns one of
those (or another such function), or an array of any of the above (arrays are
flattened recursively). `undefined` and `null` children are silently skipped — this
is the idiomatic way to conditionally omit an element:

```js
someCondition ? div("shown") : undefined
```

Anything else (a raw number, an object, etc.) throws at render time — coerce
numbers to strings yourself, e.g. `String(count)`.

**Strings only ever set `textContent`.** XSML never touches `innerHTML` or
`innerText`, specifically to avoid XSS — so you can safely interpolate untrusted
text into a string child without escaping it yourself.

**Choosing HTMLElement vs. a function for a child** is a memory/re-render
tradeoff, not just a style choice:
- Passing an already-constructed `HTMLElement` (or calling a component function and
  passing its *result*) means it's built once, immediately, and kept around even
  while not visible (e.g. on another route) — cheap for small trees, wasteful for
  large/content-heavy ones.
- Passing a **function reference** (not its result) means XSML calls it fresh each
  time it's rendered, and lets it be garbage-collected when not displayed. Signal
  state inside that function resets each time it's re-rendered, so if a subtree's
  local state needs to survive being hidden and shown again, prefer keeping it as a
  standing `HTMLElement` instead of a function, or lift the signal itself out to
  somewhere that persists (e.g. module scope or a parent that isn't re-created).

### Setting attributes

Attributes go in the plain-object first argument and must be strings (or `false`/
`null`/`undefined`, which remove the attribute instead of setting it):

```js
div({ id: "some-id", "class": "some-class" }, /* children */)
```

Quoting a key like `"class"` is optional in modern JS (reserved words are legal
unquoted object keys) — quote it or not, purely a style choice.

**Attributes can't be functions.** `button({ onclick: () => {...} })` silently does
nothing useful (it gets stringified, not attached as a handler). For event
handlers, or any imperative tweak to the element, use `.and(...)`:

```js
button("Click me")
    .and(btn => btn.onclick = () => console.log("clicked"))
```

`.and(callback)` runs `callback(element)` and returns the same element, so it chains
inline without breaking the declarative tree — this is the general escape hatch any
time you need direct DOM access mid-expression (measuring size, focusing, attaching
a non-event property, etc.), not just for event handlers.

**Don't set the same attribute/event/property more than once** across the attrs
object, `.and()`, and signal subscribers (`$eventIn`/`$attrOut`) combined — XSML
doesn't warn about this, it'll just result in whichever assignment runs last.

## Components

There's no special component API — a "component" is just any function that returns
something XSML can render (an `HTMLElement`, string, or another such function).
Props are just regular function arguments, and they're **not reactive** unless you
explicitly pass a signal as the prop and read `.get()` inside, or subscribe to it.

## Control flow

**Loops** — map data to an array of elements the normal JS way:

```js
ul(items.map(item => li(item)))
```

**Conditionals** — a ternary is fine for a single element:

```js
div(someCondition ? div("yes") : undefined)
```

For more than a simple ternary (if/else-if chains, switches), factor the branching
out into a small function that returns the right element rather than nesting
ternaries.

Both of the above are for *static* (render-once) content. If the list or condition
needs to update reactively after signals change, see `$childrenOut`/`$childOut`
below instead — the static patterns above won't update on their own.

## Signals (reactivity)

`$` is the signal constructor (not a special syntax — a real class, imported by
name). Always call it with `new`:

```js
import { $ } from "./xsml.js";
const count = new $(0);
```

Manual API — useful any time you're not wiring a signal directly to DOM output:

```js
count.get();                          // read current value
count.set(5);                         // overwrite, notifies subscribers
count.update(v => v + 1);             // derive new value from old, notifies subscribers
count.pushSub(v => console.log(v));   // run arbitrary code on every update
```

Four `HTMLElement` methods wire a signal directly to an element. All four return
the element itself, so they chain like `.and()` does:

- **`.$eventIn(signal, eventName, (event, currentValue) => newValue)`** — listens
  for a DOM event and uses it to `set()` the signal. Safe to call more than once
  per element for *different* event names; don't call it twice for the same event
  on the same element.

- **`.$attrOut(signal, attrName, currentValue => valueToAssign)`** — on every
  signal update, sets the named attribute via `setAttribute`, the same mechanism the
  attrs object on tag functions uses. Use HTML attribute names (`class`, not
  `className`), matching how you'd name it in an attrs object — not JS property
  names. Call once per attribute per element. `setAttribute` only affects real HTML
  attributes, not DOM-only state like text content — for reactively updating what's
  *displayed inside* an element (the classic "counter" text-label case), use
  `$childOut` below instead of `$attrOut`.

- **`.$childrenOut(signal, currentValue => arrayOfChildren)`** — replaces *all*
  children with a fresh array every time the signal updates (`replaceChildren`
  under the hood). Call once per element — it's meant to own that element's
  children entirely, not to be combined with static children.

- **`.$childOut(signal, currentValue => singleChild)`** — same idea as
  `$childrenOut` but for exactly one child, so you don't need to wrap/spread a
  single-element array. Also call at most once per element. Since the callback can
  return a plain string, this is the natural way to reactively drive an element's
  displayed text (`textContent`-style updates) from a signal — prefer it over
  `$attrOut` for that, since `$attrOut` only ever sets real HTML attributes.

```js
function counter() {
    const count = new $(0);
    return div(
        button({ id: "counter-btn" }, "Increment")
            .$eventIn(count, "click", (_, value) => value + 1),
        label({ for: "counter-btn" })
            .$childOut(count, value => `Counter: ${value}`)
    );
}
```

(This uses `$childOut` rather than `$attrOut` because the reactive part here is the
label's *text content*, not an HTML attribute — `$childOut` replaces the element's
child with whatever the callback returns, string or `HTMLElement`, which covers
`textContent`-style updates naturally. For attribute-backed cases, e.g. reactively
toggling a `class` or `disabled` attribute, `$attrOut` is the right tool instead:
`.$attrOut(isOn, "class", v => v ? "active" : "")`.)

```js
function list() {
    const items = new $(["first", "second", "third"]);
    return ul()
        .$childrenOut(items, list => list.map(item => li({}, item)));
}
```

```js
function toggle() {
    const isVideo = new $(false);
    return div()
        .$childOut(isVideo, useVideo => useVideo ? video({}) : img({}));
}
```

**Signal state survives page navigation** as long as the signal itself lives
somewhere that isn't re-created on navigation (e.g. declared outside a route's
render function, or in a route rendered as a standing `HTMLElement` rather than a
function — see the HTMLElement-vs-function tradeoff above). A signal declared
inside a function-based route's body is recreated (and thus reset) every time that
route function runs.

## Routing (single-page apps)

If the user just wants a multi-page site, skip the router entirely — give each HTML
file its own `<script type="module">` entry point, same as any static site.

For a single-page app, `router(notFoundPath, routesTable)` builds a `div#xsml-router`
that owns navigation. Mount it via `xsml(...)` exactly once — creating more than one
router in an app leads to undefined behavior, since each one independently attaches
its own click/popstate listeners.

```js
import { xsml, router } from "./xsml.js";

xsml(
    router("/404", {
        "/": index,
        "/other": other,
        "/path": {
            "/to": tofile,
            "/to/file": file,
        },
        "/404": notFound,
    })
);
```

- Keys are path segments matched against `location.pathname`; nesting an object as
  a value folds it into the parent path (`/path` + `/to` → `/path/to`) — so the
  example above is equivalent to a flat table with `"/path/to"` and
  `"/path/to/file"` keys.
- Values can be an `HTMLElement`, a string, a route function (no-arg, returns any
  of those), or another nested routing object.
- The router does **not** validate that routes are reachable or free of
  duplicates — a typo'd or shadowed path fails silently at runtime, so double-check
  path strings by hand.
- Internal same-origin link clicks (plain left-clicks, no modifier keys, no
  `target="_blank"`, no `download`) are intercepted automatically via `<a href="...">`
  — you don't need to call anything to navigate, just render a normal `a()` element
  pointed at a route path.
- There's an optional second argument for attributes on the router's own wrapping
  div (`router(notFoundPath, attrs, routesTable)`) if you need to style or ID that
  container — omit it (as in the example above) and it defaults to `{}`.

There's also an exported (currently unfinished/experimental-looking) `geolocation`
tag function mirroring the WHATWG `<geolocation>` element proposal — treat it as
unstable and confirm with the user before relying on it.

## Gotchas checklist

Skim this before shipping XSML code:

- Importing `xsml.js` patches `HTMLElement.prototype` globally with `and`,
  `$eventIn`, `$attrOut`, `$childrenOut`, and `$childOut`. If another library on the
  page already defines any of those names on `HTMLElement.prototype`, `xsml.js`
  throws at import time — don't import it twice or alongside a library with
  colliding prototype extensions.
- `{}` as the first arg to a tag function is optional, not required, when there are
  no attributes to set.
- `$attrOut` sets an HTML **attribute** via `setAttribute`, same as the attrs
  object — it can't update DOM-only display state like text content. Use
  `$childOut` for reactively driving what's displayed inside an element instead.
- `$childrenOut`/`$childOut`/event-listener-per-event-name should each be called at
  most once per (element, target) pair — repeat calls silently layer on top of each
  other rather than erroring.
- Numbers, plain objects, and other non-(string/HTMLElement/function/array) values
  as children throw at render time — stringify first.
- `and`, `$eventIn`, etc. all return the same element, so they're meant to be
  chained inline in the middle of a declarative tree, not used as a separate
  imperative step after the tree is built.
