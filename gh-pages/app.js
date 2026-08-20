import {xsml, router} from "../xsml.js";
import {index} from "./pages/index.js";
import {notFound} from "./pages/notFound.js";
import {docs} from "./pages/docs.js";

xsml(
	router("/xsml/not-found", {
		"/xsml": { // gh pages puts the site at /xsml
			"/": index,
			"/not-found": notFound,
			"/docs": docs,
		}
	})
);