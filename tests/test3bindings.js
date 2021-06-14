class FormData extends Atom {

}

class Form extends Component {
    init() {
        this.handleFirstInput = evt => this.handleInput("first", evt);
        this.handleLastInput = evt => this.handleInput("last", evt);
        this.handleInput = this.handleInput.bind(this);
        this.form = new FormData({first: "", last: ""});
        this.bind(this.form);
    }

    handleInput(key, evt) {
        this.form.update({[key]: evt.target.value});
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
                    attributes: {value: this.form.state.first},
                    events: {"input": this.handleFirstInput}
                   },
                   {tag: "p",
                    children: [
                       {tag: "TEXT_ELEMENT",
                        nodeValue: this.form.state.first}
                    ]},
                   {tag: "p",
                    children: [
                        {tag: "TEXT_ELEMENT",
                         nodeValue: "Last name" 
                        }
                    ]
                   },
                   {tag: "input",
                    attributes: {value: this.form.state.last, style: "margin-bottom: 10px"},
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
document.body.appendChild(app.node)

//TODO: add tests to enforce above is working
//TODO: test binding stores and ensure UI re-renders