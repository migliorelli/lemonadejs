import { setComponents } from 'lemonadejs';
import Home from './Home.js';

function App() {
    this.text = "Hello world";

    return `<Home :text="${this.text}" />`;
}

setComponents({ Home });

export default App;