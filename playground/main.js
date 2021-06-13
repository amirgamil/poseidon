//TODO: add nested components as a test

class FormData extends Atom {

}

class Form extends Component {
    init() {
        this.handleFirstInput = evt => this.handleInput("first", evt);
        this.handleLastInput = evt => this.handleInput("last", evt);
        this.handleInput = this.handleInput.bind(this);
        this.data = new FormData({first: "Hello", last: ""});
        this.bind(this.data);
    }

    handleInput(key, evt) {
        this.data.update({[key]: evt.target.value});
    }

    create({first, last}) {
         return {tag: "div",
                 children: [
                    {tag: "p",
                    children: [
                       {tag: "TEXT_ELEMENT",
                        nodeValue: "First name"}
                    ]},
                   {tag: "input", 
                    attributes: {value: first},
                    events: {"input": this.handleFirstInput}
                   },
                   {tag: "p",
                    children: [
                       {tag: "TEXT_ELEMENT",
                        nodeValue: first}
                    ]},
                   {tag: "p",
                    children: [
                        {tag: "TEXT_ELEMENT",
                         nodeValue: "Last name" 
                        }
                    ]
                   },
                   {tag: "input",
                    attributes: {value: last, style: "margin-bottom: 10px"},
                    events: {"input": this.handleLastInput}}
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
            children: [
                {tag: "h1", 
                children: [
                    {
                        tag: "TEXT_ELEMENT",
                        nodeValue: "Hello world"
                    }
                ],
                attributes: {style: "color: green; "}    
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