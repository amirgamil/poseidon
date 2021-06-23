
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
        this.router = new Router();
        this.route = "";
        this.router.on({
            route: ["/home", "/about", "test"], 
            handler: (route) => {
                this.route = route;
                this.render();
            }}, 
            {
            route: "/:user",
            handler: (route, params) => {
                this.route = "user";
                this.params = params;
            }}
        )
    }

    
    debug() {
        console.log(this.node);
    }

    clicked(evt) {
        console.log(evt.target.value);
    }

    create() {
        console.log(window.location.href);
        return html`<div>
            <p>Whoah</p>
            ${() => {
            switch (this.route) {
                case "/home":
                    return html`<div><h1 style="text-underline-position: center">Home</h1><a href="/about">about</a></div>`
                case "/about":
                    return html`<div><h1>About</h1><a href="/test">test</a></div>`
                case "/test":
                    return html`<div><h1>Test</h1><a href = "/home">home</a></div>`
                case "user":
                    return html`<h1>${this.params.user}</h1>`
                default:
                    return html`<button onclick=${(evt) => this.router.navigate("/home")}>Go home</button>`
                }
            }}
        </div>`
    }
}

const app = new App();
document.body.appendChild(app.node);




