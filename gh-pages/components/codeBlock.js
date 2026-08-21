import {pre, code, button, div} from "../../xsml.js";
import hljs from "../highlight/es/highlight.min.js";
import xmlGrammar from "../highlight/es/languages/xml.min.js";
import cssGrammar from "../highlight/es/languages/css.min.js";
import javascriptGrammar from "../highlight/es/languages/javascript.min.js";

let languagesRegistered = false;

function ensureLanguagesRegistered() {
	if (languagesRegistered) {return;}
	hljs.registerLanguage("xml", xmlGrammar);
	hljs.registerLanguage("html", xmlGrammar);
	hljs.registerLanguage("css", cssGrammar);
	hljs.registerLanguage("javascript", javascriptGrammar);
	hljs.registerLanguage("js", javascriptGrammar);
	languagesRegistered = true;
}

/**
 * Builds a syntax-highlighted code block.
 * @param {("html"|"css"|"javascript"|"js")} lang
 * @param {string} source raw code text (never interpreted as HTML)
 * @returns {HTMLElement}
 */
export function codeBlock(lang, source) {
	ensureLanguagesRegistered();
	// Trim a single leading/trailing newline so template-literal sources look tidy.
	const trimmed = source.replace(/^\n/, "").replace(/\n[ \t]*$/, "");
	const codeEl = code({class: `language-${lang} hljs`}, trimmed);
	hljs.highlightElement(codeEl);
	return div({class: "code-block"},
		button({class: "code-copy-btn", type: "button"}, "Copy")
			.and(btn => btn.onclick = () => {
				navigator.clipboard?.writeText(trimmed);
				btn.textContent = "Copied!";
				setTimeout(() => btn.textContent = "Copy", 1200);
			}),
		pre(codeEl)
	);
}
