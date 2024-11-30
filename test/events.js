describe('Events', () => {

    it('Updating a property from the onchange', function() {
        function Component() {
            let self = this;
            self.value = null;
            self.test = 5;
            self.onchange = function () {
                self.value = self.test;
            }
            return `<input type="text" value="{{self.test}}"/>`;
        }

        // Render the component and assert the return
        return render(Component).assert(2, function () {
            let self = this;
            // Change the value to negative
            self.test = 2;
            // Return the value
            return self.value;
        })
    });

    it('Onload event', function() {
        function Component() {
            let self = this;
            self.value = null;
            self.test = 5;
            self.onload = function () {
                self.value = self.test;
            }
            return `<h1>{{self.value}}</h1>`;
        }

        // Render the component and assert the return
        return render(Component).assert('5', function () {
            let self = this;
            // Return the value
            return self.el.textContent;
        })
    });

    it('Nested events', function() {
        function Component() {
            this.value = 1;

            this.test = {};
            this.test.click = () => {
                this.value++;
            }

            // Title and year are declared in the parent template
            return `<div>
                <h1>{{this.value}}</h1>
                <input type="button" onclick="self.test.click" />
            </div>`;
        }

        // Render the component and assert the return
        return render(Component).assert('2', function () {
            let self = this;
            self.el.click()
            // Return the value
            return self.el.textContent;
        })
    });
});