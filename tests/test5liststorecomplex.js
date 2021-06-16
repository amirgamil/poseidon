const browserEnv = require("browser-env");
const {
    Component,
    List,
    Atom,
    ListOf,
    CollectionStore, 
    CollectionStoreOf,
} = require("../src/poseidon.js");

class FormData extends Atom {
    get type() {
        return FormData;
    }
}

class FormItem extends Component {
    init(data, removeCallBack){
        this.data = data;
        this.removeCallBack = removeCallBack;
        this.handleFirstInput = this.handleFirstInput.bind(this);
        this.removeElement = this.removeElement.bind(this);
        this.bind(this.data);
    }

    removeElement() {
       this.removeCallBack(this.data);
    }

    handleFirstInput(evt) {
        this.data.update({first:evt.target.value});
    }

    create({first}){
        return {tag: "div",
        children: [
          {tag: "input", 
           attributes: {value: first},
           events: {"input": this.handleFirstInput}
          },
          {tag: "p",
           children: [
               {tag: "TEXT_ELEMENT",
                nodeValue: first}
           ]},
           {tag: "button",
                children: [
                    {
                        tag: "TEXT_ELEMENT",
                        nodeValue: "Remove!"
                    }  
                ],
                events: {"click": this.removeElement}
            }],
            attributes: {style: "margin-bottom: 25px"}
    }; 
    }
}

class FormList extends ListOf(FormItem) {
    create(nodes) {
        return {tag: "div",
                children : nodes} 
                   
    }
}

class FormDataStore extends CollectionStoreOf(FormData) {

}

class Form extends Component {
    init() {
        const test1 = new FormData({first: "hello"});
        const test2 = new FormData({first: "hi"});
        this.store = new FormDataStore([test1, test2]);
        this.list = new FormList(this.store, data => this.store.remove(data));
        this.addRow = this.addRow.bind(this);
        this.bind(this.store);
    }
    addRow(evt) {
        this.store.add(new FormData({first: "new!"}));
        console.log(this.store);
    }

    create() {
         return {tag: "div",
                 children: [
                    {tag: "h2",
                    children: [
                       {tag: "TEXT_ELEMENT",
                        nodeValue: "Store"}
                    ]},
                    this.list.node,
                    {tag: "button",
                    children: [
                        {
                            tag: "TEXT_ELEMENT",
                            nodeValue: "Add a row!"
                        }  
                    ],
                    events: {"click": this.addRow}},
                    {tag: "button",
                     children: [
                         {
                             tag: "TEXT_ELEMENT",
                             nodeValue: "Print store!"
                         }
                     ],
                     events: {"click": () => console.log(this.store)}} 
                 ]
                }
    }

}

class App extends Component {
    init() {
        this.form = new Form();
    }
    
    debug() {
        console.log(this.node);
    }

    create() {
        return {
            tag: "div",
            attributes: {style: "color: green; "} ,
            children: [
                {tag: "h1", 
                children: [
                    {
                        tag: "TEXT_ELEMENT",
                        nodeValue: "Hello world"
                    }
                ]
                },
                this.form.node]
                // {tag: "button",
                //  children: [
                //      {
                //          tag: "TEXT_ELEMENT",
                //          nodeValue: "Re-render!"
                //      }
                //  ],
                //  events: {"click": () => this.render()}}]
        } 
    }
}

const test = require('ava');
browserEnv(["document"]);

test('editListAndStore', t => {
    const app = new App();
    document.body.appendChild(app.node); 
    //initial load
    t.is(document.body.innerHTML, `<div style="color: green;"><h1>Hello world</h1><div><h2>Store</h2><div><div style="margin-bottom: 25px;"><input><p>hello</p><button>Remove!</button></div><div style="margin-bottom: 25px;"><input><p>hi</p><button>Remove!</button></div></div><button>Add a row!</button><button>Print store!</button></div></div>`);
    //TODO: figure out way to programmatically click stuff and verify
});