import {jsml, router} from "../jsml.js";
import {index} from "./pages/index.js";
import {notFound} from "./pages/notFound.js";
import {docs} from "./pages/docs.js";

jsml(
	router("/jsml/not-found", {}, {
		"/jsml": { // gh pages puts the site at /jsml
			// "": index,
			"/": index,
			"/not-found": notFound, // actual 404 page to display
			"/docs": docs,
		}
	})
);