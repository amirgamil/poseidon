const browserEnv = require("browser-env");
const {
    Component, renderVDOM
} = require("../src/poseidon.js");


const test = require('ava');
// Create document global var
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

//helper method for rendering a new vDOM node
const renderNext = vdom => renderVDOM(vdom, undefined, undefined);

test('tags', t => {
    //support different tag names
    const tags = [
        'div',
        'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
        'p', 'a', 'em', 'strong',
        'img',
        'button',
        'input', 'textarea',
        'img',
        'label',
        'ul', 'ol', 'li', 'table',
        'iframe',
        'main', 'header', 'footer', 'article', 'section',
        'br'
    ]
    for (const tag of tags) {
        const node = renderNext({
            tag: tag
        })
        t.is(node.tagName.toLowerCase(), tag);
    }
})


test('render', t => {
    //handle render of completely different element
    var initial = {tag: "div"}; 
    var node = renderNext(initial);
    var newVDOM = {tag: "p", children: [{tag: "TEXT_ELEMENT", nodeValue: "hello"}]};
    var newNode = renderVDOM(newVDOM, initial, node);
    t.is(newNode.tagName.toLowerCase(), "p");
    t.is(newNode.childNodes[0].data, "hello");

    //handler render of same element
    newVDOM = {tag: "div"};
    newNode = renderVDOM(newVDOM, initial, node);
    t.is(newNode.tagName.toLowerCase(), "div"); 

    //hander render same element, different attributes
    initial = {tag: "div", attributes: {class: "coolClass", id: "notCoolID"}};
    newVDOM = {tag: "div", attributes: {class: "coolerClass", id: "superCoolID", style: "display: flex;"}};
    node = renderNext(initial);
    newNode = renderVDOM(newVDOM, initial, node);
    t.is(newNode.tagName.toLowerCase(), "div");
    //check it has not created a new div node, just updated properties
    t.is(newNode, node);
    // console.log(node["class"]);
    t.is(newNode.getAttribute("class"), "coolerClass");
    t.is(newNode.getAttribute("id"), "superCoolID");
    t.is(newNode.getAttribute("style"), "display: flex;");

    //handle render remove old attributes
    initial = {tag: "div", attributes: {class: "coolClass", id: "notCoolID"}};
    newVDOM = {tag: "div", attributes: {}}
    node = renderNext(initial);
    newNode = renderVDOM(newVDOM, initial, node);
    t.is(newNode.tagName.toLowerCase(), "div");
    //check it has not created a new div node, just updated properties
    t.is(newNode, node);
    t.is(newNode.getAttribute("class"), null); 
    t.is(newNode.getAttribute("id"), null);

    //handle render remove old styles
    initial = {tag: "div", attributes: {style: "position: absolute; font-size: 10px;"}}
    newVDOM = {tag: "div", attributes: {style: "display: flex;"}};
    node = renderNext(initial);
    newNode = renderVDOM(newVDOM, initial, node);
    t.is(newNode.tagName.toLowerCase(), "div");
    //check it has not created a new div node, just updated properties
    t.is(newNode, node);
    //check that old style attributes have been removed 
    t.is(newNode.getAttribute("position"), null); 
    t.is(newNode.getAttribute("font-size"), null); 
    t.is(newNode.getAttribute("style"), "display: flex;");
    
    //handle changed same styles
    initial = {tag: "div", attributes: {style: "position: absolute"}};
    newVDOM = {tag: "div", attributes: {style: "position: relative;"}};
    node = renderNext(initial);
    newNode = renderVDOM(newVDOM, initial, node);
    t.is(newNode.tagName.toLowerCase(), "div");
    //check it has not created a new div node, just updated properties
    t.is(newNode, node);
    //check that old style attributes have been removed 
    t.is(newNode.getAttribute("style"), "position: relative;");

    //handle render same element, different children
    initial = {tag: "div", attributes: {class: "coolClass", id: "notCoolID"}};
    newVDOM = {tag: "div", attributes: {class: "coolClass", id: "notCoolID"}, 
                        children: [
                        {tag: "p", children: [{tag: "TEXT_ELEMENT", nodeValue: "hello"}]}
                        ]
             };
    node = renderNext(initial); 
    newNode = renderVDOM(newVDOM, initial, node);
    t.is(newNode.tagName.toLowerCase(), "div");
    t.is(newNode.getAttribute("class"), "coolClass");
    t.is(newNode.getAttribute("id"), "notCoolID");
    t.is(newNode.children[0].tagName.toLowerCase(), "p");
    t.is(newNode.children[0].childNodes[0].data, "hello");

    //handle render, different number of children
    initial = {tag: "div", attributes: {class: "coolClass", id: "notCoolID"},
               children: [
                    {tag: "p"},
                    {tag: "button"},
                    {tag: "div"}
               ]};
    //case a: more children
    newVDOM = {tag: "div", attributes: {class: "coolClass", id: "notCoolID"},
               children: [
                    {tag: "p"},
                    {tag: "button"},
                    {tag: "div"},
                    {tag: "p"},
                    {tag: "h1"}
                ]};
    node = renderNext(initial);
    newNode = renderVDOM(newVDOM, initial, node);
    t.is(newNode.tagName.toLowerCase(), "div");
    t.is(newNode.children[0].tagName.toLowerCase(), "p");
    t.is(newNode.children[1].tagName.toLowerCase(), "button");
    t.is(newNode.children[2].tagName.toLowerCase(), "div");
    t.is(newNode.children[3].tagName.toLowerCase(), "p");
    t.is(newNode.children[4].tagName.toLowerCase(), "h1");

    //case b: less children
    node = renderNext(initial);
    newVDOM = {tag: "div", attributes: {class: "coolClass", id: "notCoolID"},
               children: [
                    {tag: "p"},
                ]};
    newNode = renderVDOM(newVDOM, initial, node);
    t.is(newNode.tagName.toLowerCase(), "div");
    t.is(newNode.children[0].tagName.toLowerCase(), "p"); 
    t.is(newNode.children.length, 1);
    //case c: same number of children, different order/items changed
    node = renderNext(initial);
    newVDOM= {tag: "div", attributes: {class: "coolClass", id: "notCoolID"},
               children: [
                    {tag: "ul"},
                    {tag: "div"},
                    {tag: "button"}
               ]};
    newNode = renderVDOM(newVDOM, initial, node);
    t.is(newNode.tagName.toLowerCase(), "div");
    t.is(newNode.children[0].tagName.toLowerCase(), "ul");
    t.is(newNode.children[1].tagName.toLowerCase(), "div");
    t.is(newNode.children[2].tagName.toLowerCase(), "button");
    t.is(newNode.children.length, 3);
    //case d: more children, items changed
    node = renderNext(initial);
    newVDOM = {tag: "div", attributes: {class: "coolClass", id: "notCoolID"},
               children: [
                    {tag: "button"},
                    {tag: "p"},
                    {tag: "div"},
                    {tag: "ul"},
                    {tag: "img"}
                ]};
    node = renderNext(initial);
    newNode = renderVDOM(newVDOM, initial, node);
    t.is(newNode.tagName.toLowerCase(), "div");
    t.is(newNode.children[0].tagName.toLowerCase(), "button");
    t.is(newNode.children[1].tagName.toLowerCase(), "p");
    t.is(newNode.children[2].tagName.toLowerCase(), "div");
    t.is(newNode.children[3].tagName.toLowerCase(), "ul");
    t.is(newNode.children[4].tagName.toLowerCase(), "img");
    t.is(newNode.children.length, 5);

    //case e: less children, items changed
    node = renderNext(initial);
    newVDOM= {tag: "div", attributes: {class: "coolClass", id: "notCoolID"},
               children: [
                    {tag: "div"},
                    {tag: "input"},
               ]};
    newNode = renderVDOM(newVDOM, initial, node);
    t.is(newNode.tagName.toLowerCase(), "div");
    t.is(newNode.children[0].tagName.toLowerCase(), "div");
    t.is(newNode.children[1].tagName.toLowerCase(), "input");
    t.is(newNode.children.length, 2);

    
    //case f: same children, different nested children
    node = renderNext(initial);
    newVDOM = {tag: "div", attributes: {class: "coolClass", id: "notCoolID"},
               children: [
                    {tag: "p"},
                    {tag: "button"},
                    {tag: "div", children: [
                        {tag: "p"},
                        {tag: "button"},
                    ]}
               ]};
    
    newNode = renderVDOM(newVDOM, initial, node);
    t.is(newNode.tagName.toLowerCase(), "div");
    t.is(newNode.children[0].tagName.toLowerCase(), "p");
    t.is(newNode.children[1].tagName.toLowerCase(), "button");
    t.is(newNode.children[2].tagName.toLowerCase(), "div");
    t.is(newNode.children.length, 3);
    t.is(newNode.children[2].children[0].tagName.toLowerCase(), "p");
    t.is(newNode.children[2].children[1].tagName.toLowerCase(), "button");
    t.is(newNode.children[2].children.length, 2);

    
    //update text of node without creating new one
    initial = {tag: "p", children: [{tag: "TEXT_ELEMENT", nodeValue: "hello wordl"}]};
    node = renderNext(initial);
    newVDOM = {tag: "p", children: [{tag: "TEXT_ELEMENT", nodeValue: "hello world"}]};
    newNode = renderVDOM(newVDOM, initial, node);
    t.is(newNode.childNodes[0].data, "hello world");
    //check it has not created a new DOM node for the p tag
    t.is(newNode, node);

    //returns the same DOM node if asked to render a fully fledged DOM node
    initial = document.createElement('input');
    node = renderNext(initial);
    t.is(node, initial);

    initial = document.createElement('input');
    node = renderNext(initial);
    newVDOM = document.createElement('p');
    newNode = renderVDOM(newVDOM, initial, node);
    t.is(newNode, newVDOM);

    //check IDL attributes are the same as content attributes
    initial = {tag: "input", attributes: {type: "button", "data-cool": "yes", "data-fire": "true"}}
    node = renderNext(initial);
    node["test"] = 1;
    t.is(node.getAttribute("data-cool"), "yes");
    t.is(node.getAttribute("data-fire"), "true");

    //IDL attributes (reflect content attributes of HTML elements) if DOM mutation has already occurred
    initial = {tag: "input", attributes: {value: "hello"}};
    node = renderNext(initial);
    newVDOM = {tag: "input", attributes: {value: "hello world"}};
    //directly modify IDL attributes
    node.value = "hello world";
    node.selectionStart = 1;
    newNode = renderVDOM(newVDOM, initial, node);
    //Poseidon will not re-set attributes that have already been set to the DOM
    //this reduces unwanted side-effects that may crop up
    t.is(newNode, node);
    t.is(newNode.selectionStart, 1);
    t.is(newNode.value, "hello world");
})

