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
                    {tag : "div",
                     children: [
                        {tag: "p",
                         children: 
                            [
                                { tag: "TEXT_ELEMENT",
                                nodeValue: "look up"}
                            ]
                        }
                     ]
                    },
                    {tag: "h1", 
                    children: [
                        {
                            tag: "TEXT_ELEMENT",
                            nodeValue: "Hello world"
                        }
                    ],
                    attributes: {style: "color: green; "}    
                    },
                    {tag: "button",
                    children: [
                        {
                            tag: "TEXT_ELEMENT",
                            nodeValue: "Click again!"
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
                            nodeValue: "This is a web framework from scratch\n"
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
                            nodeValue: "Click to re-render!"
                        }  
                    ],
                    events: {"click": this.clicked}}], 
            }
        }
        
    }
}


const app = new App();
document.body.appendChild(app.node);