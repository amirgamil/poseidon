//jsx like parser written in Javascript for Poseidon's vdom

//Reader class to abstract lexing and scanning of a vdom template string
class Reader {
    constructor(string, specialCharacters) {
        //need to replace all backslashes with double backslash to make sure it's correctly rendered
        this.string = string;
        this.index = 0;
        this.length = string.length;
        //set of special characters to return when getNextWord is called
        this.specialCharacters = new Set(specialCharacters);
    }

    peek() {
        if (this.index < this.length - 1) {
            return this.string[this.index + 1];
        }
        return null;
    }

    //gets the next word, keeps moving forward until until it encounters one of the special tags or a closing '/>'
    //takes a positional parameter that by default will only return values inside of quotes as opposed to
    //the entire string with quotes. Can pass true to get the entire string with quotes to override this
    //behavior
    getNextWord(includeQuotes = false) {
        var currIndex = this.index;
        var finalIndex = currIndex;
        var quoteCount = 0;
        //keep looping while we don't encounter a special character of if we're inside a quote
        while ((this.index < this.length) && (!this.specialCharacters.has(this.currentChar) || (!includeQuotes && quoteCount === 1))) {
            //if we have quotes, skip them
            //TODO: add more robust type checking we have the same type of quote
            if (!includeQuotes && (this.currentChar === '"' || this.currentChar === "'")) {
                //adjust starting point of returned work if we encounter an opening quote
                if (quoteCount === 0) { 
                    quoteCount += 1;
                    currIndex = this.index + 1;
                } else if (quoteCount === 1) {
                    finalIndex = this.index - 1;
                    quoteCount += 1;
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
        if (quoteCount == 1) { 
            throw 'Error parsing quotes as values!';
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
        while (this.currentChar != char && this.index < this.length) {
            this.consume();
            finalIndex = this.index;
        }
        return this.string.substring(currIndex, finalIndex);
    }
    //adapted helper method of above to keep moving pounter until the current word is the provided one
    getUntilWord(word) {
        var found = false;
        //edge case where no spaces betwen '<--' and '-->
        if (this.currentChar === '>') {
            found = true;
        }
        while (!found && this.index < this.length) {
            this.getUntilChar(word[0]);
            //note getUntilChar does not consume the character we pass in, so we start comparing each character of the word
            //at index 0
            for (let i = 1; i < word.length; i++) {
                this.consume();
                if (this.currentChar === word[i]) {
                    found = true;
                } else {
                    //exit for loop and go back to the while loop
                    found = false;
                    break
                }
            }
        }
        this.skipToNextChar();
    }

    //keep moving pointer forward until AFTER we encounter a char (i.e pointer now points to character after matching provided)
    skipPastChar(char) {
        var text = this.getUntilChar(char);
        text += this.consume();
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
        } else if (typeof val !== 'string') {
            val = String(val)
        } 
        //To prevent executing any HTML from Javascript variables which would expose
        //a risk of cross-site scripting (XSS) attacks, if there's any HTML content, we don't parse it into HTML nodes
        //but return it as text instead.
        //Note we only need to check if a string starts with < because if the string starts with any other text
        //then `parseTag` will assume it's a text token and consume characters until it finds an opening < until which it stops
        //This means a string like `test<script>alert("hello")</script>` would not cause any issues because the recursive call
        //would stop as soon as it hits the opening < of the script tag, effectively ignoring any other HTML, and thus malicious content
        if (val.startsWith("<")) {
            console.log('Warning, attempting to inject HTML into the page, will return text instead.');
            return val;
        }
        //notice this set-up nicely allows for nested vdom expressions (e.g. we can return another vdom template literal based on some
        //Javascript expression within another vdom)
        const readerNewExpression = new Reader(val, reader.specialCharacters);
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
    //check if this is a placeholder for a JS expression or if this is a comment node
    if (name === VDOM_PLACEHOLDER) {
        //skip < tag
        reader.consume();
        return parseJSExpr(reader, values, false);
    } else if (name.startsWith("!--")) {
        //note we don't check for '<!--' because we consume it on line 202
        //skip until '-->' tag
        reader.getUntilWord('-->');
        return parseTag(reader, values);
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
    //TODO: fix infinite loop if missing closing tag, need to test
    while (reader.currentChar !== '>' && reader.index < reader.length) {
        const key = reader.getNextWord();
        //handle special self-closing tags like <br/> and <img />
        if (key === '/' && reader.peek() === '>') {
            reader.consume();
            specialChar = true;
            break;
        } 
        //key on its own is still valid, so check if we need to map to a specific value
        if (reader.currentChar !== '=') {
            node.attributes[key] = true;
            continue;
        }
        //skip equal sign
        reader.skipToNextChar();
        //get value associated with this key 
        let value = reader.getNextWord();
        //getNextWord stops at some special characters, one of which is < which is the start of the VDOM_JSX_Node
        //so check if this is a placeholder before parsing the JS expression to get the value associated with this key
        if (value === '<') {
            //skip < tag and check if this is a valid placeholder
            reader.consume();
            if (reader.getNextWord() === VDOM_PLACEHOLDER) value = parseJSExpr(reader, values, true);
            else throw "Error trying to parse the key-value pairs of a node, unexpected < found!"
            //skip closing tag
            reader.skipToNextChar();
        } else {
            //replace any template literals inside the string value if they exist with their corresponding values
            while (value.includes(VDOM_JSX_NODE)) {
                value = value.replace(VDOM_JSX_NODE, parseJSExpr(reader, values, true) );
            }
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
    //skip closing > of node definition and any spaces/new lines
    reader.consume();
    //match actual body of the node if this is not a self-closing HTML tag like <img />
    if (!specialChar) node.children = parseChildren(name, reader, values);
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
const VDOM_JSX_NODE = '<' + VDOM_PLACEHOLDER + ">"
//constant used when parsing children nodes to check whether we've finished parsing all child nodes and have found the closing parent
const CLOSED_TAG = '</';
//a unique string that will be used to map outer-level css rules inside a component (that don't have a user-defined selector)
//when constructing the CSS JSON set of rules to the outer-level node in that component at render-time when adding the CSS rules
//to the page
const CSS_PLACEHOLDER = `__container${Date.now()}`;
//note we wrap the placeholder with a {}, since this is a special character which will let the reader stop at the correct position 
//and not overshoot 
const CSS_JSX_NODE = '{' + CSS_PLACEHOLDER + '}';


//check what to do with outer component for CSS

//take advantage of Javascript template literals which gives us a string and a list of interpolated values
const html = (templates, ...values) => {
    //create string and interpolate all of the ${} expressions with our constructed placeholder node 
    const vdomString = templates.join(VDOM_JSX_NODE, values);
    //HTML parsing
    const reader = new Reader(vdomString, [' ', '=', '<', '>']);
    try {
        reader.skipSpaces();
        const node = parseTag(reader, values);
        return node;
    } catch (e) {
        console.error(e);
        return null;
    }
}

//parses body of the CSS and returns a dictionary of type {tag: `string`, rules: []} with arbitrary nesting of other 
//css objects or {key: value} representing a CSS rule
const parseCSStringToDict = (reader, dict, selector, values) => {
    dict["tag"] = selector;
    dict["rules"] = [];
    while (reader.index < reader.length) {
        var word = reader.getNextWord();
        //to prevent an infinite loop and fail gracefully, check if the word is a special character
        //which we don't check later on
        if (word === ';') { 
            console.log(reader.string.substring(reader.index));
            throw 'Error, unexpected end of expression found!';    
        }
        //check if this is JS expression
        if (word === '{') {
            //consume the { token
            reader.consume();
            const placeholder = reader.getNextWord();
            //found a JS expression which is a function call, likely to be a call to another css template literal
            if (placeholder === CSS_PLACEHOLDER) {
                const res = values.shift();
                //if the value returned from a function call is null, ignore it
                if (res) {
                    //since this is a nested call to the css function, we need to "unwrap it" because a call from css
                    //wraps the outer JSON in an object corresponding to the current component we are in. 
                    //In this case we are already nesting styles in
                    //the component wrapper so we can get rid of it
                    res["rules"].forEach((objectStyles, _) => {
                        //need to append the current selector to any nested rules
                        //note we remove `<container> from the result of the nested css template function
                        //call to prevent duplicates in our selector
                        objectStyles["tag"] = selector + objectStyles["tag"].replace("<container>", "");
                        //add the styles
                        dict["rules"].push(objectStyles);    
                    });
                } 
                reader.skipToNextChar();
                continue
            } else {
                throw 'Invalid curly brace found in css template literal!'
            }
        } 

        //we don't directly use the reader's currentChar variable since there are some edge
        //cases where we need to do some lookahead operations and will need to adjust it on the fly
        //to execute the correct logic
        var char = reader.currentChar;

        //may be a key-value pair or a selector, need to lookahead
        if (reader.currentChar === ':') {
            reader.skipToNextChar();
            //some css selectors have `:` in them e.g :hover or ::before, so we need to check if this is a selector
            //or a key-value pair
            //first check if we have the complete word, or if this is a special :: selector case
            if (reader.currentChar === ':' ) {
                word += "::"; //directly add the ::s, first one at line 341 that we skipped, and the current one
                //consume the second :
                reader.consume(); 
                word += reader.getNextWord();
                reader.skipSpaces();
                //this must be a css selector and not a key-value pair so reset char  
                char = reader.currentChar
            }
            if (char !== '{') { 
                //make sure to get the result with quotes in case any values rely on it 
                //to correctly render CSS e.g. content
                var value = reader.getNextWord(true);
                //check if we have a JS expression as the value for a key
                if (value === '{') {
                    //skip the {
                    reader.consume();
                    const constant = reader.getNextWord();
                    if (constant !== CSS_PLACEHOLDER) throw 'Invalid JS expression while trying to parse the value of a key!';
                    value = values.shift();
                    //skip past the } of the 
                    reader.skipToNextChar();
                } 
                //check if this is a css selector with a specific colon like :before, in which case the reader would be 
                //pointing to a {
                if (reader.currentChar === '{') {
                    word += ":" + value;
                    char = reader.currentChar; //adjust char to a { so we correctly parse it as a selector at line 366
                } else if (reader.currentChar === ':') {
                   //this is a media rule or a css selector with two colons e.g. @media and (min-width: 800px) and (max-width: 800px)
                    reader.consume();
                    const next = reader.getNextWord();
                    //trim for consistency
                    word += ":" + value  + ":" + next.trimStart();
                    char = reader.currentChar;
                } else {
                    //otherwise, we've encountered a key-value pair
                    dict.rules.push({key: word, value: value});
                    //consume ; at the end of a rule and skip any spaces
                    reader.skipToNextChar();
                }
            }         
        } 
        //this is a selector with some associated css rules i.e. <name> {key1: rule1....}
        if (char === '{') {
            reader.skipToNextChar();
            //nested tag, recursive call here
            const nestedTagDict = {};
            dict.rules.push(nestedTagDict);
            //TODO: standarize spacing, necessary?
            var newSelector = selector + " " + word;
            //if the tag, or next selector is a keyframe or media, we don't want to append the previous selector
            //since these are special tags which should be handled differently
            if (word.includes("@keyframes") || word.includes("@media") || 
                dict["tag"].includes("@keyframes") || dict["tag"].includes("@media")) {
                newSelector = word;
            } 
            //note for the new selector, we append the current selector (i.e. child) to the parent
            //to capture all descedants of the parent that correspond to this specific child.
            //This prevents us from having to do this logic ad-hoc when we parse our dict into
            //our eventual stylesheet
            parseCSStringToDict(reader, nestedTagDict, newSelector, values);
            //skip closing } and any spaces
            reader.skipToNextChar();
        }
        //check if we've reached the end of a block-scoped {} of key-value pairs
        if (reader.currentChar === '}') {
            //note we don't consume the '}' since we delegate the responsibility to the caller to do that
            //allows us to more reliably manage our position / prevents inconsistencies with multiple nested tags on the same level 
            break;
        }
    }
    return dict;
}

const css = (templates, ...values) => {
    //create string and interpolate all of the ${} expressions with our constructed placeholder node 
    const cssString= templates.join(CSS_JSX_NODE, values);
    //remove any comments
    const cssCommentsRegex = new RegExp('(\\/\\*[\\s\\S]*?\\*\\/)', 'gi');
    const cssWithoutComments = cssString.replace(cssCommentsRegex, '');
    const reader = new Reader(cssWithoutComments, [';', '{', '}', ':']);
    try {
        reader.skipSpaces();
        const dict = {};
        parseCSStringToDict(reader, dict, "<container>", values);
        return dict;
    } catch (e) {
        console.error(e);
        return null;
    }
}

//expose reader initially for debugging and testing purposes
//named exposedV so different from poseidon since for now have two script tags for the playground
const exposedV = {
    html,
    parseTag,
    Reader,
    css
}
module.exports = exposedV;