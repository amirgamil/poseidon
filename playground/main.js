class FormData extends Atom {
    get type() {
        return FormData;
    }
}

class FormItem extends Component {
    init() {
        //do stuff
    }
    create() {
        return {tag: "div",
        children: [
           {tag: "p",
           children: [ 
              {tag: "TEXT_ELEMENT",
               nodeValue: "First name"}
           ]},
          {tag: "input", 
           attributes: {value: "hello"},
           events: {"input": this.handleFirstInput}
          },
          {tag: "p",
           attributes: {value: "reflect the changes"}}
        ]}; 
    }
}

class FormList extends ListOf(FormItem) {
    create() {
        return {tag: "div",
                children : [
                    this.nodes
                ]};
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
        // this.bind(this.data);
    }

    create() {
         return {tag: "div",
                 children: [
                    {tag: "h2",
                    children: [
                       {tag: "TEXT_ELEMENT",
                        nodeValue: "Store"}
                    ]}
                 ]}
    }

}

class App extends Component {
    init() {
        this.clicked = this.clicked.bind(this);
        this.form = new Form();
    }

    clicked(evt) {
        this.hidden = !this.hidden;
        this.render();
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
                this.form.node,
                {tag: "button",
                children: [
                    {
                        tag: "TEXT_ELEMENT",
                        nodeValue: "Click again!"
                    }  
                ],
                events: {"click": this.clicked}}], 
        } 
    }
}


const app = new App();
document.body.appendChild(app.node);