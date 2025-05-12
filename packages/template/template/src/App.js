import Message from './Message';
import Profile from './Profile';
import Home from './Home';

export default function App() {

    const beforeChange = function() {
        console.log(arguments)
    }

    return render => render`<>
        <Router animation="${true}" onchangepage="${beforeChange}">
            <Route path="/" controller="${Home}" />
            <Route path="/compose" controller="${Message}" />
            <Route path="/profile" controller="${Profile}" />
        </Router>
        <Toolbar>
            <a data-icon="inbox" title="Inbox" href="/" />
            <a data-icon="create" title="New message" href="/compose" />
            <a data-icon="person" title="Profile" href="/profile" />
        </Toolbar>
    </>`;
}