//to test stuff as I built it


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
                    {tag: "h1", 
                    children: [
                        {
                            tag: "TEXT_ELEMENT",
                            nodeValue: "Hello world"
                        }
                    ],
                    attributes: {style: "color: green"}    
                    },
                    {tag: "button",
                    children: [
                        {
                            tag: "TEXT_ELEMENT",
                            nodeValue: "Hello world"
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
                            nodeValue: "This is a web framework from scratch"
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
                            nodeValue: "Hello world"
                        }  
                    ],
                    events: {"click": this.clicked}}], 
            }
        }
        
    }
}



const app = new App();
document.body.appendChild(app.node);

