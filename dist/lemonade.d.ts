/**
 * Official Type definitions for LemonadeJS
 * https://lemonadejs.net
 */

// Core types
type OnloadFunction<T extends HTMLElement> = (element: T) => void;
type OnchangeFunction<T extends HTMLElement> = (prop: string, elements: T[]) => void;
type State<T> = { value: T };
type StateCallback<T> = (newValue: T, oldValue: T) => void;

// Module level exports
export const onload: (callback: OnloadFunction<HTMLElement>) => void;
export const onchange: OnchangeFunction<HTMLElement>;
export const state: <T>(value: T, callback?: StateCallback<T>) => State<T>;

declare function lemonade(): any;

declare namespace lemonade {
    // Export core types
    export { OnloadFunction, OnchangeFunction, State, StateCallback };

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
        onload?: OnloadFunction<HTMLElement>;
        /**
         * When a property used in the template is changed. Properties are tracked only when used in the template.
         */
        onchange?: OnchangeFunction<HTMLElement>;
    }

    type FunctionComponent = (this: {
        /**
         * Root element of the component
         */
        el: HTMLElement;
        /**
         * Parent component self
         */
        parent?: FunctionComponent;
        /**
         * Refresh a property that is an array or the entire component.
         * @param target
         */
        refresh: (target?: string) => void
        [key: string]: any;
    } & ComponentEvents) => void

    class component {
        constructor(s?: Record<string, any>);
        // Root DOM element
        el: HTMLElement;
        // Self which called the child component
        parent: FunctionComponent;
        // Refresh an array or the entire component
        refresh: (target?: string) => void
        [key: string]: any;
    }

    /**
     * Create a LemonadeJS
     * @param {string} template to create the element
     * @param {Object} self object to control the component
     * @param {Object} components that would be used in the template
     * @return {HTMLElement} Result DOM element, ready to be append to the DOM
     */
    export function element(template: string, self: Object, components?: Object): HTMLElement;

    /**
     * Append a LemonadeJS rendered DOM element to the DOM.
     * @param {Function} component LemonadeJS component
     * @param {HTMLElement} root DOM element container
     * @param {Object} self inject a self object to the renderer
     * @param {string?} template template to be passed to component
     * @return {HTMLElement} Result DOM element, ready to be append to the DOM
     */
    export function render(
        component: Function,
        root: HTMLElement,
        self?: Object,
        template?: string
    ): false | Element | Document | DocumentFragment;

    /**
     * Bind a self to an existing appended DOM element
     * @param {HTMLElement} root Existing DOM element
     * @param {Object} self LemonadeJS self controller
     * @param {Object} components that would be used in the template
     */
    export function apply(root: HTMLElement, self: Object, components?: Object): void;

    /**
     * Extract a property from a nested object using a string address
     * @param {string} str address inside the nested object
     * @param {boolean} config get the configuration obj => property
     */
    export function path(str: string, config: boolean): any;

    /**
     * Extract a property from a nested object using a string address
     * @param {string} name New webcomponent name. LemonadeJS includes a prefix of lm- so your final tag will be <lm-yourname>
     * @param {function} handler LemonadeJS component
     * @param {object?} options Options for your webcomponent
     */
    export function createWebComponent(
        name: string,
        handler: Function,
        options?: WebComponentOptions
    ): any;

    /**
     * Get an artifact from LemonadeJS Sugar by its alias identification
     * @param {string} alias Existing sugar alias
     * @return {Object|Function} Sugar Artifact
     */
    export function get(alias: string): void;

    /**
     * Set a artifact to LemonadeJS Sugar
     * @param {string} alias Sugar alias identification
     * @param {Object|Function} artifact Object of function to be saved to sugar
     * @param {Boolean} persistence Persist the last call. Only valid when the artifact is a function.
     */
    export function set(alias: string, artifact: Function | Object, persistence?: boolean): void;

    /**
     * Send an object to a sugar function.
     * @param {string} alias Existing sugar saved on sugar
     * @param {object} argument Object as an argument for the method.
     */
    export function dispatch(alias: string, argument: Object): void;

    /**
     * Add a custom component available across the whole application
     * @param {object} components
     */
    export function setComponents(components: Object): void;

    /**
     * Register a callback to be executed when component is loaded
     * @param callback Function to be called with root element when component loads
     */
    export function onload(callback: OnloadFunction<HTMLElement>): void;

    /**
     * Onchange event
     * @param prop Property name that changed
     * @param elements Elements affected by the change
     */
    export function onchange<T extends HTMLElement>(prop: string, elements: T[]): void;

    /**
     * Create a reactive state container
     * @param value Initial value
     * @param callback Optional callback function when value changes
     */
    export function state<T>(value: T, callback?: StateCallback<T>): State<T>;
}

export default lemonade;