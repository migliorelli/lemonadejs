title: Web Components with LemonadeJS v3
keywords: LemonadeJS, web components, frontend, javascript library, integration,
description: Learn how to create web components with LemonadeJS version 3.

# Web Components
 
## Overview

### Reactive web components with LemonadeJS v3

There are two necessary methods to create reactive web-components using LemonadeJS. The method `render()` should return the template, the `connectedCallback()` will execute and append the result to the DOM when the web-component is ready.  
  
```html
<div id="root">
    <hello-component title="Hello world" />
</div>
<script>
class Hello extends HTMLElement {
    constructor() {
        super();
    }

    render() {
        const self = this;
        return `<>
            <p>{{self.title}}</p>
            <input type="button" value="setTitle()"
                onclick="self.title = 'Test'" />
        </>`;
    }

    connectedCallback() {
        lemonade.render(this.render, this, this);
    }
}

window.customElements.define('hello-component', Hello);
</script>
```