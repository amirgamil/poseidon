//take in a vDOM node and return the DOM representation after figuring out what's changed
//i.e. the diffing algorithm
/*TODO: 
1. Add support for event listeners
2. 
*/


function updateAttributes(nextV, oldV, node) {
    //remove attributes
    if (oldV && oldV.attributes) {
        Object.keys(oldV.attributes)
            .forEach((key, _) => {
                node.removeAttribute(key);
            })
    }
    //add attributes
    if (nextV.attributes !== undefined) {
        Object.keys(nextV.attributes)
          .forEach((key, _) => {
            node[key] = nextV.attributes[key];
        })
    }
    return node;
}

//prints vDOM tree to compare with DOM
//tabs is used as helper to print the DOM in a readable format
const printDOMTree = (node, tabs = "") => {
   if (node.children === undefined) {
       return tabs + node[0].tag
   } else {
       prettyPrint = ""
       node.children.forEach(node => {
           prettyPrint += tabs + node.tag + "\n" + printDOMTree(node.children, tabs + "\t") + "\n";
       })
       return prettyPrint;
    }
}

const isEvent = key => key.startsWith("on");
//simple diffing works, 
//newVNode is new vDOM node to be rendered, prevVNode is old, prevDOM is previous node in the DOM
const renderVDOM = (newVNode, prevVNode, prevDOM) => {
    const sameType = prevVNode && newVNode && newVNode.tag === prevVNode.tag;
    var domNode;
    if (sameType) {
        domNode = updateAttributes(newVNode, prevVNode, prevDOM);
    } else {
        domNode = newVNode.tag !== "TEXT_ELEMENT" ? document.createElement(newVNode.tag) : document.createTextNode(newVNode.nodeValue);
        if (prevDOM) {
            //remove child node and replace with newly created one
            //console.log(prevDOM);
            prevDOM.replaceWith(domNode);
        }
        domNode = updateAttributes(newVNode, prevVNode,domNode);
    }
    if (newVNode.events !== undefined) {
        if (prevDOM) {
            //remove old event listeners 
            Object.keys(prevDOM)
                .filter(isEvent)
                .forEach(key => {
                    domNode.removeEventListener(key, prevDOM[key])
                });
        }
        //add new event listeners
        Object.keys(newVNode.events)
              .forEach(key => {
                  domNode.addEventListener(key, newVNode.events[key]);
              });
    }
    
    //render children
    if (newVNode.children !== undefined) {
        hasChildren = prevVNode && prevVNode.children;
        newVNode.children.forEach((newChild, i) => {
            if (hasChildren && i < prevVNode.children.length) {
                domNode.appendChild(renderVDOM(newChild, prevVNode.children[i], prevDOM.childNodes[i]));
            } else {
                domNode.appendChild(renderVDOM(newChild, null, null));
            }
        });
        if (hasChildren && newVNode.tag !== "TEXT_ELEMENT") {
            //remove all extra children from prevVNode
            for (i = newVNode.children.length - 1; i < prevVNode.children.length; i++) {
                console.log(prevVNode.children[i]);
                prevDOM.removeChild(prevDOM.children[i]);
            }
        }
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
        const newVdom = this.create(data); 
        console.log(printDOMTree(newVdom));
        this.node = renderVDOM(newVdom, this.jdom, this.node);
        this.jdom = newVdom;
        return this.node;
    }
}



//atom is smallest unit of data, similar to record in Torus
class Atom {

}


class List {

}




