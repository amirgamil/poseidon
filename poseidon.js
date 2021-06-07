//take in a vDOM node and return the DOM representation after figuring out what's changed
//i.e. the diffing algorithm
/*TODO: 
1. Add support for event listeners
2. 
*/


function updateAttributes(vNode, node) {
    if (vNode.attributes !== undefined) {
        Object.keys(vNode.attributes)
          .forEach((key, _) => {
            node[key] = vNode.attributes[key];
        })
    }
    return node;
}


//simple diffing works
const renderVDOM = (newVNode, prevVNode, prevDOM) => {
    const sameType = prevVNode && newVNode && newVNode.tag === prevVNode.tag;
    var domNode;
    if (sameType) {
        domNode = updateAttributes(newVNode, prevVNode);
    } else {
        domNode = newVNode.tag !== "TEXT_ELEMENT" ? document.createElement(newVNode.tag) : document.createTextNode(newVNode.nodeValue);
        if (prevDOM) {
            //remove child node and replace with newly created one
            prevDOM.replaceWith(domNode);
        }
        domNode = updateAttributes(newVNode, domNode);
    }
    if (newVNode.events !== undefined) {
        Object.keys(newVNode.events)
              .forEach(key => {
                  domNode.addEventListener(key, newVNode.events[key]);
              })
    }

    if (newVNode.children !== undefined) {
        newVNode.children.forEach(element => {
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

    //TODO: add listening to stuff i.e. how you bind data so that trigger a re-render when it changes
    //listen({})
    
    //create acts as the call to createElement
    create(data) {
        //eventually will need to do manipulation to convert template string into this format, but start simple for now
        return null;
    }

    //converts internal representation of vDOM to DOM node 
    //acts as the render version of React
    render(data) {
        //not sure what to do with render yet
        this.node = renderVDOM(this.create(data), this.jdom, this.node);
        return this.node;
    }
}



//atom is smallest unit of data, similar to record in Torus
class Atom {

}


class List {

}




