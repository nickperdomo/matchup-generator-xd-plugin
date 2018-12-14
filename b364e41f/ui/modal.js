/**
* Shorthand for creating Elements.
* @param {*} tag The tag name of the element.
* @param {*} [props] Optional props.
* @param {*} children Child elements or strings
*/
function h(tag, props, ...children) {
let element = document.createElement(tag);
if (props) {
    if (props.nodeType || typeof props !== "object") {
        children.unshift(props);
    }
    else {
        for (let name in props) {
            let value = props[name];
            if (name == "style") {
                Object.assign(element.style, value);
            }
            else {
                element.setAttribute(name, value);
                element[name] = value;
            }
        }
    }
}
for (let child of children) {
    element.appendChild(typeof child === "object" ? child : document.createTextNode(child));
}
return element;
}

/* Setup Dialog Modal
 ***************************************/ 
let setupDialog =
    h("dialog",
        h("form", { method:"dialog", style: { width: 400 } },
            h("h1", "Matchup Images Setup"),
            h("hr"),
            // h("p", "A note here."),
            h("label",
                h("span", "Sport"),
                h("select",
                    ...["NBA","NCAA","NFL","NHL","MLB"].map( name => h("option", `${name}`) )
                )
            ),
            h("label",
                h("span", "Export List URL"),
                h("input")
            ),
            h("label", { style: { flexDirection: "row", alignItems: "center" }},
                h("input", { type: "checkbox" }),
                h("span", "Use Offline Logos")
            ),
            h("footer",
                h("button", { uxpVariant: "primary", onclick(e) { setupDialog.close() } }, "Cancel"),
                h("button", { uxpVariant: "cta", onclick(e) { setupDialog.close() } }, "Export Images")
            )
        )
    )
document.body.appendChild(setupDialog);



module.exports = {
    setupDialog: setupDialog, 
};