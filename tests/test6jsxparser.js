const {
    Component,
    List,
    Atom,
    ListOf,
    CollectionStore, 
    CollectionStoreOf,
} = require("../src/poseidon.js");

const {
   html 
} = require("../src/vdom.js")


class App extends Component {
    init(res) {
        this.data = res;
    }

    create(res) {
        return res; 
    }
}
const test = require('ava');
const browserEnv = require("browser-env");
browserEnv(["document"]);

test.beforeEach(t => {
    let root = document.getElementById("root");
    if (!root) {
      root = document.createElement("div");
      root.id = "root";
      document.body.appendChild(root);
    }
    t.context.root = root;
});

test('testHTMLElementParsing', t => {
    const root = t.context.root;
    //div with nested elements
    const testDiv = html`
    <div class = "stuff" id = "smt"> 
        <h1> Hello </h1>
        <p> What's popping my fellow friend </p>
    </div>
    `
    const app = new App(testDiv);
    root.appendChild(app.node); 
    t.is(root.innerHTML, `<div class="stuff" id="smt"> 
        <h1> Hello </h1>
        <p> What's popping my fellow friend </p>
    </div>`);

    //div with list elements
    //intentionally use inconsistent spacing to make sure parser works in all cases
    const testList = html`
        <div class="wrapper">
            <ul>
                <li>Item 1</li>
                <li>Item 2</li>
                <li>Item 3</li>
            </ul>
        </div>
    `
    app.render(testList);
    t.is(root.innerHTML, `<div class="wrapper">
            <ul>
                <li>Item 1</li>
                <li>Item 2</li>
                <li>Item 3</li>
            </ul>
        </div>`);

    //test special self-closing HTML tags
    const selfClosing = html`
            <div>
                <img src="../docs/gcd.png" />
                <p>Hello is a break working </p>
                <br/>
                <input />
                <p>Yes it's working</p>
            </div>`;
    app.render(selfClosing);
    t.is(root.innerHTML, `<div>
                <img src="../docs/gcd.png">
                <p>Hello is a break working </p>
                <br>
                <input>
                <p>Yes it's working</p>
            </div>`)
    //more HTML tags, strong and a
    const strongAndA =  html`
                <div>
                    <p>This looks and feels like <strong>HTML and JSX</strong></p>
                    <a href = "https://google.com">Link</a>
                </div>
                `
    app.render(strongAndA);   
    t.is(root.innerHTML, `<div>
                    <p>This looks and feels like <strong>HTML and JSX</strong></p>
                    <a href="https://google.com">Link</a>
                </div>`);

    //test some vdom template strings with js expressions
    const js1 = html`<div>
                    <p>${true ? "true" : false}</p>
                    <p>${2 + 9 + 3}</p>
                    ${false ? "this should not be displayed" : null}
                    ${true ? html`<p>Hello</p>` : null}
                </div>`;
    app.render(js1);
    t.is(root.innerHTML, `<div>
                    <p>true</p>
                    <p>14</p>
                    
                    <p>Hello</p></div>`);

    //test jsx expression used as values to key and event handlers
    const js2 = html`<div>
                <input placeholder = "test" val = ${true} oninput = ${(evt) => console.log(evt.target.value)}/>
            </div>`
    app.render(js2);
    t.is(root.innerHTML, `<div>
                <input placeholder="test" val="true">
            </div>`);

    //test mapping an array into a list (common pattern that crops up)
    const js3 = html`<ul>
                        ${Array.from(["a", "b", "c"]).map((element, _) => {
                            return html`<li>${element}</li>`
                        })}
                    </ul>`
    app.render(js3);
    t.is(root.innerHTML, `<ul><li>a</li><li>b</li><li>c</li></ul>`);

    app.render(html`<p><a>Hello</a>      check it</p>`)
    // check comments are not rendered
    const js4 = html`<!--Hello-->`
    t.is(js4, null);

    //test comment with some special characters
    const js5 = html`<div>
        <!-- -> > -->
        <!---->
        <!-- Normal comment 
        that spans multiple lines
        -->
        <p>Hello</p>
    </div>`
    app.render(js5);
    t.is(root.innerHTML, `<div>
        <p>Hello</p>
    </div>`)
    
});