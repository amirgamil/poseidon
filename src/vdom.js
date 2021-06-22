//jsx like parser written in Javascript for Poseidon's vdom

//TODO:
//Interpolate all template literals with string values and store them in a map
//Then build node out, when a string is encountered, go retrieve that value as the tree is being constructed
//makes the algorithm more efficient since only one traversal is done


//Reader class to abstract lexing and scanning of a vdom template string
class Reader {
    constructor(string) {
        this.string = string;
        this.index = 0;
        this.length = string.length;
        //set of special characters to return when getNextWord is called
        this.specialCharacters = new Set([' ', '=', '<', '>']);
    }

    peek() {
        if (this.index < this.length - 1) {
            return this.string[this.index + 1];
        }
        return null;
    }

    //gets the next word, keeps moving forward until until it encounters one of the special tags or a closing '/>'
    getNextWord() {
        var currIndex = this.index;
        var finalIndex = currIndex;
        var quoteCount = 0;
        while (!this.specialCharacters.has(this.currentChar)) {
            //if we have quotes, skip them
            //TODO: add more robust type checking we have the same type of quote
            if (this.currentChar === '"' || this.currentChar === "'") {
                //adjust starting point of returned work if we encounter an opening quote
                if (quoteCount === 0) { 
                    quoteCount++;
                    currIndex = this.index + 1;
                } else if (quoteCount === 1) {
                    finalIndex = this.index - 1;
                    quoteCount++;
                }  
            } else if (this.currentChar === '/') {
                //handle special case where next word might be adjacent to a /> tag so return the word before
                //this tag
                //otherwise, since this is
                if (this.peek() === '>') break
            } else {
                finalIndex = this.index;
            } 
            this.consume();
        }
        if (quoteCount == 1) throw 'Error parsing quotes as values!';

        //skip any spaces for future
        this.skipSpaces();
        return this.string.substring(currIndex, finalIndex + 1);
    }

    get currentChar() {
        return this.string[this.index];
    }

    //skip all white spaces and new line characters
    skipSpaces() {
        while (this.currentChar === " " || this.currentChar === '\n') {
            this.consume();
        }
    }

    consume() {
        return this.string[this.index++];
    }

    //combination of consume and skipping white space since this pattern crops up frequently
    skipToNextChar() {
        this.consume();
        this.skipSpaces();
    }

    //helper method to keep moving pointer until the current char is the provided one
    getUntilChar(char) {
        const currIndex = this.index;
        var finalIndex = currIndex;
        while (this.currentChar != char && this.index < this.length) {
            this.consume();
            finalIndex = this.index;
        }
        return this.string.substring(currIndex, finalIndex);
    }

    //keep moving pointer forward until AFTER we encounter a char (i.e pointer now points to character after matching provided)
    skipPastChar(char) {
        var text = this.getUntilChar(char);
        text += this.consume();
        this.skipSpaces();
        return text;
    }
}


//recursively loop checking children
const parseChildren = (closingTag, reader, values) => {
    try {
        let children = [];
        //check in the scenario where we have an empty HTML node with no children
        if (foundClosingTag(closingTag, reader)) {
            return children;
        }
        reader.skipSpaces();
        var nextChild = parseTag(reader, values);
        while (nextChild !== CLOSED_TAG) {
            //only append child if it's not null or undefined
            if (nextChild) {
                //check if this is the result of returning an array (e.g. if a map operation is called), in which case, we set children 
                //to the result otherwise introducing nesting which will cause issues when trying to render
                if (Array.isArray(nextChild)) children = nextChild
                else children.push(nextChild);
            }
            if (foundClosingTag(closingTag, reader)) break;
            nextChild = parseTag(reader, values);
        }
        return children;
    } catch (e) {
        throw e;
    }
}


//helper method to check if we've encountered the closing tag of a node
//return true if we have and false if we have not encountered the closing tag
const foundClosingTag = (closingTag, reader) => {
    if (reader.currentChar === '<' && reader.peek() === '/') {
        //if we encounter closing tag i.e. '</' then end parsing of this tag
        reader.skipPastChar('/');
        const nextTag = reader.getNextWord();
        reader.skipPastChar('>');
        if (nextTag !== closingTag) throw 'Error parsing the body of an HTML node!'
        return true;
    }
    return false
}

//method which parses JS expressions in our template literal vdom string
//takes a reader, list of values from the template string, and an optional attribute variable that indicates whether this expression
//should return a node (i.e. call parseTag) or return a value associated with some key (e.g an attribute)
const parseJSExpr = (reader, values, attribute) => {
    //return the Javascript expression
    //What's a cleaner way of doing this
    var val = values.shift();
    //if the value returns null we don't want to render anything
    if (val) {
        //if this is a JSX expression associated with some key, return the value obtained directly instead of parsing it as a HTML node
        if (attribute) {
            reader.skipSpaces();
            //if the val either a function or an object which was generated
            //by a nested vdom template literal, we return it directly
            //otherwise, we cast any other non-string primitives if the returned value is not already a string to prevent unnecessary computations
            if (typeof val === 'function' || typeof val === 'object') return val;
            else if (typeof val !== 'string') val = String(val);
            return val;
        }
        //Not DRY, but the alternative is some hard to understand gymnastics
        if (typeof val === 'object' || typeof val === 'function') {
            reader.skipSpaces();
            //if an anonymous function is passed in as a body execute it
            if (typeof val === 'function') {
                return val();
            } else {
                return val;
            }
        } else if (typeof val !== 'string') val = String(val); 

        //notice this set-up nicely allows for nested vdom expressions (e.g. we can return another vdom template literal based on some
        //Javascript expression within another vdom)
        const readerNewExpression = new Reader(val);
        return parseTag(readerNewExpression, values); 
    } else {
        return null;
    }
}


