/**
 * Official Type definitions for LemonadeJS
 * https://lemonadejs.net
 */

declare function lemonade() : any;

declare namespace lemonade {
    type OnloadFunction = (component: HTMLElement) => void;

    type OnchangeFunction = (property: string, affectedElements: object) => void;

    interface WebComponentOptions {
        /** Create the webcomponent inside a shadowRoot */
        shadowRoot?: boolean,
        /** Apply-only will apply the LemonadeJS self component on the existing HTML inside the tag already in the DOM */
        applyOnly?: boolean,
        /** Web component prefix name. Default: 'lm' */
        prefix?: string,
    }

    interface ComponentEvents {
        /**
         * When the component is ready and appended to the DOM
         */
        onload?: OnloadFunction;
        /**
         * When a property used in the template is changed. Properties are tracked only when used in the template.
         */
        onchange?: OnchangeFunction;
    }

    type FunctionComponent = (this: {
        el: HTMLElement;
        refresh: (target?: string) => void;
        [key: string]: any;
    }) =>
        | string
        | ((render: {
        (template: TemplateStringsArray, ...values: any[]): HTMLElement;
        (template: string): HTMLElement;
    }) => HTMLElement);

    // Define the callback function type
    type StateCallback<T> = (newValue: T, oldValue: T) => void;

    class component {
        constructor(s?: Record<string, any>);
        // Root DOM element
        el: HTMLElement;
        // Refresh an array or the entire component
        refresh: (target?: string) => void
        [key: string]: any;
    }

    // State function with overloads to handle both cases
    function state<T>(initialValue: T): [T, (value: T) => void];
    function state<T>(initialValue: T, callback: StateCallback<T>): [T, (value: T) => void];

    /**
     * Create a LemonadeJS - Depraceted
     * @param {string} template to create the element
     * @param {Object} self object to control the component
     * @param {Object} components that would be used in the template
     * @return {HTMLElement} Result DOM element, ready to be append to the DOM
     */
    function element(template: String, self: Object, components?: Object) : HTMLElement;

    /**
     * Append a LemonadeJS rendered DOM element to the DOM.
     * @param {Function} component LemonadeJS component
     * @param {HTMLElement} root DOM element container
     * @param {Object} self inject a self object to the renderer
     * @param {string?} template template to be passed to component
     * @return {HTMLElement} Result DOM element, ready to be append to the DOM
     */
    function render(component: Function, root: HTMLElement, self?: Object) : Element;

    /**
     * Bind a self to an existing appended DOM element
     * @param {HTMLElement} root Existing DOM element
     * @param {Object} self LemonadeJS self controller
     * @param {Object} components that would be used in the template
     */
    function apply(root: HTMLElement, self: Object, components?: Object) : void;

    /**
     * Extract a property from a nested object using a string address
     * @param {string} str address inside the nested object
     * @param {boolean} config get the configuration obj => property
     */
    function path(str: string, config: boolean) : any;

    /**
     * Extract a property from a nested object using a string address
     * @param {string} name New webcomponent name. LemonadeJS includes a prefix of lm- so your final tag will be <lm-yourname>
     * @param {function} handler LemonadeJS component
     * @param {object?} options Options for your webcomponent
     */
    function createWebComponent(name: string, handler: Function, options?: WebComponentOptions) : any;

    /**
     * Get an artifact from LemonadeJS Sugar by its alias identification
     * @param {string} alias Existing sugar alias
     * @return {Object|Function} Sugar Artifact
     */
    function get(alias: String) : void;

    /**
     * Set a artifact to LemonadeJS Sugar
     * @param {string} alias Sugar alias identification
     * @param {Object|Function} artifact Object of function to be saved to sugar
     * @param {Boolean} persistence Persist the last call. Only valid when the artifact is a function.
     */
    function set(alias: String, artifact: Function|Object, persistence?: Boolean) : void;

    /**
     * Send an object to a sugar function.
     * @param {string} alias Existing sugar saved on sugar
     * @param {object} argument Object as an argument for the method.
     */
    function dispatch(alias: String, argument: Object) : void;

    /**
     * Add a custom component available across the whole application
     * @param {object} components
     */
    function setComponents(components: Object) : void;
}

export default lemonade;