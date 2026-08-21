import {div, section, h1, h2, h3, p, a, span} from "../../xsml.js";
import {pageLayout} from "../components/layout.js";
import {codeBlock} from "../components/codeBlock.js";

const HERO_EXAMPLE = `
import { xsml, div, button, label, $ } from "./xsml.js";

function counter() {
    const count = new $(0);
    return div(
        button({ id: "counter-btn" }, "Increment")
            .$eventIn(count, "click", (_, value) => value + 1),
        label({ for: "counter-btn" })
            .$childOut(count, value => \`Counter: \${value}\`)
    );
}

xsml(counter());
`;

function feature(title, description) {
	return div({class: "feature-card"},
		h3(title),
		p(description)
	);
}

export function index() {
	return pageLayout("index-content",
		section({class: "hero"},
			div({class: "hero-text"},
				span({class: "hero-badge"}, "no build step \u00b7 no dependencies"),
				h1("Build UIs with plain JavaScript."),
				p({class: "hero-subtitle"},
					"xsml (extra-small markup) is a tiny, zero-dependency frontend library. " +
					"No transpiler, no virtual DOM, no magic \u2014 just functions that return real HTMLElements."
				),
				div({class: "hero-actions"},
					a({href: "/xsml/docs", class: "btn btn-primary"}, "Get Started"),
					a(
						{href: "https://github.com/eclipse-909/xsml", class: "btn btn-secondary", target: "_blank", rel: "noopener noreferrer"},
						"View on GitHub"
					)
				)
			),
			div({class: "hero-code"},
				codeBlock("javascript", HERO_EXAMPLE)
			)
		),
		section({class: "features"},
			h2({class: "section-title"}, "Why xsml?"),
			div({class: "feature-grid"},
				feature("Zero dependencies", "Just copy one file, xsml.js, into your project. No npm install, no bundler required."),
				feature("Pure JavaScript", "Elements are just function calls that return real HTMLElements. Anything you can do with HTML/CSS/JS, you can do with xsml."),
				feature("Built-in signals", "A lightweight reactive primitive lets you wire DOM updates directly to state changes, with no extra runtime."),
				feature("Client-side routing", "An optional router supports single-page applications with plain path-based routing tables."),
				feature("No XSS surprises", "Strings are only ever set via textContent, never innerHTML, so untrusted text is always safe by default."),
				feature("You're in control", "There's no compiler and no hidden behavior \u2014 the ~1100-line source is the whole library, and it's easy to read end-to-end.")
			)
		),
		section({class: "cta"},
			h2("Ready to try it?"),
			p("Copy xsml.js into your project and start building. It's really that simple."),
			a({href: "/xsml/docs", class: "btn btn-primary"}, "Read the Docs")
		)
	);
}
