//to test stuff as I built it


class App extends Component {
    init() {
        this.clicked = this.clicked.bind(this);
    }


    clicked() {
        console.log("clicked!")
    }


    create() {
        return {
            tag: "div",
            children: [
                {tag: "h1", 
                children: ["Hello world!"]}, 
                {tag: "p1", 
                 children: ["This is a web framework from scratch"],
                 attributes: 
                    {style:
                       "font-style: italic; font-size: 20px"
                    }
                },
                {tag: "button",
                children: ["Click me!"],
                events: {"onclick": this.clicked}}],
            attributes: 
                {style:
                    "background-color: green"
                }
        }
    }
}



const app = new App();
document.body.appendChild(app.node);

