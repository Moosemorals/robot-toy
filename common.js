
/**
 * Get first element that matches the selector. Searches
 * the document, or the given element
 * @param {string|HTMLElement} a
 * @param {null|string} b
 * @returns {HTMLElement|null} The element, or null if not found
 */
export function $(a, b) {
    if (b) {
        return a.querySelector(b);
    }
    return document.querySelector(a);
}

/**
 * Get all elements that match the selector. Searches the
 * document, or the given element
 * @param {string|Element} a
 * @param {null|string} b
 * @returns {HTMLElement[]} An array of elements
 */
export function $$(a, b) {
    if (b) {
        return Array.from(a.querySelectorAll(b));
    }
    return Array.from(document.querySelectorAll(b));
}

export function docFrag() {
    return document.createDocumentFragment();
}

/**
 * Converts the argument to a node, recursivly in the case
 * of an array.
 * @param {any} a
 * @returns {HtmlNode}
 */
export function toNode(a) {
    switch (typeof a) {
        case "string":
        case "number":
        case "boolean":
            return document.createTextNode(a);
        default:
            if (a == null) {
                return docFrag();
            } else if (a instanceof Node) {
                return a;
            } else if (Array.isArray(a)) {
                const f = docFrag();
                for (let i = 0; i < a.length; i += 1) {
                    f.appendChild(toNode(a[i]));
                }
                return f;
            }
    }
    throw new Error("Unhandled in to node: ", a);
}

/**
 * Create a new element
 * @param {string} tag Tag name
 * @param {string|object} options Either a string for classes, or attribute key/value pairs
 * @param {...any} contents Contents of the new element, will be converted to nodes if needed
 * @returns {HTMLElement}
 */
export function buildElement(tag, options, ...contents) {
    const el = document.createElement(tag);

    if (typeof options === "string") {
        el.setAttribute("class", options);
    } else if (typeof options === "object") {
        for (let k in options) {
            if (options[k] != null) {
                el.setAttribute(k, options[k]);
            }
        }
    }

    for (let i = 0; i < contents.length; i += 1) {
        el.appendChild(toNode(contents[i]));
    }

    return el;
}

/**
 * Remove an element from the dom. Returns the element that was removed
 * @param {HTMLNode} el
 */
export function removeElement(el) {
    const parent = el.parentNode;
    if (parent != null) {
        parent.removeChild(el);
    }
    return el;
}

/**
 * Remove any children of an element. Returns the element.
 * @param {any} el
 */
export function emptyElement(el) {
    while (el.firstChild) {
        el.removeChild(el.firstChild);
    }
    return el;
}

export function append(el, ...contents) {
    for (let i = 0; i < contents.length; i += 1) {
        el.appendChild(toNode(contents[i]));
    }
}