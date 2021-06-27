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
        this.bind(this.store);
    }
    addRow(evt) {
        this.store.add(new FormData({first: "new!"}));
        console.log(this.store);
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
    
    debug() {
        console.log(this.node);
    }

    create() {
        return html`<div>
            <h1>Hello world</h1>
            ${this.form.node}
        </div>`
    }
}


const app = new App();
document.body.appendChild(app.node);