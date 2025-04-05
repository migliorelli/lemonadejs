/**
 * Official Type definitions for LemonadeJS
 * https://lemonadejs.net
 */

// HTML extensions for LemonadeJS attributes
/*declare global {
    interface HTMLElement {
        ':ref'?: string;
        ':bind'?: string;
        ':data'?: string;
        ':click'?: string;
        ':keydown'?: string;
        ':keyup'?: string;
        ':change'?: string;
        ':checked'?: string;
        ':selected'?: string;
        ':value'?: string;
        [key: `:${string}`]: string | undefined;
    }
}*/

// Core types
type OnloadFunction<T extends HTMLElement> = (element: T) => void;
type OnchangeFunction<T extends HTMLElement> = (prop: string, elements: T[]) => void;
type State<T> = { value: T };
type StateCallback<T> = (newValue: T, oldValue: T) => void;

// Render types
type RenderTemplate = (strings: TemplateStringsArray, ...values: any[]) => HTMLElement;

// Component types
interface ComponentThis {
    [key: string]: any;
}

type FunctionComponent = {
    (this: ComponentThis): (render: RenderTemplate) => HTMLElement;
    prototype: any;
}

interface ComponentClass {
    new (props?: Record<string, any>): {
        el: HTMLElement;
        refresh: (target?: string) => void;
        [key: string]: any;
    };
}

export type Component = FunctionComponent | ComponentClass;

// Module level exports
export const onload: (method: OnloadFunction<HTMLElement>) => void;
export const onchange: (method: OnchangeFunction<HTMLElement>) => void;
export const state: <T>(value: T, callback?: StateCallback<T>) => State<T>;
export const setComponents: (components: Record<string, Component>) => void;
export const get: (alias: string) => any;
export const set: (alias: string, artifact: Function | Object, persistence?: boolean) => void;
export const dispatch: (alias: string, argument?: Object) => any;

declare function lemonade(): any;

declare namespace lemonade {
    // Export core types
    export { OnloadFunction, OnchangeFunction, State, StateCallback, Component };

    interface WebComponentOptions {
        /** Create the webcomponent inside a shadowRoot */
        shadowRoot?: boolean,
        /** Apply-only will apply the LemonadeJS self component on the existing HTML inside the tag already in the DOM */
        applyOnly?: boolean,
        /** Web component prefix name. Default: 'lm' */
        prefix?: string,
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
     * @param {LemonadeComponent} component LemonadeJS component
     * @param {HTMLElement} root DOM element container
     * @param {Object} self inject a self object to the renderer
     * @param {string?} template template to be passed to component
     * @return {HTMLElement} Result DOM element, ready to be append to the DOM
     */
    export function render(
        component: Component,
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
    export function createWebComponent(name: string, handler: Component, options?: WebComponentOptions): any;

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
     * @param {object?} argument Object as an argument for the method.
     */
    export function dispatch(alias: string, argument?: Object): void;

    /**
     * Add a custom component available across the whole application
     * @param {object} components
     */
    export function setComponents(components: Record<string, Component>): void;

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