//parse a complete HTML node tag 
const parseTag = (reader, values) => {
    //if the current char is not a < tag, then either we've finished parsing valid tags or this is a text node
    if (reader.currentChar !== '<') {
        const word = reader.getUntilChar('<');
        //we've reached the end of parsing
        if (!word) return null;
        //otherwise, we've found a text node!
        return {tag: "TEXT_ELEMENT", nodeValue: word};
    } else if (reader.peek() === '/') {
        //just encountered a '</' indicating a closing tag so return the constant to let the caller method know 
        //note we return this constant (instead of null) to differentiate from null nodes which may not necessarily be the last nodes 
        //left to parse
        return CLOSED_TAG;
    }  
    //skip < tag
    reader.consume();
    const name = reader.getNextWord();
    //check if this is a placeholder for a JS expression
    if (name === VDOM_PLACEHOLDER) {
        //skip < tag
        reader.consume();
        return parseJSExpr(reader, values, false);
    }        
    const node = {
        tag: name,
        children: [], 
        attributes: {},
        events: {}
    }
    //boolean variable to handle special self-closing HTML nodes like <img />
    var specialChar = false;
    //Match key-value pairs in initial node definition (i.e. from first < to first > tag, recall closing node tag is </)
    while (reader.currentChar !== '>') {
        const key = reader.getNextWord();
        //handle special self-closing tags like <br/> and <img />
        if (key === '/' && reader.peek() === '>') {
            reader.consume();
            specialChar = true;
            break;
        }
        //key on its own is still valid, so check if we need to map to a specific value
        if (reader.currentChar !== '=') {
            node.attributes[key] = null;
            continue;
        }
        //skip equal sign
        reader.skipToNextChar();
        //get value associated with this key, TODO: not sure about this bit, what if mapping to a non-template literal like a variable
        let value = reader.getNextWord();
        //getNextWord stops at some special characters, one of which is < which is the start of the VDOM_JSX_Node
        //so check if this is a placeholder before parsing the JS expression to get the value associated with this key
        if (value === '<') {
            //skip < tag and check if this is a valid placeholder
            reader.consume();
            if (reader.getNextWord() === VDOM_PLACEHOLDER) value = parseJSExpr(reader, values, true);
            else throw "Error trying to parse the key-value pairs of a node, unexpected < found!"
            //skip closing tag
            reader.consume();
        }
        //if the key starts with an on, this is an event, so we should save it accordingly
        if (key.startsWith("on")) {
            //note keys of events in JS don't include on, so we ignore this part of the string when assigning it
            node.events[key.substring(2)] = value;
        } else {
            //otherwise, this is an attribute so add it there
            node.attributes[key] = value;
        }
    }
    //skip closing > 
    reader.skipToNextChar();
    //match actual body of the node
    if (!specialChar) node.children = parseChildren(name, reader, values);
    reader.skipSpaces();
    //return JSON-formatted vdom node
    return node;
}

//Regular expression to match all expressions (or JS codes) inside a dom template string
//This lazily matches (lazily meaning as few as possible) any '${}' characters within a template string
const VDOM_EXPRESSIONS = new RegExp('\${.*?}', 'g');
//use the current Date or time to ensure we have a unique placeholder in our template strings which will replace
//all Javascript expressions (i.e. ${}) that need to be executed which we refer to during the parsing phase
const VDOM_PLACEHOLDER = `__vdomPlaceholder${Date.now()}`;
//we wrap the placeholder in opening and closing tags to avoid checking extra edge cases in our parser which would introduce
//extra, unneccessary computations
const VDOM_JSX_NODE = "<" + VDOM_PLACEHOLDER + ">"
//constant used when parsing children nodes to check whether we've finished parsing all child nodes and have found the closing parent
const CLOSED_TAG = "</";

//take advantage of Javascript template literals which gives us a string and a list of interpolated values
const html = (templates, ...values) => {
    //create string and interpolate all of the ${} expressions with our constructed placeholder node 
    const vdomString = templates.join(VDOM_JSX_NODE, values);
    //HTML parsing
    const reader = new Reader(vdomString);
    try {
        reader.skipSpaces();
        const node = parseTag(reader, values);
        return node;
    } catch (e) {
        console.error(e);
    }
}


//expose reader initially for debugging and testing purposes
//named exposedV so different from poseidon since for now have two script tags for the playground
const exposedV = {
    html,
    parseTag,
    Reader
}
module.exports = exposedV;