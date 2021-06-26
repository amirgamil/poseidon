
//higher-order gallery component that will be used to switch pictures and render new paintings
class CatGallery extends Component {
    init() {
        this.getRandomCatPicture = this.getRandomCatPicture.bind(this);
        this.createPixelatedImage = this.createPixelatedImage.bind(this);
        this.loading = true;
        //initialize first cat picture
        this.getRandomCatPicture();
    }

    async getRandomCatPicture(evt) {
        this.loading = true;
        //display loading 
        this.render();
        //we will use HTML canvas to render our pixelated image
        const res = await fetch("https://cataas.com/cat?width=199");
        this.imageLink = res.url;
        console.log(this.imageLink);
        this.createPixelatedImage();
    }

    mapToPixels() {

    }

    createPixelatedImage() {
        let c = document.getElementById("catcanvas");
        let catimg = new Image();
        //need to set cross-origin to anoynmous in order to be able on an image from a different source
        //note this will not necessarily work with all APIs, the API have the header "Access-Control-Allow-Origin" set to *
        catimg.crossOrigin = "Anonymous";
        catimg.style.maxWidth = "75vw;"
        catimg.style.maxHeight = "75vh;"

        //loading an image is a blocking event, so we add an event handler to run when an image has finished loading
        catimg.onload = () => {
                //remove previous cat image
                const w = catimg.width;
                const h = catimg.height;

                //set width and height to width and height of the canvas
                c.height = h;
                c.width = w;
                document.getElementById("asciiart").width = w;
                const ctx = c.getContext("2d");
                //draw the image on the canvas
                ctx.filter = "grayscale()";
                ctx.drawImage(catimg, 1, 0);
                const asciiMappings = '$@B%8&WM#*oahkbdpqwmZO0QLCJUYXzcvunxrjft/|()1{}[]?-_+~<>i!lI;:,"^`\'.  ';
                //get the image as an array so we have access directly to the RGB pixels we can pertrube
                //the returned array is a 1-dimensional array. The array is arranged in blocks of 4 
                //where each block corresponds to a red, green, blue, or alpha channel
                //so arr = [red1, green1, blue1, alpha1, red2 .....]
                var pixelArr = ctx.getImageData(0, 0, w, h).data;
                console.log(pixelArr);
                const ascii = [];
                // ctx.clearRect(0, 0, w, h);
                //add component of randomness in terms of how pixelated the image will be. Larger values = more pixelated

                let sampleSize = 2.5 + Math.floor(Math.random() * 5);
                let grayscaleArr = []
                for (let i = 0; i < pixelArr.length; i += 4) {
                    const r = pixelArr[i];
                    const g = pixelArr[i + 1];
                    const b = pixelArr[i + 2];
                    
                    //use weighted formula to get grayscale
                    const grayscale = 0.299 * r + 0.587 * g + 0.114 * b;
                    pixelArr[i] = pixelArr[i + 1] = pixelArr[i + 2] = grayscale;
                    grayscaleArr.push(grayscale)
                }
                

                const res = grayscaleArr.reduce((prev, current, index) => {
                    prev += asciiMappings[Math.floor(current / 255 * 11)];
                    if ((index + 1) % w === 0) {
                        prev += "\n"
                    }
                    return prev;
                }, "")

                document.getElementById("asciiart").textContent = res; 
                this.loading = false;
                this.render();
        };
        catimg.src = this.imageLink;
    }

    styles() {
        return css`
            .gallery {
                display: flex;
                flex-direction: column;
                justify-content: space-evenly;
                align-items: center;
            }
 
        `
    }

    create() {
        return html`<div class="gallery">
            ${this.loading ? html`<p>Something CATastrorphic is about to hit you. Patience...</p>` : null}
            <canvas id="catcanvas"></canvas>
            <img id="catart" />
            <pre id="asciiart"></pre>
            <button onclick=${this.getRandomCatPicture}>Next</button>
        </div>`
    }
}


class App extends Component {
    init() {
        this.catGallery = new CatGallery();
    }


    create() {
        return html`<main>
            ${this.catGallery.node}
            <footer>Built with <a href="https://github.com/amirgamil/poseidon">Poseidon</a> by <a href="https://amirbolous.com/">Amir</a></footer>
        </main>`
    }
}

const app = new App();
document.body.appendChild(app.node);