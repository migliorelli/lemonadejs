describe('References', () => {

    it('Reference by template', function() {
        function Test() {
            return `<div><p>{{this.title}}</p></div>`;
        }

        lemonade.setComponents({ Test })

        // Get the attributes from the tag
        function Component() {
            this.title = true;

            // Title and year are declared in the parent template
            return `<div>
                <Test :title="{{this.title}}" />
            </div>`;
        }

        // Render the component and assert the return
        return render(Component).assert('true', function () {
            let self = this;
            return self.el.textContent;
        })
    });

    it('Boolean test', function() {
        function Test() {
            return `<div><p>{{this.title}}</p></div>`;
        }

        lemonade.setComponents({ Test })

        // Get the attributes from the tag
        function Component() {
            this.title = true;

            // Title and year are declared in the parent template
            return `<div>
                <Test :title="${true}" />
            </div>`;
        }

        // Render the component and assert the return
        return render(Component).assert('true', function () {
            let self = this;
            return self.el.textContent;
        })
    });

    it('Loading time dynamic', function() {
        function Test() {
            return `<div><p>{{this.input}}</p></div>`;
        }

        lemonade.setComponents({ Test })

        // Get the attributes from the tag
        function Component() {
            return render => render`<div><input type="text" :ref="self.test" /><Test :input="self.test" /></div>`;
        }

        // Render the component and assert the return
        return render(Component).assert('[object HTMLInputElement]', function () {
            let self = this;
            return self.el.textContent;
        })
    });










});