test('childNodes', t => {
    var initial = {tag: "div", children: [{tag: "span"}]}; 
    var node = renderNext(initial);
    t.is(node.childNodes[0].tagName.toLowerCase(), "span");

    nextVDOM = {tag: "div", children: [{tag: "strong"}]}
    var nextNode = renderVDOM(nextVDOM, initial, node);
    t.is(nextNode, node);
    t.is(nextNode.childNodes[0].tagName.toLowerCase(), "strong");
    t.is(nextNode.childNodes.length, 1);

    initial = {tag: "div", children: [{tag: "p", children: [{tag: "TEXT_ELEMENT", nodeValue: "first time"}]}]};
    node = renderNext(initial);
    nextVDOM = {tag: "div", children: [{tag: "p", children: [{tag: "TEXT_ELEMENT", nodeValue: "second time"}]}]};
    nextNode = renderVDOM(nextVDOM, initial, node);

    t.is(nextNode, node);
    t.is(nextNode.childNodes[0].tagName.toLowerCase(), "p");
    t.is(nextNode.childNodes[0].childNodes[0].nodeValue, "second time");
    t.is(nextNode.childNodes[0].childNodes.length, 1);

    //render text directly
    node = renderNext(initial);
    nextVDOM = {tag: "div", children: [{tag: "p", children: ["Test"]}]};
    nextNode = renderVDOM(nextVDOM, initial, node);
    t.is(nextNode.childNodes[0].childNodes[0].nodeValue, "Test");

    node = renderNext(initial)    
    nextVDOM = {tag: "div", children: ["Test"]};
    nextNode = renderVDOM(nextVDOM, initial, node);
    t.is(nextNode.childNodes[0].nodeValue, "Test"); 
})


