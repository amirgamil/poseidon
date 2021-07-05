const browserEnv = require("browser-env");
const {
    Component,
    List,
    Atom,
    ListOf,
    CollectionStore, 
    CollectionStoreOf,
} = require("../src/poseidon.js");

const {
    html,
    css
} = require("../src/vdom.js");

const test = require('ava');
// Create document global var
browserEnv(["document"]);
browserEnv(["window"]);

test.beforeEach(t => {
    let root = document.getElementById("root");
    if (!root) {
      root = document.createElement("div");
      root.id = "root";
      document.body.appendChild(root);
    }
    t.context.root = root;
});

test('displayButton', t => {
    //test css template literal first
    var template = css`
        display: block;
        font-size: 10px;
        content: "hello";
    `
    t.is(template.rules[0].key, "display");
    t.is(template.rules[0].value, "block");

    t.is(template.rules[1].key, "font-size");
    t.is(template.rules[1].value, "10px");

    t.is(template.rules[2].key, "content");
    t.is(template.rules[2].value, '"hello"');

    //test with multiple nested tags on the same level
    template = css`
        position: absolute;
        div {
            background-color: green;
        }

        p {
            font-size: 15px;
        }
    `
    t.is(template.rules[0].key, "position");
    t.is(template.rules[0].value, "absolute");


    t.is(template.rules[1].tag, "<container> div ");
    t.is(template.rules[1].rules[0].key, "background-color");
    t.is(template.rules[1].rules[0].value, "green");
    t.is(template.rules[2].tag, "<container> p ");
    t.is(template.rules[2].rules[0].key, "font-size");
    t.is(template.rules[2].rules[0].value, "15px");

    //test some special character css properties
    //keyframes, media tags with min/max-width, pseudo-selector support, and selectors with :
    template = css`
            a::before{
                content: "<";
            }

            a:visited {
               background-color: blue;
            }

            div {
                animation: test; 
                &::after {
                    text-decoration: underline;
                }
            }

            @keyframes test { 
                0% {
                    background-position: 0% 0%;
                }

                50% {
                    background-position: 100% 0%;
                }
            }

            @media only screen and (min-width: 400px) and (max-width: 600px) {
                body {
                    padding: 0px 2px 2px 0px;
                }
            }
    `
    t.is(template.rules[0].tag, "<container> a::before");
    t.is(template.rules[0].rules[0].key, "content");
    t.is(template.rules[0].rules[0].value, '"<"');
    t.is(template.rules[1].tag, "<container> a:visited ");
    t.is(template.rules[1].rules[0].key, "background-color");
    t.is(template.rules[1].rules[0].value, "blue");
    t.is(template.rules[2].tag, "<container> div ");
    t.is(template.rules[2].rules[0].key, "animation");
    t.is(template.rules[2].rules[0].value, "test");
    t.is(template.rules[2].rules[1].tag, "<container> div  &::after ");
    t.is(template.rules[2].rules[1].rules[0].key, "text-decoration");
    t.is(template.rules[2].rules[1].rules[0].value, "underline");
    t.is(template.rules[3].tag, "@keyframes test ");
    t.is(template.rules[3].rules[0].tag, "0% ");
    t.is(template.rules[3].rules[0].rules[0].key, "background-position");
    t.is(template.rules[3].rules[0].rules[0].value, "0% 0%");
    t.is(template.rules[3].rules[1].tag, "50% ");
    t.is(template.rules[3].rules[1].rules[0].key, "background-position");
    t.is(template.rules[3].rules[1].rules[0].value, "100% 0%");
    t.is(template.rules[4].tag, "@media only screen and (min-width:400px) and (max-width:600px) ")
    t.is(template.rules[4].rules[0].tag, "body ");
    t.is(template.rules[4].rules[0].rules[0].key, "padding");
    t.is(template.rules[4].rules[0].rules[0].value, "0px 2px 2px 0px");

    class Stylish extends Component {
        init() {

        }

        styles() {
            const val = true;
            return css`
                display: initial;
                font-weight: 10px;
                h1 {
                    color: rgb(0,0,0);
                }
                div {
                    font-size: ${val ? `10px` : `5px`};
                    content: "Test";
                    ${val ? css`
                        p {
                            background-origin: initial;
                        } 
                    ` : null}
                }
                /*this is a comment to spice things up
                p {
                    should not be displayed: here;
                } */
                ${val ? css`p {
                    background-color: green;
                }` : null}
            `
        }

        create() {
            return html`<div class = "marker">
                <p class = "outer">Stuff</p>
                <h1>Hello</h1>
                <div class = "inner">
                    <p class = "inside">Inside special div</p>
                </div>
            </div>`
        }
    }
    const c = new Stylish();
    document.body.appendChild(c.node);
    //test correct css is loading by calling the DOM's `getComputedStyles` to view the styles of a 
    //given tag
    var element = document.querySelector(".marker");
    var styles = window.getComputedStyle(element);
    //save styles of the outer div which will be used in a later test
    const stylesOuter = styles;
    t.is(styles.display, "initial");
    t.is(styles["font-weight"], "10px");
    element = document.querySelector(".outer");
    styles = window.getComputedStyle(element);
    t.is(styles["background-color"], "green");
    //outer p tag which gets matched first should NOT have the inner background-initial style inside the div
    t.assert(styles["background-initial"] === undefined || styles["background-initial"] !== "initial");
    element = document.querySelector("h1");
    styles = window.getComputedStyle(element);
    t.is(styles.color, "rgb(0, 0, 0)"); 
    element = document.querySelector(".inner");
    styles = window.getComputedStyle(element);
    t.is(styles["font-size"], "10px");
    t.is(styles["content"], '"Test"');
    element = document.querySelector(".inside");
    styles = window.getComputedStyle(element)
    t.is(styles["background-origin"], "initial");



    //test re-render uses the same reloaded stylesheets if possible
    // c.render();
    // element = document.querySelector(".marker");
    // styles = window.getComputedStyle(element);
    // t.is(stylesOuter, styles);
    
});