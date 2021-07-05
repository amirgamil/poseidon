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
        return html`<div>
            <input oninput=${this.handleFirstInput} />
            <p>${first}</p>
            <button onclick=${this.removeElement}>Remove</button>
        </div>`
    }
}

class FormList extends ListOf(FormItem) {
    create(nodes) {
        return html`<div>
            ${this.nodes}
        </div>`
    }
}

class FormDataStore extends CollectionStoreOf(FormData) {

}

class Form extends Component {
    init() {
        const test1 = new FormData({first: "hello"});
        const test2 = new FormData({first: "hi"});
        this.store = new FormDataStore([test1, test2]);
        this.list = new FormList(this.store);
        this.addRow = this.addRow.bind(this);
    }

    addRow(evt) {
        this.store.add(new FormData({first: "new!"}));
    }

    create() {
        return html`<div>
            <h2>Store</h2>
            ${this.list.node}
            <button onclick=${this.addRow}>Add a row</button>
        </div>`
    }
}

class App extends Component {
    init() {
        this.form = new Form();
    }

    styles() {
        const val = true;
        return css`
            h1 {
                background-color: green;
                font-size: 35px;
                animation: test infinite 1s;
            }

            button:hover {
                background-color: blue;
            }

            @keyframes test {
                0% {
                    background-color: green;
                }

                50% {
                    background-color: blue;
                }
            }

            @media only screen and (max-device-width: 600px) {
                body {
                    background-color: green;
                }
            }               
            /* this is a comment */
            ${val ? css`p {
                background-color: green;
            }` : null}
        `
    }

    create() {
        return html`<div>
            <h1>Hello world</h1>
            <button>Hover</button>
            <p> ️😀 </p>
            <a href = "/">To nowhere</a>
            ${this.form.node}
        </div>`
    }
}


const app = new App();
document.body.appendChild(app.node);