test('event listeners', t => {
    //adding an event listener
    let clicked = false;
    var initial = {tag: "button", events: {click: () => {clicked = true;}}};
    var node = renderNext(initial);
    node.click();
    t.is(clicked, true);

    //no event listener in re-render
    clicked = false;
    node = renderNext(initial);
    var newVDOM = {tag: "button"}; 
    var nextNode = renderVDOM(newVDOM, initial, node);
    t.is(clicked, false);


    //adding a different listener handler (should remove old listener)
    clicked = "same";
    node = renderNext(initial);
    newVDOM = {tag: "button", events: {click: () => {clicked = "different";}}};
    nextNode = renderVDOM(newVDOM, initial, node); 
    nextNode.click();
    t.is(clicked, "different");

    //adding event listener that is not a function 
    const notFunction = "yes";
    clicked = false;
    node = renderNext(initial);
    newVDOM = {tag: "button", events: {click: notFunction}};
    const fn = () => renderVDOM(newVDOM, initial, node);
    //ensure this raises an error
    const error = t.throws(() => {
        fn();
    }, {instanceOf: TypeError});
    t.is(error.message, "Only undefined, null, an object, or a function are allowed for the callback parameter");
})

test('component', t => {
    //test init called before render
    // const c = new Component();
    // console.log(c.node); 
    t.is('', '');
})


