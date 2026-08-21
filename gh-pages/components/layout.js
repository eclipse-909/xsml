import {div, main} from "../../xsml.js";
import {navbar} from "./navbar.js";
import {siteFooter} from "./footer.js";

/**
 * Wraps page content with the shared navbar and footer.
 * @param {string} mainClass extra class(es) for the <main> content area
 * @param  {...import("../../xsml.js").ChildElement} content
 * @returns {HTMLElement}
 */
export function pageLayout(mainClass, ...content) {
	return div({class: "page"},
		navbar(),
		main({class: `page-content ${mainClass}`}, ...content),
		siteFooter()
	);
}
