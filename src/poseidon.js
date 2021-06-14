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
    //if this is a text node, update the text value
    if (prevVNode.tag == "TEXT_ELEMENT" && nextVNode.tag == "TEXT_ELEMENT") {
        node.nodeValue = nextVNode.nodeValue;
    }
    //add/remove attributes, event listeners 
    //remove attributes
    Object.keys(prevVNode.attributes || [])
                .forEach((key, _) => {
                    node.removeAttribute(key);
        });

    //remove old event listeners 
    Object.keys(prevVNode || [])
                .filter(isEvent)
                .forEach(key => {
                    node.removeEventListener(key, prevVNode[key])
        });       

    //add attributes
    Object.keys(nextVNode.attributes || [])
            .forEach((key, _) => {
                node[key] = nextVNode.attributes[key];
        });

    //add event listeners
    Object.keys(nextVNode.events || [])
            .forEach((key, _) => {
            node.addEventListener(key, nextVNode.events[key]);
        });
}
 
 
const isEvent = key => key.startsWith("on");
const isDOM = node => node.nodeType !== Node.TEXT_NODE;
//instantiate a virtual DOM node to an actual DOM node
const instantiate = (vNode) => {
    if (!vNode.tag) {
        //if no tag, then this is already a rendered DOM node, from potentially nesting so return
        return vNode;
    } else {
        const domNode = vNode.tag !== "TEXT_ELEMENT" ? document.createElement(vNode.tag) : document.createTextNode(vNode.nodeValue);
        updateDOMProperties(domNode, normalize(null), vNode);
        //create children
        const childrenV = vNode.children || [];
        const childrenDOM = childrenV.map(instantiate);
        childrenDOM.forEach(child => {
            domNode.appendChild(child);
        });
        return domNode;
    }
}


//Tags
const APPEND = 1;
const DELETE = 2;
const REPLACE= 3;
const UPDATE = 4;

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
//List of {op: <OP>, details: {}}
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
                updateDOMProperties(child, normalize(null), item.details.node);
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
            case UPDATE:
                dom = item.details.dom;
                prev = item.details.prev;
                newNode = item.details.new;
                updateDOMProperties(dom, prev, newNode);
        }
    }
}

//used to normalize vDOM nodes to prevent consantly checking if nodes are undefined before accessing properties
const normalize = (vNode) => {
    if (!vNode) {
        return {tag: "", children: [], events: {}, attributes: {}};
    } 
    return vNode;
}
 
//main render method for reconciliation
//newVNode: is new vDOM node to be rendered, 
//prevVNode: is old node that was previously rendered
//nodeDOM: is the corresponding node in the DOM
const renderVDOM = (newVNode, prevVNode, nodeDOM) => {
    const sameType = prevVNode && newVNode && newVNode.tag === prevVNode.tag;
    prevVNode = normalize(prevVNode);
    newVNode = normalize(newVNode);
    var node = normalize(null);
    //same node, only update properties
    if (sameType) {
        updateQueue.push({op: UPDATE, details: {dom: nodeDOM, prev: prevVNode, new: newVNode}});  
        //render children
        if (newVNode.children) {
            const count = Math.max(newVNode.children.length, prevVNode.children.length);
            const domChildren = nodeDOM ? nodeDOM.childNodes : [];
            for (let i = 0; i < count; i++) {
                newChild = newVNode.children[i];
                prev = prevVNode.children[i]; 
                domChild = domChildren[i]; 
                child = renderVDOM(newChild, prev, domChild);
                //only append node if it's new
                if (child && !prev) {
                    updateQueue.push({op: APPEND, details: {parent: nodeDOM, node: child}});  
                }
            }
        }
        node = nodeDOM;
    } else if (newVNode.tag == "") {
        //node is no longer present so remove previous present virtual node
        updateQueue.push({op: DELETE, details: {parent: nodeDOM.parentNode, node: nodeDOM}});
    } else if (prevVNode.tag == "") {
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
        //vdom from create
        this.vdom = null;
        if (this.init !== undefined) {
            this.init(...args);
        }
        //actual DOM node
        //`this.data` is a reserved property for passing into create to reduce side-effects and allow components to create UI without
        //having to rely on getting the data from elsewhere (can define in it in init of a user-defined component)
        if (this.node === undefined) {
            this.render(this.data);
        }
    }
    
    //bind allows us to bind data to listen to and trigger an action when data changes. Similar to useState in React which 
    //triggers a re-render when data changes
    bind(source, handler) {
        //if no handler passed in, we assume the callback is just a re-render of the UI because of a change in state
        //handler passed in should be a JS callback that takes data and does something (data = new updated data)
        if (handler === undefined) {
            source.addHandler((data) => this.render(data));
        } else {
            source.addHandler(handler);
        }
    }

    remove() {
        //take down any things necessary from the DOM
    }

    //create allows us to compose our unit of component
    //should be deterministic and have no side-effects (i.e. should be rendered declaratively)
    create(data) {
        //eventually will need to do manipulation to convert template string into this format, but start simple for now
        return null;
    }

    //converts internal representation of vDOM to DOM node 
    //used to render a component again if something changes - ONLY if necessary
    render(data) {
        //not sure what to do with render yet
        const newVdom = this.create(data); 
        this.node = renderVDOM(newVdom, this.jdom, this.node);
        this.jdom = newVdom;
        return this.node;
    }
}
//Listening class is used to connect handlers
//to data/models for evented data stores (like in Torus)
class Listening {
    constructor() {
        this.handlers = new Set();
    }
    //represent the current state of the data
    //used to determine when a change has happened and execute the corresponding handler
    state; 
    //return summary of state
    summarize;
    //used to listen to and execute handlers on listening to events
    fire() {
        this.handlers.forEach(handler => {
            //call handler with new state
            handler(this.state);
        })
    }