test('reconciliation', t => {
    //more complex end to end diffing
    const root = t.context.root;
    class App extends Component {
        init() {
            this.clicked = this.clicked.bind(this);
            this.hidden = false;
        }
    
    
        clicked(evt) {
            this.hidden = !this.hidden;
            this.render();
        }
    
    
        create() {
            if (this.hidden) {
                return {
                    tag: "div",
                    children: [
                        {tag : "div",
                         children: [
                            {tag: "p",
                             children: 
                                [
                                    { tag: "TEXT_ELEMENT",
                                    nodeValue: "look up"}
                                ]
                            }
                         ]
                        },
                        {tag: "h1", 
                        children: [
                            {
                                tag: "TEXT_ELEMENT",
                                nodeValue: "Hello world"
                            }
                        ],
                        attributes: {style: "color: green; "}    
                        },
                        {tag: "button",
                        children: [
                            {
                                tag: "TEXT_ELEMENT",
                                nodeValue: "Click again!"
                            }  
                        ],
                        events: {"click": this.clicked}}], 
                }
            } else {
                return {
                    tag: "div",
                    children: [
                        {tag: "h1", 
                        children: [
                            {
                                tag: "TEXT_ELEMENT",
                                nodeValue: "Hello world"
                            }
                        ],
                        attributes: {style: "color: blue"}}, 
                        {tag: "p1", 
                         children: [
                            {
                                tag: "TEXT_ELEMENT",
                                nodeValue: "This is a web framework from scratch\n"
                            }
                        ],
                         attributes: 
                            {style:
                               "font-style: italic; font-size: 20px"
                            }
                        },
                        {tag: "button",
                        children: [
                            {
                                tag: "TEXT_ELEMENT",
                                nodeValue: "Click to re-render!"
                            }  
                        ],
                        events: {"click": this.clicked}}], 
                }
            }
            
        }
    } 
    const app = new App();
    root.appendChild(app.node); 
    //initial load
    t.is(root.innerHTML, `<div><h1 style="color: blue;">Hello world</h1><p1 style="font-style: italic; font-size: 20px;">This is a web framework from scratch
</p1><button>Click to re-render!</button></div>`);
    app.clicked() 
    //button click
    t.is(root.innerHTML, `<div><div><p>look up</p></div><h1 style="color: green;">Hello world</h1><button>Click again!</button></div>`);
});
