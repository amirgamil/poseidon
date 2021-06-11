/*TODO: 
1. Add support for event listeners
2. 
*/

//remove attributes



function updateAttributes(nextV, node) {
    if (nextV.attributes !== undefined) {
         Object.keys(nextV.attributes)
           .forEach((key, _) => {
             node[key] = nextV.attributes[key];
         })
     }
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
 
 
 function updateDOMProperties(node, prevVNode, nextVNode) {
     //add/remove attributes, event listeners 
     //remove attributes
     if (prevVNode && prevVNode.attributes) {
         Object.keys(prevVNode.attributes)
             .forEach((key, _) => {
                 node.removeAttribute(key);
             });
     }
 
     //remove old event listeners 
     if (prevVNode && prevVNode.events) {
         Object.keys(prevVNode)
                 .filter(isEvent)
                 .forEach(key => {
                     node.removeEventListener(key, prevVNode[key])
                 });
     }        
 
     //add attributes
     if (nextVNode.attributes) {
         Object.keys(nextVNode.attributes)
             .forEach((key, _) => {
                 node[key] = nextVNode.attributes[key];
             })
     }
 
     //add event listeners
     if (nextVNode.events) {
         Object.keys(nextVNode.events)
             .forEach((key, _) => {
                node.addEventListener(key, nextVNode.events[key]);
             })
     }
 }
 
 
 const isEvent = key => key.startsWith("on");
 const isDOM = node => node.nodeType !== Node.TEXT_NODE;
 //instantiate a virtual DOM node to an actual DOM node
 const instantiate = (vNode) => {
     const domNode = vNode.tag !== "TEXT_ELEMENT" ? document.createElement(vNode.tag) : document.createTextNode(vNode.nodeValue);
     updateDOMProperties(domNode, null, vNode);
     //create children
     const childrenV = vNode.children || [];
     const childrenDOM = childrenV.map(instantiate);
     childrenDOM.forEach(child => {
         domNode.appendChild(child);
     });
     return domNode;
}


//Tags
const APPEND = 1;
const DELETE = 2;
const REPLACE= 3;

// function performUnitOfWork(unitOfWork) {
//     //do stuff

//     return unit ;
// }

// function workLoop(nextUnitOfWork) {
//     while (nextUnitOfWork) {
//         nextUnitOfWork = performUnitOfWork(nextUnitOfWork);
//     }
// }

//queue to manage all updates to the DOM
//List of {op: <OP> }
const updateQueue = [];

//used to update DOM operations from the queue
const performWork = () => {
    while (updateQueue.length > 0) {
        //removes and returns item at index 0
        //TODO: is there a more optimized way of doing this
        const item = updateQueue.shift();
        switch (item.op) {
            case APPEND:
                parent = item.details.parent;
                child = item.details.node;
                updateDOMProperties(child, null, item.details.node);
                if (parent) {
                    parent.appendChild(child);
                }
                break;
            case REPLACE:
                dom = item.details.dom
                prev = item.details.previous;
                next = instantiate(item.details.node);
                //update properties
                updateDOMProperties(dom, prev, next);
                dom.replaceWith(next);
                break;
            case DELETE:
                parent = item.details.parent;
                toRemove = item.details.node;
                parent.removeChild(toRemove);
                break;
        }
    }
}

 
 //main render method for reconciliation
 //newVNode: is new vDOM node to be rendered, 
 //prevVNode: is old node that was previously rendered
 //nodeDOM: is the corresponding node in the DOM
 const renderVDOM = (newVNode, prevVNode, nodeDOM) => {
     const sameType = prevVNode && newVNode && newVNode.tag === prevVNode.tag;
     //same node, only update properties
     var node = null;
     if (sameType) {
         updateDOMProperties(nodeDOM, prevVNode, newVNode)
 
         //render children
         if (newVNode.children) {
             const count = Math.max(newVNode.children.length, prevVNode.children.length);
             const domChildren = nodeDOM ? nodeDOM.childNodes : [];
             for (let i = 0; i < count; i++) {
                 newChild = newVNode.children[i];
                 prev = prevVNode.children[i]; 
                 domChild = domChildren[i]; 
                 child = renderVDOM(newChild, prev, domChild);
                 //onlly append node if it's new
                 if (child && !prev) {
                    updateQueue.push({op: APPEND, details: {parent: nodeDOM, node: child}});  
                 }
             }
         }
         node = nodeDOM;
     } else if (!newVNode) {
         //node is no longer present so remove previous present virtual node
        //  nodeDOM.parentNode.removeChild(nodeDOM); 
         updateQueue.push({op: DELETE, details: {parent: nodeDOM.parentNode, node: nodeDOM}});
     } else if (!prevVNode) {
        //  create new node
         node = instantiate(newVNode);
         if (nodeDOM) {
            //return child, parent will handle the add to the queue
            return node;
         }
        updateQueue.push({op: APPEND, details: {parent: null, node: node}}); 
     } else {
         //node has changed, so replace
         updateQueue.push({op: REPLACE, details: {dom: nodeDOM, previous: prevVNode, node: newVNode}});
     }

     //Done diffing so we can now render the updates
     performWork();
     return node;
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
 };
 
 
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
         this.node = renderVDOM(newVdom, this.jdom, this.node);
         console.log("final ", this.node);
         this.jdom = newVdom;
         return this.node;
     }
 }
 
 
 
 //atom is smallest unit of data, similar to record in Torus
 class Atom {
 
 }
 
 
 class List {
 
 }
 
module.exports = {
    Component
}