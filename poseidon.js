//take in a vDOM node and return the DOM representation after figuring out what's changed
//i.e. the diffing algorithm
/*TODO: 
1. Add support for event listeners
2. 
*/

function createTextElement(text) {
    return {
        tag: 'TEXT_ELEMENT',
        children: {
            nodeValue: text
        }
    }
}


//right now does not handle diffing/updates
const renderVDOM = (node) => {
    const domNode = typeof node === "object" ? document.createElement(node.tag) : document.createTextNode(node);
    if (node.attributes !== undefined) {
        Object.keys(node.attributes)
          .forEach((key, _) => {
            domNode[key] = node.attributes[key];
        })
    }

    if (node.events !== undefined) {
        Object.keys(node.events)
              .forEach(key => {
                  domNode.addEventListener(key, node.events[key]);
                  console.log(node.events[key])
              })
    }

    if (node.children !== undefined) {
        node.children.forEach(element => {
            domNode.appendChild(renderVDOM(element));
        });
    }
    return domNode;
}



//This is the internal representation of a vDOM node in Poseidon that we will then render onto the DOM
//note we don't use the type and props approach of react because we're going to be creating our virtual DOM representation
const node = {
    //tag i.e. h1, p etc.
    tag: '',
    children: [],
    //any events it's listening to e.g. onclick, onmousedown etc, maps keys of events to listen to to responses
    events: {},
    //map of attributes to values (e.g. {class: "...", id: "../"})
    attributes: {}
}


//unit of UI
class Component {
    constructor(...args) {
        //initialize stuff
        //vdom from compose
        this.vdom = null;
        this.init(...args)
        //actual DOM node
        if (this.node === undefined) {
            this.render();
        }
    }

    //create acts as the call to createElement
    create(data) {
        //eventually will need to do manipulation to convert template string into this format, but start simple for now
        return null;
    }

    //converts internal representation of vDOM to DOM node 
    //acts as the render version of React
    render(data) {
        //not sure what to do with render yet
        this.node = renderVDOM(this.create(data));
        return this.node;
    }
}



//atom is smallest unit of data, similar to record in Torus
class Atom {

}


class List {

}




