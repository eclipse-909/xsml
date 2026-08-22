import {footer, div, span, a} from "../../xsml.js";

/**
 * Site-wide footer. Shown on every page.
 * @returns {HTMLElement}
 */
export function siteFooter() {
	return footer({class: "site-footer"},
		div({class: "footer-container"},
			span({class: "footer-item"}, "xsml \u2014 a tiny, dependency-free frontend library."),
			span({class: "footer-item"}, "Copyright \u00A9 2026 Ethan Morton"),
			a(
				{href: "https://github.com/eclipse-909/xsml", class: "footer-item footer-link", target: "_blank", rel: "noopener noreferrer"},
				"View on GitHub"
			)
		)
	);
}
