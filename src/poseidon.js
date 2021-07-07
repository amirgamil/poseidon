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
        //set the data attribute in our DOM node instead of nodeValue for speed and for better error detection
        //(that we should not be setting this value for HTML tags that don't implement the CharacterData interface)
        node.data = nextVNode.nodeValue;
    }
    //add/remove attributes, event listeners 
    //remove attributes
    Object.keys(prevVNode.attributes || [])
                .forEach((key, _) => {
                    node.removeAttribute(key);
        });

    //remove old event listeners 
    Object.keys(prevVNode.events || [])
            .forEach((key, _) => {
                //remove event listener and set the value of the associated key to null
                node.removeEventListener(key, prevVNode.events[key]);
        });       


    //add attributes
    var attributes = nextVNode.attributes || []
    //helper method that sets an attribute 
    const setAttributeHelper = (key, val) => {
        //check if an ISL attribute was already mutated from DOM manipulation, in which case don't set it
        //otherwise may produce unintended DOM side-effects (e.g. changing the value of selectionStart)
        if (key && node[key] === val) {
            return;
        }
        //otherwise modify the attribute if it already exists and set element otherwise
        if (key in node) {
            node[key] = val;
        } else {
            // node[key] = val;
            node.setAttribute(key, val);
        }
    }
    //note if nextVNode is a fully rendered DOM node, .attributes will return a named node map
    //or we have a fully fledged DOM node where .attributes returns a NamedNodeMap
    //check this is a vdom node before applying attributes
    if (!(attributes.length) || attributes.length === 0) {
        //this means nextVNode is a vdom node
        Object.keys(attributes)
                .forEach((key, ) => {
                setAttributeHelper(key, nextVNode.attributes[key]); 
            });
    }
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
        //if no tag, then this is already a rendered DOM node,
        if (vNode.node) {
            return vNode.node
        } 
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

//queue to manage all updates to the DOM
//List of {op: <OP>, details: {}}
const updateQueue = [];

//used to update DOM operations from the queue
const performWork = () => {
    var node = null;
    for (let i = 0; i < updateQueue.length; i++) {
        //removes and returns item at index 0
        const item = updateQueue[i];
        switch (item.op) {
            case APPEND:
                parent = item.details.parent;
                child = item.details.node;
                if (parent) {
                    parent.appendChild(child);
                }
                break;
            case REPLACE:
                dom = item.details.dom
                prev = item.details.previous;
                //note calling instaniate also set DOM properties
                next = instantiate(item.details.node);
                dom.replaceWith(next);
                node = next;
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
                break;
        }
    }
    //reset `updateQueue` now that we've dequeued everything (this will empty the queue)
    updateQueue.length = 0;
    return node;
}

//used to normalize vDOM nodes to prevent consantly checking if nodes are undefined before accessing properties
const normalize = (vNode) => {
    if (!vNode) {
        return {tag: "", children: [], events: {}, attributes: {}};
    } 
    if (!(vNode.children)) {
        vNode.children = [];
    }
    if (!(vNode.events)) {
        vNode.events = {};
    }

    if (!(vNode.attributes)) {
        vNode.attributes = {};
    }
    return vNode;
}
 
