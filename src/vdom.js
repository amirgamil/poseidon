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
                    break;
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
        while (this.currentChar != char) {
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
const parseChildren = (closingTag, reader) => {
    try {
        let children = [];
        //check in the scenario where we have an empty HTML node with no children
        if (foundClosingTag(closingTag, reader)) {
            return children;
        }
        reader.skipSpaces();
        var nextChild = parseTag(reader);

        while (nextChild) {
            children.push(nextChild);
            if (foundClosingTag(closingTag, reader)) break;
            nextChild = parseTag(reader);
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
        const closingTag = reader.getNextWord();
        reader.skipPastChar('>');
        if (closingTag !== closingTag) throw 'Error parsing the body of an HTML node!'
        return true;
    }
    return false
}


//parse a complete HTML node tag from opening <> to closing </>
//TODO: handle special cases like </br> and img
const parseTag = (reader) => {
    //if the current char is not a < tag, then either we've finished parsing valid tags or this is a text node
    if (reader.currentChar !== '<') {
        const word = reader.getUntilChar('<');
        if (!word) return null;
        //otherwise, we've found a text node!
        return {tag: "TEXT_ELEMENT", nodeValue: word};
    } else if (reader.peek() === '/') {
        //just encountered a '</' indicating a closing tag so return
        return null;
    }  
    //skip < tag
    reader.consume();
    const name = reader.getNextWord();
    const node = {
        tag: name,
        children: [], 
        attributes: {},
        events: {}
    }
    //boolean variable to handle special children and not parse the children
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
        const value = reader.getNextWord();
        //if the key starts with an on, this is an event, so we should save it accordingly
        if (key.startsWith("on")) {
            node.events[key] = value;
        } else {
            //otherwise, this is an attribute so add it there
            node.attributes[key] = value;
        }
    }
    //skip closing > 
    //note we don't skip any white-spaces here to perserve integraity when DOM rendering as the vdom was actual html
    //more info here- TODO:???
    reader.skipToNextChar();
    //match actual body of the node
    if (!specialChar) node.children = parseChildren(name, reader);
    reader.skipSpaces();
    //return JSON-formatted vdom node
    return node;
}


//take advantage of Javascript template literals which gives us a string and a list of interpolated values
const vdom = (templates, ...values) => {
    //first pass over templates to create JSON AST
    //HTML parsing
    const reader = new Reader(templates[0]);
    //Switch on different tokens
    //recursively parse children
    try {
        for (;;) {
            reader.skipSpaces();
            switch (reader.currentChar) {
                case '<':
                    //opening tag, do stuff
                    return parseTag(reader);

                    //loop and map keys to values
                    //then recurse on children
                case '>':
                    //closing tag, do other stuff
                case '{':
                    //other stuff
                case '}':
                    //other other stuff
                    
            }
        }
    } catch (e) {
        console.error(e);
    }

    //populate this
    let tag;
    let children = [];
    let events = [];
    let attributes = {};
}


//expose reader initially for debugging and testing purposes
//named exposedV so different from poseidon since for now have two script tags for the playground
const exposedV = {
    vdom,
    parseTag,
    Reader
}
module.exports = exposedV;