export default function Home() {

    this.onenter = function() {
        console.log('Enter home');
    }

    this.onleave = function() {
        console.log('Leave home');
    }

    return render => render`<div>
        <h1>Home</h1>
        <p>This is home...</p>
    </div>`;
}