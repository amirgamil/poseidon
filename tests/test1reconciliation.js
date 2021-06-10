const browserEnv = require("browser-env");
const {
    Component
} = require("../src/poseidon.js");


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

test('displayButton', t => {
    const root = t.context.root;
    const app = new App();
    root.appendChild(app.node); 
    //initial load
    t.is(root.innerHTML, `<div><h1 style="color: blue;">Hello world</h1><p1 style="font-style: italic; font-size: 20px;">This is a web framework from scratch
</p1><button>Click to re-render!</button></div>`);
    app.clicked() 
    //button click
    t.is(root.innerHTML, `<div><div><p>look up</p></div><h1 style="color: green;">Hello world</h1><button>Click to re-render!</button></div>`);
})
