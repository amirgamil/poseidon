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
        this.isCool = true;
        this.list = ["Cat", "Dog", "Parrot", "Turtle"]
    }
    
    debug() {
        console.log(this.node);
    }

    clicked(evt) {
        console.log(evt.target.value);
    }

    styles() {
        return css`
            div {
                background-color: yellow;
                margin: 0;
                padding-bottom: 10px;
            }
        `
    }

    create() {
        return vdom`
                <div className = "test" id ="oi">
                    ${this.isCool ? vdom`<p>Cheeky nesting</p>` : null}
                    <img src="../docs/gcd.png" />
                    <br/>
                    <input oninput = ${(evt) => this.clicked(evt)} value = ${this.isCool} placeholder = "cheeky" />
                    <p> This looks and feels like <strong>HTML and JSX</strong></p>
                    <button onclick=${(evt) => this.clicked(evt)}>${this.isCool}</button>
                    <a href = "https://google.com">Link</a>
                    <div>
                        <ul>
                            ${this.list.map((element, _) => {
                                return vdom`<li> ${element} </li>`
                            })}
                        </ul>
                        <table>
                            <tr>
                                <th>Firstname</th>
                                <th>Lastname</th>
                                <th>Age</th>
                            </tr>
                            <tr>
                                <td>Jill</td>
                                <td>Smith</td>
                                <td>50</td>
                            </tr>
                            <tr>
                                <td>Eve</td>
                                <td>Jackson</td>
                                <td>94</td>
                            </tr>
                        </table>
                    </div>
                </div>`
        
            // {
            // tag: "div",
            // attributes: {style: "color: green; "} ,
            // children: [
            //     {tag: "h1", 
            //     children: [
            //         {
            //             tag: "TEXT_ELEMENT",
            //             nodeValue: "Hello world"
            //         }
            //     ]
            //     },
            //     this.form.node]
            // }
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

const app = new App();
document.body.appendChild(app.node);




