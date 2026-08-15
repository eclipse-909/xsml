import {jsml, router} from "/jsml.js";
import {index} from "./pages";
import {notFound} from "./pages/notFound.js";
import {docs} from "./pages/docs.js";

jsml(
    router("/not-found", {}, {
        "/": index(),
        "/not-found": notFound(),
        "/docs": docs(),
    })
);