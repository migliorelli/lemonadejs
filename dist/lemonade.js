/**
 * LemonadeJS v5
 *
 * Website: https://lemonadejs.com
 * Description: Create amazing web based reusable components.
 *
 * This software is distributed under MIT License
 */

;(function (global, factory) {
    typeof exports === 'object' && typeof module !== 'undefined' ? module.exports = factory() :
    typeof define === 'function' && define.amd ? define(factory) :
    global.lemonade = factory();
}(this, (function () {

    'use strict';

    /**
     * Global control element
     */
    let R = {
        components: {},
        container: new Map,
    };

    // Global LemonadeJS controllers
    if (typeof(document) !== "undefined") {
        if (! document.lemonadejs) {
            document.lemonadejs = R;
        } else {
            R = document.lemonadejs;
        }
    }

    // Script expression inside LemonadeJS templates
    let isScript = /{{(.*?)}}/g;

    /**
     * Show a better error developers
     */
    const createError = function() {
        throw new Error('LemonadeJS ' + Array.from(arguments).join(' '));
    }

    /**
     * Extract all valid tokens from a string
     * @param {string} content
     * @returns {string[]}
     */
    function extractTokens(content) {
        // Input validation
        if (typeof content !== 'string') {
            throw new TypeError('Content must be a string');
        }
        // Single regex pattern to match both 'self.' and 'this.' prefixed identifiers Negative lookahead (?!\.\w) prevents matching nested properties
        //const pattern =  /(?:self|this)\.\w+\b(?!\.\w)/g;
        const pattern = /(?<=(?:this|self)\.)[a-zA-Z_]\w*/gm

        // If no matches found, return empty array early
        const matches = content.match(pattern);
        if (!matches) {
            return [];
        }
        // Create Set directly from matches array with map transform This is more efficient than adding items one by one
        return [...new Set(matches.map(match => match.slice(match.indexOf('.') + 1)))];
    }

    /**
     * Bind a property to one action and start tracking
     * @param {object} lemon
     * @param {string} prop
     */
    const trackProperty = function(lemon, prop) {
        // Lemon handler
        let s = lemon.self;
        if (typeof(s) === 'object') {
            // Change
            let change = lemon.change;
            // Events
            let events = lemon.events[prop];
            // Current value
            let value = s[prop];
            // Do not allow undefined
            if (typeof(value) === 'undefined') {
                value = '';
            }
            // Create the observer
            Object.defineProperty(s, prop, {
                set: function(v) {
                    // Old value
                    let oldValue = value;
                    // New value
                    value = v;
                    // Dispatch reactions
                    if (events) {
                        events.forEach((action) => {
                            action();
                        });
                    }
                    // Refresh bound elements
                    if (change && change.length) {
                        change.forEach((action) => {
                            if (typeof (action) === 'function') {
                                action.call(s, prop, oldValue, v);
                            }
                        })
                    }
                    // Native onchange
                    if (typeof(s.onchange) === 'function') {
                        s.onchange.call(s, prop, oldValue, v);
                    }
                },
                get: function () {
                    // Get value
                    return value;
                },
                configurable: true,
                enumerable: true,
            });
        }
    }

    /**
     * Check if an element is appended to the DOM or a shadowRoot
     * @param {HTMLElement} node
     * @return {boolean}
     */
    const isAppended = function(node) {
        while (node) {
            if (node === document.body) {
                return true; // Node is in main document
            }

            if (node.parentNode === null) {
                if (node.host) {
                    node = node.host; // Traverse up through ShadowRoot
                } else {
                    return false; // Detached node
                }
            } else {
                node = node.parentNode; // Traverse up through parentNode
            }
        }
        return false;
    }

    const elementNotReady = [];

    /**
     * Process the onload methods
     */
    const processOnload = function(lemon) {
        let root = lemon.tree.element;
        if (root.tagName === 'ROOT' && lemon.elements) {
            root = lemon.elements[0];
        }
        // Check if the element is appended to the DOM
        if (isAppended(root)) {
            let s = lemon.self;
            // Ready event
            while (lemon.ready.length) {
                lemon.ready.shift()();
            }
            // Native onload
            if (typeof(s.onload) === 'function') {
                s.onload.call(s, s.el);
            }
            // Current self
            if (typeof(lemon.load) === 'function') {
                lemon.load.call(s, s.el);
            }
            // Pending ones
            let totalOfItems = elementNotReady.length;
            if (totalOfItems) {
                // Clone array
                let items = [...elementNotReady];
                // Reset queue
                elementNotReady.length = 0;
                // Process all items
                for (let i = 0; i < totalOfItems; i++) {
                    processOnload(items[i]);
                }
            }
        } else {
            elementNotReady.unshift(lemon);
        }
    }

    /**
     * Return the element based on the type
     * @param item
     * @returns {*}
     */
    const getElement = function(item) {
        return typeof(item.type) === 'function' ? item.self : item.element;
    }

    const HTMLParser = function(html, values) {
        /**
         * Check if is a self-closing tag
         * @param {string|function} type - Tag name or component function
         * @returns {boolean}
         */
        function isSelfClosing(type) {
            if (! type) {
                return false;
            } else {
                // List of self-closing or void HTML elements
                const selfClosingTags = [
                    'area', 'base', 'br', 'col', 'embed', 'hr', 'img', 'input', 'link', 'meta', 'source', 'track', 'wbr'
                ];
                // Convert tagName to lowercase to ensure case-insensitive comparison
                return typeof(type) === 'function' || selfClosingTags.includes(type.toLowerCase());
            }
        }

        /**
         * Create a text node and add it to current node's children
         * @param {Object} tag - Text node properties
         */
        const createTextNode = function(tag) {
            if (! this.current.children) {
                this.current.children = [];
            }

            this.current.children.push({
                type: '#text',
                parent: this.current,
                props: [tag],
            });
        }

        /**
         * Find the parent node by tag name
         * @param {Object} node - Current node
         * @param {string} type - Tag name to find
         * @returns {Object|undefined}
         */
        const findParentByTagName = function(node, type) {
            if (node && type) {
                if (node.type === type) {
                    return node;
                } else {
                    return findParentByTagName(node.parent, type);
                }
            }

            return undefined;
        }

        /**
         * Get expression value and update tag metadata
         * @param {Object} tag - Tag to update
         * @returns {*} Expression value
         */
        const getExpression = function(tag) {
            // Get value
            const v = values && values[this.index] !== undefined ? values[this.index] : '';
            if (tag) {
                // Keep the reference
                tag.expression = this.reference;
                // Keep the index
                tag.index = this.index;
            }
            // Move the value index
            this.index++;
            // Delete reference
            delete this.reference;
            // Return value
            return v;
        }

        /**
         * Handle the text node creation
         */
        const commitText = function() {
            if (typeof(this.text) !== 'undefined') {
                const text = this.text.replace(/\r?\n\s+/g, '');
                if (text) {
                    createTextNode.call(this, { name: 'textContent', value: text });
                }
                delete this.text;
            }
        }

        /**
         * Save the attribute to the tag
         */
        const commitAttribute = function() {
            if (this.tag.attributeName) {
                // Commit any current attribute
                if (! this.tag.props) {
                    this.tag.props = [];
                }

                let k = this.tag.attributeName;
                let v = this.tag.attributeValue;

                if (typeof(v) === 'undefined') {
                    v = k;
                }

                let tag = {
                    name: k,
                    value: v,
                };

                if (typeof(this.tag.expression) !== 'undefined') {
                    tag.index = this.tag.index;
                    tag.expression = this.tag.expression;
                }

                this.tag.props.push(tag);

                // Clean up temporary properties
                delete this.tag.attributeName;
                delete this.tag.attributeValue;
                delete this.tag.index;
                delete this.tag.expression;

                if (this.tag.attributeIsReadyToClose) {
                    delete this.tag.attributeIsReadyToClose;
                }
            }
        }

        /**
         * Actions controller
         * @param {Object} control - Parser control object
         * @param {string} char - Current character
         */
        const actions = function(control, char) {
            const method = control.action || 'text';
            if (typeof actions[method] === 'function') {
                actions[method].call(control, char);
            }
        }

        /**
         * Process a new tag
         * @param char
         */
        actions.processTag = function(char) {
            // Just to check if there are any text to commit
            commitText.call(this);

            // Process the tag
            if (char === '<') {
                // Create new tag
                this.tag = {
                    type: '',
                    parent: this.current
                };
            } else if (char.match(/[a-zA-Z0-9-]/)) {
                // Tag name
                this.tag.type += char;
            } else {
                if (char === '$' && this.reference) {
                    // Custom tags
                    this.tag.type = getExpression.call(this);
                }
                // Finished with tag name, move to attribute handling
                this.action = 'attributeName';
            }
        }

        /**
         * Handle tag closing
         * @param char
         */
        actions.closeTag = function(char) {
            // Make sure to commit attribute
            commitAttribute.call(this);
            // Close the tag
            if (char === '>') {
                // Get the new parent
                if (isSelfClosing(this.tag.type)) {
                    // Push new tag to the parent
                    if (! this.tag.parent.children) {
                        this.tag.parent.children = [];
                    }
                    this.tag.parent.children.push(this.tag);
                } else if (this.tag.closingTag) {
                    // Need to find the parent on the chain
                    const parentNode = findParentByTagName(this.tag.parent, this.tag.type);
                    if (parentNode) {
                        this.current = parentNode.parent;
                    }
                } else {
                    if (this.tag.closing) {
                        // Current is the parent
                        this.current = this.tag.parent;
                    } else {
                        this.current = this.tag;
                    }

                    // Push new tag to the parent
                    if (! this.tag.parent.children) {
                        this.tag.parent.children = [];
                    }
                    this.tag.parent.children.push(this.tag);
                }

                // Remote temporary properties
                delete this.tag.insideQuote;
                delete this.tag.closingTag;
                delete this.tag.closing;
                // Finalize tag
                this.tag = null;
                // New action
                this.action = 'text';
            } else if (! this.tag.locked) {
                if (char === '/') {
                    if (! this.tag.type) {
                        // This is a closing tag
                        this.tag.closingTag = true;
                    }
                    // Closing character is found
                    this.tag.closing = true;
                } else if (char.match(/[a-zA-Z0-9-]/)) {
                    // If is a closing tag, get the tag name
                    if (this.tag.closingTag) {
                        this.tag.type += char;
                    }
                } else {
                    // Wait to the closing sign
                    if (this.tag.type) {
                        this.locked = true;
                    }
                }
            }
        }

        actions.attributeName = function(char) {
            // There is another attribute to commit
            if (this.tag.attributeIsReadyToClose) {
                commitAttribute.call(this);
            }

            // Build attribute name
            if (char.match(/[a-zA-Z0-9-:]/)) {
                if (! this.tag.attributeName) {
                    this.tag.attributeName = '';
                }
                this.tag.attributeName += char;
            } else if (char === '=') {
                // Move to attribute value
                if (this.tag.attributeName) {
                    this.action = 'attributeValue';
                    delete this.tag.attributeIsReadyToClose;
                }
            } else if (char.match(/\s/)) {
                if (this.tag.attributeName) {
                    this.tag.attributeIsReadyToClose = true;
                }
            }
        };

        actions.attributeValue = function(char) {
            if (! this.tag.attributeValue) {
                this.tag.attributeValue = '';
            }

            if (char === '"' || char === "'") {
                if (this.tag.insideQuote) {
                    if (this.tag.insideQuote === char) {
                        this.tag.insideQuote = false;
                    } else {
                        this.tag.attributeValue += char;
                    }
                } else {
                    this.tag.insideQuote = char;
                }
            } else {
                if (char === '$' && this.reference) {
                    // Custom tags
                    char = getExpression.call(this, this.tag);
                }
                // Inside quotes, keep appending to the attribute value
                if (this.tag.insideQuote) {
                    if (this.tag.attributeValue) {
                        this.tag.attributeValue += char;
                    } else {
                        this.tag.attributeValue = char;
                    }
                } else if (typeof(char) === 'string' && char.match(/\s/)) {
                    if (this.tag.attributeValue) {
                        this.action = 'attributeName';
                    }
                    this.tag.attributeIsReadyToClose = true;
                } else {
                    if (this.tag.attributeIsReadyToClose) {
                        this.action = 'attributeName';
                        actions.attributeName.call(this, char);
                    } else {
                        if (this.tag.attributeValue) {
                            this.tag.attributeValue += char;
                        } else {
                            this.tag.attributeValue = char;
                        }
                    }
                }
            }
        }

        actions.text = function(char) {
            if (char === '$' && this.reference) {
                // Just to check if there are any text to commit
                commitText.call(this);
                // Custom tags
                let tag = { name: 'textContent' }
                tag.value = getExpression.call(this, tag);
                // Add node tag
                createTextNode.call(this, tag);
            } else {
                if (referenceControl === 1) {
                    // Just to check if there are any text to commit
                    commitText.call(this);
                }

                // Normal text processing
                if (! this.text) {
                    this.text = '';
                }
                this.text += char; // Keep appending to text content

                if (referenceControl === 2) {
                    // Just to check if there are any text to commit
                    commitText.call(this);
                }
            }
        };

        // Control the LemonadeJS native references
        let referenceControl = null;

        const result = { type: 'template' };
        const control = {
            current: result,
            action: 'text',
            index: 0,
        };

        // Input validation
        if (typeof html !== 'string') {
            throw new TypeError('HTML input must be a string');
        }

        // Main loop to process the HTML string
        for (let i = 0; i < html.length; i++) {
            // Current char
            const char = html[i];

            // Global control logic
            if (control.tag) {
                if (char === '>' || char === '/') {
                    // End of tag, commit any attributes and go back to text parsing
                    if (! control.tag.insideQuote) {
                        control.action = 'closeTag';
                    }
                }
            } else {
                if (char === '<') {
                    control.action = 'processTag';
                }
            }

            // Control references
            if (char === '$' && html[i+1] === '{') {
                // Get the content of the reference
                let text = '';
                // Skip $ and {
                i += 2;
                // Next char
                do {
                    // Save reference
                    text += html[i];
                    // Next char
                    i++;
                } while (i < html.length && html[i] !== '}');
                // Content of the reference
                control.reference = text;
            }

            // Control node references
            if (char === '{' && html[i+1] === '{') {
                referenceControl = 1;
            } else if (char === '}' && html[i-1] === '}') {
                referenceControl = 2;
            }

            // Execute action
            actions(control, char);

            // Reference control
            referenceControl = null;
        }

        // Handle any remaining text
        commitText.call(control);

        return result.children && result.children[0];
    }

    const generateHTML = function(lemon) {

        const appendEvent = function(token, event, exec) {
            if (! lemon.events[token]) {
                lemon.events[token] = []
            }
            // Push the event
            lemon.events[token].push(event);
            // Execute
            if (exec) {
                event();
            }
        }

        const createEventsFromExpression = function(expression, event, exec) {
            // Get the tokens should be updated to populate this attribute
            let tokens = extractTokens(expression);
            if (tokens.length) {
                // Process all the tokens
                for (let i = 0; i < tokens.length; i++) {
                    appendEvent(tokens[i], event);
                }
            }
            // Execute method
            if (exec === true) {
                event();
            }
        }

        const setDynamicValue = function(item, token, attributeName) {
            // Event
            let applyValueEvent = function() {
                // Set attribute
                setAttribute(getElement(item), attributeName, lemon.self[token]);
            }
            // Append event
            appendEvent(token, applyValueEvent, true);
        }

        const dynamicContent = function(text) {
            try {
                // Cast value
                let cast = null;
                // Replace the text
                text = text.replace(isScript, function (a, b) {
                    let s = lemon.self;
                    // Try to find the property
                    let result = extractFromPath.call(s, b);
                    // Evaluation for legacy purposes
                    if (typeof(result) === 'undefined') {
                        // This is deprecated and will be drop on LemonadeJS 6
                        result = run.call(s, b);
                        if (typeof (result) === 'undefined') {
                            result = '';
                        }
                    }
                    // Parse correct type
                    if (typeof(result) !== 'string' && a === text) {
                        cast = result;
                    }
                    // Return
                    return result;
                });

                if (cast !== null) {
                    return cast;
                }

                return text;
            } catch (e) {
            }
        }

        const applyElementAttribute = function(item, prop) {
            if (typeof(prop.expression) !== 'undefined') {
                // Event to update the designed position
                let event = function() {
                    // Extra the value from the template
                    let value = lemon.view(parseTemplate)[prop.index];
                    // Set attribute
                    setAttribute(getElement(item), prop.name, value);
                }
                // Bind event to any tokens change
                createEventsFromExpression(prop.expression, event, true);
                // Register event for state changes
                lemon.events[prop.index] = event;
            } else {
                // Get the tokens should be updated to populate this attribute
                let tokens = extractTokens(prop.value);
                if (tokens.length) {
                    // Dynamic
                    createEventsFromExpression(prop.value, function() {
                        // Dynamic text
                        let value = dynamicContent(prop.value);
                        // Get the dynamic value
                        setAttribute(getElement(item), prop.name, value);
                    }, true)
                } else {
                    let value = prop.value;
                    if (value.match(isScript)) {
                        value = dynamicContent(value);
                    }

                    setAttribute(getElement(item), prop.name, value);
                }
            }
        }

        /**
         * Create a LemonadeJS self reference
         * @param item
         * @param prop
         */
        const createReference = function(item, prop) {
            if (typeof(item.type) === 'function') {
                // Reference to the self o the LemonadeJS component
                lemon.self[prop] = item.self;
            } else {
                // Reference to the DOM element
                lemon.self[prop] = item.element;
            }
        }

        /**
         * Create a LemonadeJS self bind
         * @param item
         * @param prop
         */
        const applyBindHandler = function(item, prop) {
            // Event from component to the property
            let event = function() {
                let value = getAttribute(getElement(item), 'value');
                if (lemon.self[prop] !== value) {
                    lemon.self[prop] = value;
                }
            }

            if (typeof(item.type) === 'function') {
                item.bind = event;
            } else {
                item.element.addEventListener('input', event);
            }

            // Event property to the element
            event = () => {
                setAttribute(getElement(item), 'value', lemon.self[prop]);
            }
            // Append event
            appendEvent(prop, event, true);
        }

        /**
         * Process the :ready. Call when DOM is ready
         * @param item
         * @param prop
         */
        const whenIsReady = function(item, prop) {
            let value = prop.value;
            // If not a method, should be converted to a method
            if (typeof(value) !== 'function') {
                let t = extractFromPath.call(lemon.self, value);
                if (t) {
                    value = t;
                }
            }
            // Must be a function
            if (typeof(value) === 'function') {
                lemon.ready.push(function() {
                    value(getElement(item), lemon.self);
                });
            } else {
                createError(`:ready ${value} is not a function`)
            }
        }

        const getRoot = function(item) {
            return typeof(item.type) === 'function' ? item.parent.element : item.element;
        }

        const registerLoop = function(item, prop) {
            // Event
            let event = function() {
                // Component
                let method = typeof(item.type) === 'function' ? item.type : Basic;
                // Elements
                let items = [];
                // Get the data
                const data = lemon.self[prop];
                // Process the data
                if (data && Array.isArray(data)) {
                    // Process data
                    data.forEach(function(self) {
                        let el = self.el;
                        if (! el) {
                            // Register parent
                            register(self, 'parent', lemon.self);
                            // Render
                            el = L.render(method, null, self, item);
                        }
                        items.push(el);
                    })
                }
                // Remove all DOM
                let root = getRoot(item);
                if (root) {
                   while (root.firstChild) {
                       root.firstChild.remove();
                   }
                   // Insert elements to the DOM
                   while (items.length) {
                       root.appendChild(items.shift());
                   }
                }
            }

            // Append event
            let root = getRoot(item);
            if (root) {
                appendEvent(prop, event, true);
            } else {
                appendEvent(prop, event);
                // Defer event since the dom is not ready
                lemon.ready.push(event)
            }
        }

        const isLoopAttribute = function(props) {
            let test = false;
            props.forEach(function(prop) {
                if (prop.name === ':loop' || prop.name === 'lm-loop') {
                    test = true;
                }
            });
            return test;
        }

        const appendChildren = function(container, children) {
            if (children) {
                children.forEach(child => {
                    if (typeof(child) === 'string') {
                        container.appendChild(document.createTextNode(child));
                    } else if (child.element) {
                        if (child.element.tagName === 'ROOT') {
                            while (child.element.firstChild) {
                                container.appendChild(child.element.firstChild);
                            }
                        } else {
                          container.appendChild(child.element);
                        }
                    }
                });
            }
        }

        const getAttributeName = function(prop) {
            return prop[0] === ':' ? prop.substring(1) : prop.substring(3);
        }

        const getAttributeEvent = function(event) {
            event = event.toLowerCase();
            if (event.startsWith('on')) {
                return event.toLowerCase();
            } else if (event.startsWith(':on')) {
                return getAttributeName(event);
            }
        }

        /**
         * CHeck if the event name is a valid DOM event name
         * @param element
         * @param eventName
         * @returns {boolean}
         */
        const isValidEventName = function(element, eventName) {
            const validEventPattern = /^on[a-z]+$/;
            return validEventPattern.test(eventName);
        }

        const createElements = function(item) {
            if (typeof(item) === 'object') {
                // Create element
                if (item.type === '#text') {
                    // Text node
                    item.element = document.createTextNode(item.props[0].textContent);
                    // Check for dynamic content
                    applyElementAttribute(item, item.props[0]);
                } else {
                    // Apply attributes if they exist
                    if (item.props && ! Array.isArray(item.props)) {
                        let props = [];
                        let keys = Object.keys(item.props);
                        for (let i = 0; i < keys.length; i++) {
                            props.push({ name: keys[i], value: item.props[keys[i]] });
                        }
                        item.props = props;
                    } else if (! item.props) {
                        item.props = [];
                    }

                    // This item is a parent for a loop
                    if (isLoopAttribute(item.props)) {
                        // Mark this item as a loop
                        item.loop = true;
                    }

                    if (! item.type) {
                        item.type = 'root';
                    }

                    if (typeof(item.type) === 'string') {
                        if (item.type.match(/^[A-Z][a-zA-Z0-9\-]*$/g)) {
                            let controller = item.type.toUpperCase();
                            if (typeof(R.components[controller]) === 'function') {
                                item.type = R.components[controller];
                            } else if (typeof (lemon.components[controller]) === 'function') {
                                item.type = lemon.components[controller];
                            } else {
                            }
                        }
                    }

                    if (typeof(item.type) === 'string') {
                        item.element = document.createElement(item.type);
                    } else if (typeof(item.type) === 'function') {
                        item.self = {};
                    }

                    // Create all children
                    if (item.children && ! item.loop) {
                        item.children.forEach(child => {
                            createElements(child);
                        });
                    }

                    // Process attributes
                    if (item.props.length) {
                        item.props.forEach(function(prop, k) {
                            // If the property is an event
                            let event = getAttributeEvent(prop.name);
                            // When event for a DOM
                            if (event) {
                                // Element
                                let element = item.element;
                                // Value
                                let value = prop.value;
                                if (value) {
                                    let handler = null; // Reset handler for each iteration
                                    if (typeof (value) === 'function') {
                                        handler = value;
                                    } else {
                                        let t = extractFromPath.call(lemon.self, value);
                                        if (t) {
                                            if (typeof (t) === 'function') {
                                                prop.value = handler = t;
                                            }
                                        }
                                    }
                                    // When the element is a DOM
                                    if (isDOM(element)) {
                                        // Create the event handler
                                        let eventHandler;
                                        // Bind event
                                        if (typeof(handler) === 'function') {
                                            eventHandler = function(e) {
                                                handler.call(element, e, lemon.self);
                                            }
                                        } else {
                                            // Legacy compatibility. Inline scripting is non-Compliance with Content Security Policy (CSP)
                                            eventHandler = function (e) {
                                                Function('self', 'e', value).call(element, lemon.self, e);
                                            }
                                        }

                                        if (isValidEventName(element, prop.name)) {
                                            element.addEventListener(event.substring(2), eventHandler);
                                        } else {
                                            element[event] = eventHandler;
                                        }
                                    } else {
                                        item.self[event] = handler || value;
                                    }
                                }
                            } else if (prop.name.startsWith(':') || prop.name.startsWith('lm-')) {
                                // Create a reference to the DOM element
                                let property = prop.expression || prop.value;
                                // Special lemonade attribute name
                                let attrName = getAttributeName(prop.name);
                                // Special properties bound to the self
                                if (attrName === 'ready') {
                                    whenIsReady(item, prop);
                                  } else {
                                    // Get the attribute name
                                    property = extractTokens(property);
                                    // Reference name is found
                                    if (property.length === 1) {
                                        // Whe need the entry
                                        property = property[0];
                                        // Is that a special event
                                        if (attrName === 'ref') {
                                            createReference(item, property)
                                        } else if (attrName === 'bind') {
                                            applyBindHandler(item, property);
                                        } else if (attrName === 'loop') {
                                            registerLoop(item, property);
                                        } else {
                                            setDynamicValue(item, property, attrName);
                                        }
                                    } else {
                                        setAttribute(getElement(item), attrName, castProperty(prop.value));
                                    }
                                }
                            } else {
                                applyElementAttribute(item, prop);
                            }
                        })
                    }

                    // Do not create elements at this state if this is a loop
                    if (! item.loop) {
                        if (typeof(item.type) === 'function') {
                            // Execute component
                            item.element = L.render(item.type, null, item.self, item);
                        }

                        // Create all children
                        if (item.children) {
                            let root = item.element;
                            if (item.self && item.self.settings && typeof(item.self.settings.getRoot) === 'function') {
                                root = item.self.settings.getRoot();
                            }
                            appendChildren(root, item.children);
                        }
                    }
                }
            }
        }

        // Create DOM elements
        createElements(lemon.tree);

        return lemon.tree.element;
    }

    const nodeToXml = function(node) {
        function buildElement(node) {
            // Handle text nodes
            if (node.type === '#text') {
                // Check for textContent in props
                const textContentProp = node.props?.find(prop => prop.name === 'textContent');
                if (textContentProp) {
                    return escapeXml(textContentProp.value);
                }
                return '';
            }

            // Handle element nodes
            const attributes = node.props?.length
                ? ' ' + node.props
                .map(attr => `${attr.name}="${escapeXml(attr.value)}"`)
                .join(' ')
                : '';

            // If no children, create self-closing tag
            if (!node.children?.length) {
                return `<${node.type}${attributes}/>`;
            }

            // Process children
            const childrenXml = node.children
                .map(child => buildElement(child))
                .join('');

            // Return complete element
            return `<${node.type}${attributes}>${childrenXml}</${node.type}>`;
        }

        // Escape special XML characters
        function escapeXml(text) {
            if (text === undefined || text === null) return '';
            return String(text)
                .replace(/&/g, '&amp;')
                .replace(/</g, '&lt;')
                .replace(/>/g, '&gt;')
                .replace(/"/g, '&quot;')
                .replace(/'/g, '&apos;');
        }

        return buildElement(node);
    }

    /**
     * Extract a property from a nested object using a string address
     * @param {string} str address inside the nested object
     * @param {boolean} config get the configuration obj => property
     */
    const extractFromPath = function(str, config) {
        try {
            let t = str.toString().replace(/[\[\]]/g, '.').split('.');
            if (t[0] === 'self' || t[0] === 'this') {
                t.shift();
            }
            // Remove blanks
            t = t.filter(item => item !== '');
            // Object
            let o = this;
            let lastObject;
            while (t.length) {
                // Get the property
                let p = t.shift();
                // Process config
                if (config) {
                    if (typeof(o) === 'object' && ! Array.isArray(o)) {
                        lastObject = [o,p];
                    }
                    if (t.length === 0) {
                        return lastObject;
                    }
                }
                // Check if the property exists
                if (o.hasOwnProperty(p) || typeof(o[p]) !== 'undefined') {
                    o = o[p];
                } else {
                    return undefined;
                }
            }

            if (typeof(o) !== 'undefined') {
                return o;
            }
        } catch (e) {}

        // Something went wrong
        return undefined;
    }

    /**
     * Cast the value of an attribute
     */
    const castProperty = function(attr) {
        // Parse type
        try {
            if (typeof(attr) === 'string' && attr) {
                // Remove any white spaces
                attr = attr.trim();
                if (attr === 'true') {
                    return true;
                } else if (attr === 'false') {
                    return false;
                } else if (! isNaN(attr)) {
                    return Number(attr);
                } else {
                    let firstChar = attr[0];
                    if (firstChar === '{' || firstChar === '[') {
                        if (attr.slice(-1) === '}' || attr.slice(-1) === ']') {
                            return JSON.parse(attr);
                        }
                    } else if (attr.startsWith('self.') || attr.startsWith('this.')) {
                        let v = extractFromPath.call(this, attr);
                        if (typeof(v) !== 'undefined') {
                            return v;
                        }
                    }
                }
            }
        } catch (e) {}

        return attr;
    }

    /**
     * This allows to run inline script on LEGACY system. Inline script can lead to security issues so use carefully.
     * @param {string} s string to function
     */
    const run = function(s) {
        return Function('self', '"use strict";return (' + s + ')')(this);
    }

    /**
     * Check if the content {o} is a valid DOM Element
     * @param {HTMLElement|DocumentFragment|object} o - is this a valid dom?
     * @return {boolean}
     */
    const isDOM = function(o) {
        return (o instanceof HTMLElement || o instanceof Element || o instanceof DocumentFragment);
    }

    /**
     * Check if the method is a method or a class
     * @param {function} f
     * @return {boolean}
     */
    const isClass = function(f) {
        return typeof f === 'function' && /^class\s/.test(Function.prototype.toString.call(f));
    }

    /**
     * Basic handler
     * @param {string} t - HTML template
     * @return {HTMLElement}
     */
    const Basic = function(t) {
        return t;
    }

    /**
     * Get the attribute helper
     * @param {object} e Element
     * @param {string} attribute
     */
    const getAttribute = function(e, attribute) {
        let value;
        if (attribute === 'value') {
            if (typeof(e.val) === 'function') {
                value = e.val();
            } else {
                if (e.getAttribute) {
                    if (e.tagName === 'SELECT' && e.getAttribute('multiple')) {
                        value = [];
                        for (let i = 0; i < e.options.length; i++) {
                            if (e.options[i].selected) {
                                value.push(e.options[i].value);
                            }
                        }
                    } else if (e.type === 'checkbox') {
                        value = e.checked && e.getAttribute('value') ? e.value : e.checked;
                    } else if (e.getAttribute('contenteditable')) {
                        value = e.innerHTML;
                    } else {
                        value = e.value;
                    }
                } else {
                    value = e.value;
                }
            }
        }
        return value;
    }

    /**
     * Set attribute value helper
     * @param {object} e Element
     * @param {string} attribute
     * @param {any} value
     */
    const setAttribute = function(e, attribute, value) {
        // Handle state
        if (value instanceof state) {
            value = value.value;
        } else if (typeof(value) === 'undefined') {
            value = '';
        }

        if (attribute === 'value') {
            // Update HTML form element
            if (typeof(e.val) === 'function') {
                if (e.val() != value) {
                    e.val(value);
                }
            } else if (e.tagName === 'SELECT' && e.getAttribute('multiple')) {
                for (let j = 0; j < e.children.length; j++) {
                    e.children[j].selected = value.indexOf(e.children[j].value) >= 0;
                }
            } else if (e.type === 'checkbox') {
                e.checked = ! (! value || value === '0' || value === 'false');
            } else if (e.type === 'radio') {
                e.checked = false;
                if (e.value == value) {
                    e.checked = true;
                }
            } else if (e.getAttribute && e.getAttribute('contenteditable')) {
                if (e.innerHTML != value) {
                    e.innerHTML = value;
                }
            } else {
                // Make sure apply that to the value
                e.value = value;
                // Update attribute if exists
                if (e.getAttribute && e.getAttribute('value') !== null) {
                    e.setAttribute('value', value);
                }
            }
        } else if (attribute === 'src') {
            if (value) {
                e.setAttribute(attribute, value);
            }
        } else if (typeof(e[attribute]) !== 'undefined' || typeof(value) === 'object' || typeof(value) === 'function') {
            e[attribute] = value;
        } else {
            if (isDOM(e)) {
                if (value === '') {
                    e.removeAttribute(attribute);
                } else {
                    e.setAttribute(attribute, value);
                }
            } else {
                e[attribute] = value;
            }
        }
    }

    /**
     * Get attributes as an object
     * @param {boolean} props - all attributes that are not undefined
     * @return {object}
     */
    const getAttributes = function(props) {
        let o = {};
        let k = null;
        let a = this.attributes;
        if (a && a.length) {
            for (let i = 0; i < a.length; i++) {
                k = a[i].name;
                if (props && typeof(this[k]) !== 'undefined') {
                    o[k] = this[k];
                } else {
                    o[k] = a[i].value;
                }
            }
        }
        return o;
    }

    /**
     * Register a getter without setter for a self object
     * @param {object} s - self object
     * @param {string} p - self property
     * @param {string|object|number} v - value
     */
    const register = function(s, p, v) {
        if (typeof(s) === 'object') {
            Object.defineProperty(s, p, {
                enumerable: false,
                configurable: true,
                get: function () {
                    return v;
                }
            });
        }
    }

    /**
     * Extract variables from the dynamic and append to the self
     * @return {[string, array]} grab the literal injection
     */
    const parseTemplate = function() {
        let args = Array.from(arguments);
        // Remove first
        args.shift()
        // Return the final template
        return args;
    }

    function cloneChildren(element) {
        // Base case: if element is null/undefined or not an object, return as is
        if (!element || typeof element !== 'object') {
            return element;
        }

        // Handle arrays
        if (Array.isArray(element)) {
            return element.map(item => cloneChildren(item));
        }

        // Create new object
        const cloned = {};

        // Clone each property
        for (const key in element) {
            if (key === 'children') {
                // Handle children specially as before
                cloned.children = element.children ? cloneChildren(element.children) : undefined;
            } else if (key === 'props') {
                // Deep clone props array
                cloned.props = element.props.map(prop => ({
                    ...prop,
                    value: prop.value // If value is a function, it will maintain the reference which is what we want
                }));
            } else {
                // Clone other properties
                cloned[key] = element[key];
            }
        }

        return cloned;
    }

    // LemonadeJS object
    const L = {};

    // Master container
    let currentLemon = null;

    /**
     * Render a lemonade DOM element, method or class into a root DOM element
     * @param {function} component - LemonadeJS component or DOM created
     * @param {HTMLElement} root - root DOM element to receive the new HTML
     * @param {object?} self - self to be used
     * @param {object?} item - item
     * @return {HTMLElement|boolean} o
     */
    L.render = function(component, root, self, item) {
        if (typeof(component) !== 'function') {
            console.error('Component is not a function');
            return false;
        }

        // In case the self has not initial definition by the developer
        if (typeof(self) === 'undefined') {
            self = {};
        }

        // Arguments
        let args = Array.from(arguments);

        // Lemonade component object
        let lemon = {
            self: self,
            ready: [],
            change: [],
            events: [],
            components: {},
            elements: [],
        }

        if (! item) {
            item = {};
        } else if (typeof(item) === 'string') {
            item = {
                children: item,
            }
        }

        let view;
        let result;

        // New self
        if (component === Basic) {
            view = cloneChildren(item.children[0]);
        } else {
            currentLemon = lemon;

            if (isClass(component)) {
                self = new component(self);
                view = self.render(item.children);
            } else {
                // Execute component
                view = component.call(self, item.children);
            }

            currentLemon = null;
        }

        // Values
        let values = [];
        // Process return
        if (typeof(view) === 'function') {
            values = view(parseTemplate);
            // Curren values
            lemon.values = values;
            // A render template to be executed
            lemon.view = view;
            // Template from the method
            result = view.toString().split('`');
            // Get the original template
            if (result) {
                result = result[1].trim();
            }
        } else {
            result = view;
        }

        // Virtual DOM tree
        if (typeof(result) === 'string') {
            result = HTMLParser(result, values);
        }

        let element;

        // Process the result
        if (result) {
            // Get the HTML virtual DOM representation
            lemon.tree = result;

            // Create real DOM and append to the root
            element = generateHTML(lemon);
            if (element) {
                // Parents
                lemon.elements = [];
                // Append parents
                if (element.tagName === 'ROOT') {
                    element.childNodes.forEach((e) => {
                        lemon.elements.push(e);
                    });
                } else {
                    lemon.elements.push(element);
                }

                // Register element when is not registered inside the component
                register(lemon.self, 'el', element);

                // Refresh
                register(lemon.self, 'refresh', (prop) => {
                    if (prop) {
                        if (prop === true) {
                            runViewValues(lemon);
                        } else {
                            lemon.self[prop] = lemon.self[prop];
                        }
                    } else {
                        // Do not add in the same root
                        let div = document.createElement('div');
                        // Append temporary DIV to the same position
                        lemon.elements[0].parentNode.insertBefore(div, lemon.elements[0]);
                        // Remove the old elements
                        lemon.elements.forEach((e) => {
                            e.remove();
                        });
                        // Root element
                        args[1] = div;
                        // Create a new component
                        let e = L.render(...args);
                        // Append elements in the same position in the DOM tree
                        while (div.firstChild) {
                            div.parentNode.insertBefore(div.firstChild, div);
                        }
                        // Remove DIV
                        div.remove();
                        // Object not in use
                        lemon = null;
                    }
                });

                // Append element to the DOM
                if (root) {
                    lemon.elements.forEach((e) => {
                        root.appendChild(e);
                    });
                }
            }
        }

        // Bind to custom component
        if (item.bind) {
            let token = 'value';
            if (! lemon.events[token]) {
                lemon.events[token] = []
            }
            // Push the event
            lemon.events[token].push(item.bind);
        }

        // Apply events
        if (lemon.events) {
            let props = Object.keys(lemon.events);
            if (props.length) {
                for (let i = 0; i <props.length; i++) {
                    trackProperty(lemon, props[i]);
                }
            }
        }

        // Process the onload
        if (element) {
            processOnload(lemon);
        }

        return element;
    }

    const registerComponents = function(components) {
        if (components && currentLemon) {
            for (const key in components) {
                currentLemon.components[key.toUpperCase()] = components[key];
            }
        }
    }

    /**
     * Deprecated
     * @param {string} template
     * @param {object?} s (self)
     * @param {object?} components
     */
    L.element = function(template, s, components) {
        registerComponents(components);
        return template;
    }

    /**
     * Apply self to an existing appended DOM element
     * @param {HTMLElement} el - element root
     * @param {object} s - self to associate to the template
     * @param {object?} components - object with component declarations
     */
    L.apply = function(el, s, components) {
        let template = el.innerHTML;
        el.textContent = '';
        let Component = function() {
            registerComponents(components);
            return `<>${template}</>`;
        }
        return L.render(Component,el,s);
    }

    /**
     * Get all properties existing in {o} and create a new object with the values from {this};
     * @param {object} o - reference object with the properties relevant to the new object
     * @return {object} n - the new object with all new values
     */
    L.getProperties = function(o) {
        // The new object with all properties found in {o} with values from {this}
        let n = {};
        for (let p in o) {
            n[p] = this[p];
        }
        return n;
    }

    /**
     * Set the values from {o} to {this}
     * @param {object} o set the values of {this} when the this[property] is found in {o}, or when flag force is true
     * @param {boolean} f create a new property when that does not exists yet, but is found in {o}
     * @return {object} this is redundant since object {this} is a reference and is already available in the caller
     */
    L.setProperties = function(o, f) {
        for (let p in o) {
            if (this.hasOwnProperty(p) || f) {
                this[p] = o[p];
            }
        }
        return this;
    }

    /**
     * Reset the values of any common property name between this and a given object
     * @param {object} o - all properties names in the object {o} found in {this} will be reset.
     */
    L.resetProperties = function(o) {
        for (let p in o) {
            this[p] = '';
        }
    }

    /**
     * Lemonade CC (common container) helps you share a self or function through the whole application
     * @param {string} name alias for your declared object(self) or function
     * @returns {Object | Function} - registered element
     */
    L.get = function(name) {
        return R.container.get(name);
    }

    /**
     * Register something to the Lemonade CC (common container)
     * @param {string} name - alias for your declared object(self) or function
     * @param {object|function} e - the element to be added to the common container. Can be an object(self) or function.
     * @param {boolean} persistence - optional the persistence flag. Only applicable for functions.
     */
    L.set = function(name, e, persistence) {
        // Applicable only when the o is a function
        if (typeof(e) === 'function' && persistence === true) {
            // Keep the flag
            e.storage = true;
            // Any existing values
            let t = window.localStorage.getItem(name);
            if (t) {
                // Parse JSON
                t = JSON.parse(t);
                // Execute method with the existing values
                e(t);
            }
        }
        // Save to the sugar container
        R.container.set(name, e);
    }

    /**
     * Dispatch the new values to the function
     * @param {string} name - alias to the element saved on the Lemonade CC (common container)
     * @param {object} data - data to be dispatched
     */
    L.dispatch = function(name, data) {
        // Get from the container
        let e = R.container.get(name);
        // Confirm that the alias is a function
        if (typeof(e) === 'function') {
            // Dispatch the data to the function
            e(data);
            // Save the data to the local storage
            if (e.storage === true) {
                window.localStorage.setItem(name, JSON.stringify(data));
            }
        }
    }

    /**
     * Register components
     * @param {object} components - register components
     */
    L.setComponents = function(components) {
        if (typeof(components) === 'object') {
            // Component names
            let k = Object.keys(components);
            // Make sure they follow the standard
            for (let i = 0; i < k.length; i++) {
                R.components[k[i].toUpperCase()] = components[k[i]];
            }
        }
    }

    L.component = class {
        constructor(s) {
            if (s) {
                Object.assign(this, s);
            }
        }
    }

    /**
     * Create a Web Component
     * @param {string} name - web component name
     * @param {function} handler - lemonadejs component
     * @param {object} options - options to create the web components
     */
    L.createWebComponent = function(name, handler, options) {
        if (typeof(handler) !== 'function') {
            return 'Handler should be an function';
        }

        // Prefix
        let prefix = options && options.prefix ? options.prefix : 'lm';

        // Component name
        const componentName = prefix + '-' + name;

        // Check if the component is already defined
        if (! customElements.get(componentName)) {
            class Component extends HTMLElement {
                constructor() {
                    super();
                }

                initSettings(props) {
                    // Copy all values to the object
                    if (typeof(props) === 'object') {
                        L.setProperties.call(this, props, true);
                    }
                }

                connectedCallback() {
                    // LemonadeJS self
                    let self = this;
                    // First call
                    let state = typeof(this.el) === 'undefined';
                    // LemonadeJS is already rendered
                    if (state === true) {
                        // Get attributes
                        let props = getAttributes.call(self, true);
                        // Copy all values to the object
                        L.setProperties.call(self, props, true);
                        // Render
                        if (options && options.applyOnly === true) {
                            // Merge component
                            handler.call(this);
                            // Apply
                            L.apply(this, self);
                        } else {
                            let root = this;
                            if (options && options.shadowRoot === true) {
                                this.attachShadow({ mode: 'open' });
                                root = document.createElement('div');
                                this.shadowRoot.appendChild(root);
                            }
                            // Give the browser time to calculate all width and heights
                            L.render(handler, root, self);
                        }
                    }

                    requestAnimationFrame(() => {
                        // Event
                        if (typeof(self.onconnect) === 'function') {
                            self.onconnect(self, state);
                        }
                    });
                }

                disconnectedCallback() {
                    if (typeof(this.ondisconnect) === 'function') {
                        this.ondisconnect(this);
                    }
                }
            }

            window.customElements.define(componentName, Component);
        }
    }

    L.h = function(type, props, ...children) {
        return { type, props: props || {}, children };
    }

    L.Fragment = function(props) {
        return props.children;
    }

    const wrongLevel = 'Hooks must be called at the top level of your component';

    L.onload = function(event) {
        if (! currentLemon) {
            createError(wrongLevel);
        }
        currentLemon.load = event;
    }

    L.onchange = function(event) {
        if (! currentLemon) {
            createError(wrongLevel);
        }
        currentLemon.change.push(event);
    }

    /**
     * Run view values
     * @param lemon
     */
    const runViewValues = function(lemon) {
        let values = lemon.view(parseTemplate);
        if (values && values.length) {
            values.forEach((v, k) => {
                // If the value isf rom a state
                let test = v instanceof state ? v.value : v;
                // Compare if the previous value
                if (test !== lemon.values[k]) {
                    // Update current value
                    lemon.values[k] = v;
                    // Trigger state events
                    if (typeof(lemon.events[k]) === 'function') {
                        lemon.events[k]();
                    }
                }
            });
        }
    }

    const state = function() {}

    state.prototype.toString = function() {
        return this.value.toString();
    }

    state.prototype.valueOf = function() {
        return this.value;
    }

    state.prototype[Symbol.toPrimitive] = function(hint) {
        if (hint === 'string') {
            return this.value.toString();
        }
        return this.value;
    }

    // TODO: Proxy for Objects and Arrays
    L.state = function(value, callback) {
        if (! currentLemon) {
            createError(wrongLevel);
        }
        // Keep lemon local
        const lemon = currentLemon;
        // Create state container
        const s = new state();
        // Create method to update the state
        const setValue = (newValue) => {
            let oldValue = value;
            // Update original value
            value = typeof newValue === 'function' ? newValue(value) : newValue;
            // Values from the view
            runViewValues(lemon);
            // Call back
            callback?.(value, oldValue);
        }
        // Make the value attribute dynamic
        Object.defineProperty(s, 'value', {
            set: setValue,
            get: () => value
        });

        return [s, setValue];
    }

    L.helpers = {
        path: extractFromPath,
        getTemplate: function(node) {
            return nodeToXml(node)
        },
        properties: {
            get: L.getProperties,
            set: L.setProperties,
            reset: L.resetProperties,
        }
    }

    return L;
})));