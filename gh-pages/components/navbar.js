import {header, div, a, nav, span} from "../../xsml.js";

/**
 * Site-wide navigation bar. Shown on every page.
 * @returns {HTMLElement}
 */
export function navbar() {
	return header({class: "site-header"},
		div({class: "nav-container"},
			a({href: "/xsml/", class: "brand"},
				span({class: "brand-mark"}, "{ }"),
				span({class: "brand-name"}, "xsml")
			),
			nav({class: "nav-links"},
				a({href: "/xsml/docs", class: "nav-link"}, "Docs"),
				a(
					{href: "https://github.com/eclipse-909/xsml", class: "nav-link nav-link-github", target: "_blank", rel: "noopener noreferrer"},
					"GitHub"
				)
			)
		)
	);
}