//main render method for reconciliation
//newVNode: is new vDOM node to be rendered, 
//prevVNode: is old vDOM node that was previously rendered
//nodeDOM: is the corresponding node in the DOM
const renderVDOM = (newVNode, prevVNode, nodeDOM) => {
    //if have an empty node, return 
    if(!newVNode && !prevVNode) {
        return ;
    }
    const sameType = prevVNode && newVNode && newVNode.tag === prevVNode.tag;
    prevVNode = normalize(prevVNode);
    newVNode = normalize(newVNode);
    var node = normalize(null);
    //same node, only update properties
    if (sameType) {
        //means we have an element loaded in a list node since list nodes hand over fully rendered DOM nodes
        if (newVNode.tag === undefined) {
            updateQueue.push({op: REPLACE, details: {dom: nodeDOM, previous: prevVNode, node: newVNode}});
            node = newVNode;
        } else {
            updateQueue.push({op: UPDATE, details: {dom: nodeDOM, prev: prevVNode, new: newVNode}});  
            //render children
            if (newVNode.children) {
                const count = Math.max(newVNode.children.length, prevVNode.children.length);
                const domChildren = nodeDOM ? nodeDOM.childNodes : [];
                for (let i = 0; i < count; i++) {
                    newChild = newVNode.children[i];
                    prev = prevVNode.children[i]; 
                    //note there are two cases to consider here, either we have a child in our DOM tree (that is domChildren[i] is NOT
                    //undefined) or we don't. If we won't have a DOM child, there are two subcases a) newVNode doesn't exist
                    //or b) prevVnode doesn't exist.
                    domChild = domChildren[i] || true; 
                    child = renderVDOM(newChild, prev, domChild);
                    //only append node if it's new
                    if (child && !prev) {
                        updateQueue.push({op: APPEND, details: {parent: nodeDOM, node: child}});  
                    }
                }
            }
            node = nodeDOM;
        }
    } else if (newVNode.tag == "") {
        //node is no longer present so remove previous present virtual node
        //note if the DOM node is true (line 179), then that node has already been handled i.e. removed or added in a previous iteration
        if (nodeDOM !== true) {
            updateQueue.push({op: DELETE, details: {parent: nodeDOM.parentNode, node: nodeDOM}});
            //Note we want to to return here (i.e. not perform any work yet) to avoid removing DOM nodes before 
            //we have processed all of the children (to avoid indexing issues at line 168 causing us to skip nodes). This means we defer the 
            //`performWork` operation to be called by the parent. Note there is no scenario where we would encounter
            //an empty newVNode that reaches this block without being called by a parent.
            return node;
        } 
    
    } else if (prevVNode.tag == "") {
        //we have a new node that is currently not on in the DOM
        node = instantiate(newVNode);
        if (nodeDOM) {
            //return child, parent will handle the add to the queue
            return node;
        }
        //otherwise adding a node to a currently empty DOM tree
        updateQueue.push({op: APPEND, details: {parent: null, node: node}}); 
    } else {
        //node has changed, so replace
        //note we use a similar heuristic to the React diffing algorithm here - since the nodes are different
        //we rebuild the entire tree at this node
        updateQueue.push({op: REPLACE, details: {dom: nodeDOM, previous: prevVNode, node: newVNode}});
    }

    //Done diffing so we can now render the updates
    const res = performWork();
    //one edge cases that arises is when we attempt to replace the entire DOM tree (i.e. on first iteration) - we push to the queue 
    //but never assign node which we initialize to `normalize(null)`. This would result in incorrectly updating the DOM to null so we check
    //for this case here
    if (res && node.tag === "") node = res;
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
 

//pointer to global stylesheet to be used in subsequent reloads
let globalStyleSheet;
//maps components to class-names, used to check if styles for a component have already been delcared
//e.g. when initializing different elements of a list
const CSS_CACHE = new Map();
//global rule index to insert CSS rules sequentially
var ruleIndex = 0;
//helper method user to convert the JSON object the `css` template literal returns into
//a set of styles - this function is recursive and resolves nested JSON CSS objects 
//the logic may seem confusing but we need to wrap a list of nested JSON CSS objects
//and array of CSS rules into a flat structure that resolves the selectors
//To do this, we distinguish between the rules for a given nested selector and nested objects.
//We add rules for a given selector at the end once we've guaranteed there are no more 
//nested JSON objects to parse
const parseCSSJSON = (JSONCSS, containerHash, styleRules, specialTag = false) => {
    const {tag, rules} = JSONCSS;
    //represents the overall text of our CSS
    var text = "";
    var cssTag;
    //boolean variable to mark whether we need to handle the text differently when appending to the
    //stylesheet
    var specialTag = specialTag;
    //if this is a special tag that contains @keyframes or media, we need to remove
    //the inner references to the container component nesting
    if (tag.includes("@keyframes") || tag.includes("@media")) {
        specialTag = true;
        cssTag = tag;
        text += tag + "{\n\n"
    } else {
        //replace references to the container component which was unknown as time of generating 
        //the CSS set of JSON rules
        cssTag = tag.replace("<container>", containerHash);
    }
    var textForCurrentSelector = "";
    //represents the set of rules for the current selector at this level of our tree  
    //only add rules at the current level, if this is not a special tag
    textForCurrentSelector = cssTag + " { \n";
    if (!specialTag) {
    }
    rules.forEach((item, _) => {
        //check if this is a rule or a nested CSS JSON object
        if (item.key) {
            const {key, value} = item;
            textForCurrentSelector += "\t" + key + ":" + value + ";\n";
        } else {
            //then this is a nested JSON tag so we need to recurse
            text += parseCSSJSON(item, containerHash, styleRules, specialTag);
            
        }
    });
    if (specialTag && !text) {
        return textForCurrentSelector + "}";
    }
    //if text is not empty, we are adding a special rule like @media or @keyframes
    if (text) {
        styleRules.push(text + "}");
    } else {
        //add the rules for the current level now that we've finished parsing all of the nested rules
        styleRules.push(textForCurrentSelector + "}");
    }
    return "";
}

const initStyleSheet = (userJSONStyles, name, rules) => {
    const containerHash = CSS_CACHE.get(name);
    //create style tag
    const cssNode = document.createElement('style');
    cssNode.type = 'text/css';
    //identify poseidon set of css rules with a unique data attribute
    cssNode.setAttribute("data-poseidon", "true");
    document.head.appendChild(cssNode);
    globalStyleSheet = cssNode.sheet;
    //add . before class for the css stylesheet
    parseCSSJSON(userJSONStyles, "." + containerHash, rules);
}
const generateUniqueHash = (string) => {
    var hashedString = string;
    // Math.random should be unique because of its seeding algorithm.
    // Convert it to base 36 (numbers + letters), and grab the first 9 characters
    // after the decimal.
    hashedString += Math.random().toString(36).substr(2, 9);
    return hashedString;
}

const injectStyles = (rules) => {
    //add the rules to our stylesheet
    for (const rule of rules) {
        globalStyleSheet.insertRule(rule);
    }
}

//unit of UI
class Component {
    constructor(...args) {
        //initialize stuff
        //vdom from create
        this.vdom = null;
        if (this.init !== undefined) {
            this.init(...args);
        }
        //store object of {source, handler} to remove when taking down a component
        //note, intentionally only store one source and handler for encapsulation
        this.event = {};
        //`this.data` is a reserved property for passing into create to reduce side-effects and allow components to create UI without
        //having to rely on getting the data from elsewhere (can define in it in `init` method of a user-defined component)
        //call render if a component has not already been initialized with a fully-fledged, ready DOM node 
        //(e.g. individual elements in a List)
        if (this.node === undefined) {
            this.render(this.data);
        }
    }
    
    //bind allows us to bind data to listen to and trigger an action when data changes. Similar to useState in React which 
    //triggers a re-render when data changes
    bind(source, handler) {
        if (source instanceof Listening) {
            //if no handler passed in, we assume the callback is just a re-render of the UI because of a change in state
            //handler passed in should be a JS callback that takes data and does something (data = new updated data)
            if (handler === undefined) {
                const defaultHandler = (data) => this.render(data);
                source.addHandler(defaultHandler)
                this.events = {source, defaultHandler};
            } else {
                source.addHandler(handler);
                this.events = {source, handler};
            }
        } else {
            throw 'Attempting to bind to an unknown object!';
        }
    }

    //method for adding inline css styling to components via css template literal, should be added in relevant component
    //by returning a css template literal
    // styles() {
    //     return null;
    // }

    //helper method for adding component-defined styles 
    addStyle(vdom) {
        //call only proceeds if we have custom-defined styles for efficiency
        //obleviates the need for having a separate Styled component - any component
        //that does not implement styles() will not call any of this method's logic
        //and any component can use the styles() API to apply CSS styles on its elements
        if (!this.styles) return ;

        //check if we have a class attribute, otherwise, create one
        if (!vdom.attributes["class"]) {
            vdom.attributes["class"] = "";
        }
        //in order to make sure the styles only get applied to elements in the current component 
        //generate a unique class name - note we don't use a unique ID since we may want to use the same styles
        //for dfferent instances of the same component e.g. different elements of a list
        //first check if the class is not in our CSS_CACHE
        if (!CSS_CACHE.has(this.constructor.name)) {
            const uniqueID = generateUniqueHash(this.constructor.name); 
            vdom.attributes["class"] += " " + uniqueID;
            CSS_CACHE.set(this.constructor.name, uniqueID);
        } else {
            vdom.attributes["class"] += " " + CSS_CACHE.get(this.constructor.name);
        }
        
        console.log(userJSONStyles);
        //if we don't already have a reference to the globalStyleSheet, we need to create it and populate it with our
        //css rules
        if (!globalStyleSheet) {
            this.regenerateStyleSheet();
        } 
        //note by design we don't check if state has changed and re-generate/re-inject all of the styles
        //Poseidon's API
    }

    //generates a new stylesheet and injects all of the styles into the page. This operation is expensive
    //and should be called infrequently - only if state required to load css changes. As with Poseidon's API
    //any state should be bound to this method to automatically trigger a re-injection when the styles change
    regenerateStyleSheet() {
        const rules = [];
        const name = this.constructor.name;
        //get the JSON object of CSS rules
        const userJSONStyles = this.styles();
        initStyleSheet(userJSONStyles, name, rules);
        injectStyles(rules);
    }

    //performs any cleanup before a component is removed such as invalidating timers, canceling network requests or cleaning any
    //bindings that were made in the init
    remove() {
        //remove handlers of any atomic data defined here
        const {source, handler} = this.events;
        source.remove();
        //reset `this.events` 
        this.events = {};
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
        //create virtual DOM node
        const newVdom = this.create(data); 
        //TODO: fix this, can't use insertRule if element is not already in the DOM
        //apply any user-defined styles if applicable (do this before we render in case any user-generated styles
        //need to add any properties to the outer vDOM node e.g. a unique id)
        this.addStyle(newVdom);
        //call the reconciliation algorithm to render/diff the changes and render the new DOM tree which we save
        this.node = renderVDOM(newVdom, this.vdom, this.node);
        //return an empty comment if no valid DOM node is returned
        if (!this.node) this.node = document.createComment('');
        this.vdom = newVdom;
        return this.node;
    }
}
//Listening class is used to connect handlers
//to data/models for evented data stores (like in Torus)
class Listening {
    constructor() {
        this.handlers = new Set();
        //represent the current state of the data
        //used to determine when a change has happened and execute the corresponding handler
        this.state = null;
    }
    //return summary of state
    summarize() {
        return null;
    }

    //used to listen to and execute handlers on listening to events
    fire() {
        this.handlers.forEach(handler => {
            //call handler with new state
            //since we pass in the state, this means we have access directly to an atom's data (aka state) in the handler
            //(including a call to render)
            handler(this.state);
        })
    }

    //called when an atom is taken down to remove all subscribed event handlers
    remove() {
        this.handlers.forEach(handler => {
            //remove handler 
            this.removeHandler(handler)
        })
    }
    //add a new handler
    addHandler(handler) {
       this.handlers.add(handler);
       handler(this.state);
    }
    //remove a handler
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
    update(object) {
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
    //fix constructor with args
    constructor(item, store, remove) {
        //call super method
        super(item, store, remove);
        this._atomClass = store.atomClass;
    }
     
    init(item, store, remove) {
        if (!(store instanceof CollectionStore)) throw 'Error unknown data store provided, please use a CollectionStore!'
        this.store = store;
        //check if no remove callback is passed in, in which case we default to using the native `remove` method
        //provided by the store
        if (remove) {
            this.remove = remove;
        } else {
            this.remove = (data) => store.remove(data);
        }
        //domElement is the unit of component that will render each individual element of a list 
        this.domElement = item;
        //backed by Javascript Map since maintains order and implements iterable interface, allowing easy manipulation when looping
        //this items maps atoms as keys to DOM nodes as values. This prevents us having to re-render all DOM list elements, and only
        //re-render the elements that have changed or the ones that need to be added
        this.items = new Map();
        this.nodes = [];
        //will initialize map on first call of itemsChanged() -> binding calls handler the first time
        this.bind(store, () => this.itemsChanged());
    }

    itemsChanged() {
        //loop over store and add new elements
        this.store.data.forEach((element) => {
            if (!this.items.has(element)) {
                //pass in the atom to the new initialized component as well as the callback to remove an item from a store
                //so that each component can remove its own atomic data
                //recall that initializing a new element will call render the first time, meaning 
                //we will be able to access the DOM node of this new element below
                const domNode = new this.domElement(element, this.remove);
                //note we pass the DOM nodes of the rendered component so that each defined component (i.e. domElement above) has 
                //a reference to the actual DOM node being displayed on the web page. If we passed in a vDOM node, then 
                //our rendering logic would instantiate a new DOM node and add it to the page but the component 
                //(elemnt of a list) would not have a reference to this DOM node locally and would not be able update 
                //changes (on the web page) reflected to its state (and a goal of Poseidon is that we have self-managing components 
                //so should be able to display changes to changes in atomic data directly within our own component)
                this.items.set(element, domNode.node);
            } 
        })
        //loop over map and remove old elements
        for (let [key, value] of this.items) {
            if (!this.store.has(key)) {
                this.items.delete(key);
            } 
        }
        this.nodes = Array.from(this.items.values()); 
        this.render(this.nodes);
    }

    get type() {
        return this._atomClass;
    }

    create(data) {
       //default implementation is to return a <ul> of all of the individal nodes, should be overrided if custom rendering
       //needs to be specified
       return html`<ul>
           ${this.nodes}
       </ul>` 
    }

}

function ListOf(itemOf) {
    return class extends List {
        constructor(...args) {
            super(itemOf,...args);
        }
    }; 
}

//middle man between database and the UI. Used to store collections and interface with the UI
//similar to Store in Torus and Collections in Backbone
class CollectionStore extends Listening {
    constructor(data, atomClass) {
        super();
        this._atomClass = atomClass;
        this.setStore(data); 
    }

    //will typically have a fetch and save method to cache data locally from the database to load the UI and save upon rewrites
    //setStore provides a flexible way to intialize a store with data (either via the constructor or e.g. an internal fetch method)
    setStore(data) {
        //4 possible configurations for initalizing a store with data
        //1. Pass in objects with Atom
        //2. Pass in intialized atoms as an array with no type (we're responsible for inferring)
        //3. 1 but via CollectionStoreOf
        //4. 2 but via CollectionStoreOf
        if (data !== undefined && data !== null && data.length > 0) {
            //assume all data is the same type if no atom class is provided (meaning we can infer it directly, since just list of atoms) 
            if (this._atomClass === undefined) {
                this.data = new Set(data);
                //use the first element from the provided list as a heuristic for the type of atomic data of the data source
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
        if (newData instanceof Atom) {
            this.data.add(newData);
            if (this._atomClass === undefined) {
                this._atomClass = newData.type;
            }
        } else {
            if (!this.__atomClass) throw "Error, adding a non-atom object without a defined atom class!"
            this.data.add(new thiss.__atomClass(newData));
        } 
        //trigger any event handlers that are subscribed to the store for an update
        this.fire();
    }

    has(value) {
        return this.data.has(value);
    }

    remove(oldData) {
        //remove atom from the store
        this.data.delete(oldData);
        //call atom's remove to remove all subscribed event handlers
        oldData.remove();
        //trigger any event handlers that are subscribed to the store for an update e.g. a re-render if the store was bound
        //to a component
        this.fire();

    }

    //return JSON serialized data sorted by comparator
    serialize() {
        //creates array with spread syntax, then sorts
        //not cross-compatible with some older versions of browsers like IE11
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

//Higher order component pattern like in Torus for defining a CollectionStore of a specific record
function CollectionStoreOf(classOf) {
    return class extends CollectionStore {
        constructor(data) {
            super(data, classOf);
        }
    };
}

//helper method to convert passed in paths into executable regex values to match against incoming routes
const getRegexFromRouteString = (route) => {
    let match;
    let paramNames = []
    //construct a new regex match by replacing paramnames as defined in the route e.g. /:user
    //with corresponding regex bits to match any possible values
    route = route.replace(/[:*](\w+)/g, (full, paramName, _) => {
        paramNames.push(paramName);
        //replace any paramname with a regex to match any value (since any value can be passed in as a parameter e.g. any user!)
        //matches any character that is not a /
        return '([^\/]+)'
    });
    //may be the end of the route or may there may be more stuff, so add a regex to capture this
    route += '(?:\/|$)'
    return [new RegExp(route), paramNames];
}


//NOTE: this is a client-side router. This means that when the URL changes, it looks at the client-side
//Javascript code to determine what to render. This means that if you're using any kind of web server
//and serving the static content from there, either you must allow ALL routes or the routes you'd like to 
//define on the client-side on the web server. If you don't do this, nothing will be served once you navigate to a route 
//even if you've specified what to render through Poseidon.
class Router {
    //client-side router, match-based router (i.e. builds a routing table)
    //constructor takes an object which maps names of routes to their corresponding path
    //when passing routes, make sure to pass more general routes later since Poseidon will match them
    //in that order
    constructor() {
        this.routes = new Map();        
        this.options = {
            context: window,
            startListening: true
        }
        this.matchHelper = () => {
            return this.match(window.location.pathname);
        }
        //used to detect when URL changes and execute a handler accordingly
        window.addEventListener('popstate', this.matchHelper); 
    }

    //route-matching algorithm
    //listener method for when the URL or hash changes to map to the new appropriate view
    match(route) {
        //match route against dictionary of defined paths to their relevant attributes
        for (let [path, {pathRoute, handler, params}] of this.routes) {
            const match = pathRoute.exec(route);
            //each route will be associated with a handler
            //this handler will handle all of the rendering associated with a new change
            if (match !== null) {
                //remove the first / from the route
                //loop through values and add each value with its associated parameter
                const routeParams = match.slice(1).
                                    reduce((allParams, value, index) => {
                                            allParams[params[index]] = value;
                                            return allParams;
                                            }, {});
                //split parameters using the ?varName=varVal 
                this.currentPath = path;
                handler(route, routeParams);
            }

        }
    }

    //navigate method provided for convenience in events like button actions
    navigate(path, {replace = false} = {}) {
        if (window.location.pathname != path) {
            if (replace) {
                this.options.context.history.replaceState(null, document.title, path);
            } else {
                //add entry to browser's session history stack (will set the location's hash)
                this.options.context.history.pushState(null, document.title, path);
            }
            this.match(path);
        }
    }

    //used to map paths to handler functions which will get executed when navigated to
    on(...pageRoutes) {
        for (const {route, handler} of pageRoutes) {
            if (Array.isArray(route)) {
                for (const path of route) {
                    const [regPath, params] = getRegexFromRouteString(path);
                    this.routes.set(path, {pathRoute: regPath, handler: handler, params: params});
                }
            } else {
                const [regPath, params] = getRegexFromRouteString(route);
                this.routes.set(route, {pathRoute: regPath, handler: handler, params: params})
            }
        }
        //route the current url
        this.match(window.location.pathname);
    } 

}

const exposed = {
    renderVDOM,
    Component,
    List,
    Atom,
    ListOf,
    CollectionStore,
    CollectionStoreOf,
    Router
}

if (typeof window === 'object') {
    Object.assign(window, exposed)
} else {
    module.exports = exposed;
}
