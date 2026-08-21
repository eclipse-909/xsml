import {section, h1, p, a} from "../../xsml.js";
import {pageLayout} from "../components/layout.js";

export function notFound() {
	return pageLayout("not-found-content",
		section({class: "not-found"},
			h1("404"),
			p("This page doesn't exist."),
			a({href: "/xsml/", class: "btn btn-primary"}, "Back to Home")
		)
	);
}
