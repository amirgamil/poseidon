const {
    Component,
    List,
    Atom,
    ListOf,
    CollectionStore, 
    CollectionStoreOf,
    css
} = require("../src/poseidon.js");

const {
    vdom
} = require("../src/vdom.js")


class App extends Component {
    init(res) {
        this.data = res;
    }
    styles() {
        return css`
        .stuff {
            margin: 0;
        }
        `
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
    const testDiv = vdom`
    <div className = "stuff" id = "smt"> 
        <h1> Hello </h1>
        <p> What's popping my fellow friend </p>
    </div>
    `
    const app = new App(testDiv);
    root.appendChild(app.node); 
    t.is(root.innerHTML, `<div class="stuff" id="smt"><h1>Hello </h1><p>What's popping my fellow friend </p></div>`);

    //div with list elements
    //intentionally use inconsistent spacing to make sure parser works in all cases
    const testList = vdom`
        <div className="wrapper">
            <ul>
                <li>Item 1</li>
                <li>Item 2</li>
                <li>Item 3</li>
            </ul>
        </div>
    `
    app.render(testList);
    t.is(root.innerHTML, `<div class="wrapper"><ul><li>Item 1</li><li>Item 2</li><li>Item 3</li></ul></div>`);

    //test special self-closing HTML tags
    const selfClosing = vdom`
            <div>
                <img src="../docs/gcd.png" />
                <p> Hello is a break working </p>
                <br/>
                <input />
                <p> Yes it's working</p>
            </div>`;
    app.render(selfClosing);
    t.is(root.innerHTML, `<div><img src="../docs/gcd.png"><p>Hello is a break working </p><br><input><p>Yes it's working</p></div>`)
    console.log(app.vdom);
    //more HTML tags, strong and a
    const strongAndA =  vdom`
                <div>    
                    <p>This looks and feels like <strong>HTML and JSX</strong></p>
                    <a href = "https://google.com">Link</a>
                </div>
                `
    app.render(strongAndA);   
    console.log(root.innerHTML);          
    t.is(root.innerHTML, `<div><p>This looks and feels like <strong>HTML and JSX</strong></p><a href="https://google.com">Link</a></div>`)
});