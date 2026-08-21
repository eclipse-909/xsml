import {xsml, router, link} from "../xsml.js";
import {index} from "./pages/index.js";
import {notFound} from "./pages/notFound.js";
import {docs} from "./pages/docs.js";

xsml([
	// Stylesheets are declared as regular xsml elements (see examples/simple) so this
	// page never needs to touch the root index.html. They only need to be rendered once,
	// so they live outside the router instead of inside every page.

	router("/xsml/not-found", {
		"/xsml": { // gh pages puts the site at /xsml
			"/": index,
			"/not-found": notFound,
			"/docs": docs,
		}
	})
]);