    addHandler(handler) {
       this.handlers.add(handler);
       handler(this.state);
    }

    removeHandler(handler) {
        this.handlers.delete(handler);
    }
}
 
 
 //atom is smallest unit of data, similar to record in Torus
class Atom extends Listening {
    constructor(object) {
        super();
        super.state = object;
    }

    summarize() {
        return this.state;
    }

    //default comparator should be overrided for custom functionality in atom class
    get comparator() {
        return null;
    }

    //all children of atoms should include a method that returns their type (base implementation provided for general Atom)
    //but should be specific to implementing atom class
    get type() {
        return Atom;
    }
    

    //called to update the state of an atom of data
    //takes in an object of keys to values
    set update(object) {
        for (const prop in object){
            this.state[prop] = object[prop];
        }
        //change has been made to data so call handler
        this.fire();

    }

    //used to return a property defined in an atom
    get(key) {
        return this.state[key];
    }

    //convert data to JSON (potentially for persistent store, etc.)
    serialize() {
        return JSON.stringify(this.state); 
    }
 
}
 
//Lists are backed by collection data stores (middle man between database and the UI) to map collections to the UI
class List extends Component {
    init(item, store, remove) {
        this.store = store;
        this.remove = remove;
        //domElement is the unit of component that will render each individual element of a list 
        this.domElement = item;
        const array = [...store.data];
        console.log(store.data);
        this.nodes = array.map(element => {
            console.log(element.state.state);
            const component = new this.domElement(element.state);
            return component.node;
        });
        console.log(this.nodes);
    }

    //fix constructor with args
    constructor(item, store, remove) {
        //call super method
        super(item, store, remove);
        this._atomClass = store.atomClass;
    }
    
    get type() {
        return this._atomClass;
    }

    create(data) {
        return null;
    }

    summarize() {
        return
    }

}

function ListOf(itemOf) {
    return class extends List {
        constructor(...args) {
            console.log(args);
            super(itemOf,...args);
        }
    }; 
}

//middle man between database and the UI. Used to store collections and interface with the UI
//similar to Store in Torus and Collections in Backbone
class CollectionStore extends Listening {
    constructor(data, atomClass) {
        //TODO: fix super call
        super();
        this._atomClass = atomClass;
        this.setStore(data); 
    }

    //will typically have a fetch and save method to cache data locally from the database to load the UI and save upon rewrites
    //setStore provides a flexible way to intialize a store with data (either via the constructor or e.g. an internal fetch method)
    setStore(data) {
        //4 possible configurations for initalizing a store with data
        //1. Pass in objects with Atom
        //2. Pass in intialized atoms as an array with no type (inferred)
        //3. 1 but via CollectionStoreOf
        //4. 2 but via CollectionStoreOf
        if (data !== undefined && data !== null && data.length > 0) {
            //assume all data is the same type if no atom class is provided (meaning we can infer it directly, since just list of atoms) 
            if (this._atomClass === undefined) {
                this.data = new Set(data);
                //TODO: is there a better way of doing this?
                this._atomClass = data[0].type;
            } else {
                if (data[0] instanceof Atom) {
                    this.data = new Set(data);
                } else {
                    this.data = new Set(data.map(el => new this._atomClass(el)));
                }
            }       
        } else {
            this.data = new Set();
        } 
    }

    summarize() {
        return JSON.stringify(this.data);
    }

    add(newData) {
        this.data.add(newData);
        if (this._atomClass === undefined) {
            this._atomClass = newData.type;
        }
    }

    remove(oldData) {
        this.data.delete(oldData);
    }

    //return JSON serialized data sorted by comparator
    serialize() {
        //creates array with spread syntax, then sorts
        //TODO: is there a more efficient way of doing this
        const sorted = [...this.data];
        sorted.sort((a , b) => {
            return a.comparator - b.comparator;
        });
        return JSON.stringify(sorted);
    }

    get atomClass() {
        return this._atomClass;
    }

    //define customer iterator interface so we can loop over stores directly
    //take advantage of the iterator values() returns since data is a Javascript set 
    [Symbol.iterator]() {
        return this.data.values();
    }
}

//Higher order component pattern like in Torus
function CollectionStoreOf(classOf) {
    return class extends CollectionStore {
        constructor(data) {
            super(data, classOf);
        }
    };
}


class Router {
    //match-based router (i.e. builds a routing table)
    //connects patterns to callable objects (components or DOM elements to be rendered)
}

module.exports = {
    Component,
    List,
    Atom,
    ListOf,
    CollectionStore,
    CollectionStoreOf,
    Router
}