
class App extends Component {
    init() {
        this.startMusic = this.startMusic.bind(this);
        this.start = false
    }

    startMusic() {
        this.start = true;
        const background = document.getElementsByClassName("animation")[0];
        background.style.background = "url('rain.png')";
        background.style.animation = "rain .3s linear infinite";
        this.render();
        document.getElementsByTagName("audio")[0].play();
    }

    create() {
        return html`<main><div class="animation">
            <audio src="./audio.mp3" preload="auto"></audio>
            ${!this.start ? html`<div class="intro">
                <button onclick=${this.startMusic}>click me</button>
                <p>Audio on :)</p>
            </div>` : html`<p class="alive"><a href="https://github.com/amirgamil/poseidon">Poseidon</a> is alive</p>
            `}
            <footer>Built by <a href="https://amirbolous.com">Amir</a></footer>
        </div>
        </main>`
    }
}

const app = new App();
document.body.appendChild(app.node);