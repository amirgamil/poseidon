
//define some constants which will be used during the procedural generation later on
const NUM_LAYERS = 50;
const NUM_SHAPES_IN_LAYER = 100;
const MAX_RED = 100;
const MIN_RED = 5;
const MAX_GREEN = 5;
const MIN_GREEN = 4;
const MAX_BLUE = 3;
const MIN_BLUE= 1.5;


//component to synthetically draw a painting of a sky 
class Painting extends Component {
    init() {
        //bind our methods to use the correct reference to `this` in the body of methods
        this.drawLayer = this.drawLayer.bind(this);
        this.createBackground = this.createBackground.bind(this);
        this.drawSun = this.drawSun.bind(this);
        this.drawClouds = this.drawClouds.bind(this);
        //initalize first painting, TODO: figure out way without pressing button
    }

    //helper method which will be iteratively called to populate different layers
    drawLayer(canvas, ctx, parameters) {

        //get ready to draw a new overlapping area
        ctx.beginPath();
        //each layer will consist of a certain number of drawn squares and rectangles
        ctx.fillStyle = 'rgba('+parameters.red+','+parameters.green+','+parameters.blue+',1)';
        for (let shapes = 1; shapes < NUM_SHAPES_IN_LAYER; shapes++) {
            //randomly generate width
            const width = 150 * Math.random();
            //draw the shape
            //we want each shape to be drawn to be offset a little bit from the last shape
            //offset darker colors with a larger position value closer to the bottom of the page
            ctx.fillRect(shapes * width, (3 - Math.random())*parameters.position*15, width, canvas.height * Math.random());
        }

        //update rgb values on next layer - TODO: experiment with these
        parameters.red -= this.RED_OFFSET; 
        parameters.green -= this.GREEN_OFFSET//4.5;
        parameters.blue -= this.BLUE_OFFSET//3;
        ctx.closePath();
    }
    //method that will handle overall background composition
    createBackground() {
        const canvas = document.getElementById("background");
        const ctx = canvas.getContext("2d");
        canvas.width = window.innerWidth;
        //save some space for the footer
        canvas.height = window.innerHeight;
        this.RED_OFFSET = Math.floor(Math.random() * (MAX_RED - MIN_RED)) + MIN_RED; 
        this.GREEN_OFFSET = Math.floor(Math.random() * (MAX_GREEN - MIN_GREEN)) + MIN_GREEN; 
        this.BLUE_OFFSET = Math.floor(Math.random() * (MAX_BLUE - MIN_BLUE)) + MIN_BLUE; 
        //each overlapping layer will contain randomly drawn shapes and colors
        this.canvasLayers = new Array(NUM_LAYERS);
        //parameters that will be fed into the drawLayer on each iteration. These will be updated each time
        //we call the drawLayer function
        const step = Math.floor(window.width / this.canvasLayers.length);
        const parameters = {
            blue: 150,
            green: 155, 
            red: 255,
            position: 0,
            step: step
        }

        for (let position = 0; position < this.canvasLayers.length; position++) {
            parameters.position = position;
            this.drawLayer(canvas, ctx, parameters);
        }

        this.drawClouds(canvas, ctx);
        this.drawSun(canvas, ctx);
        //save and render our painting as an image
        const savedBackground = new Image();
        savedBackground.src = canvas.toDataURL('image/png');

    }
    
    drawSun(canvas, ctx) {
        ctx.beginPath();
        ctx.shadowColor = ctx.fillStyle = 'rgb(241,185,127)';
        ctx.arc(-8, -10, 100, 0, Math.PI * 2);
        ctx.shadowBlur = 55;
        ctx.fill();
        ctx.closePath();
    }

    drawClouds(canvas, ctx) {
        //loop through drawing onto the canvas different rectangular clouds
        for (let i = 0; i < 35; i++) {
            const x = Math.random() * window.innerWidth;
            const y = 15 + (Math.random() * 50);
            //start a new drawing
            ctx.beginPath()
            const height = Math.random() * 30;
            //don't want the cloud to be taller than it's wide
            const width = 30 + Math.random() * 70;
            ctx.fillStyle = 'white';
            ctx.shadowBlur = 35;
            //elements which are closer to the sun (have a smaller x-coordinate) should a greaterOffset, i.e. light illuminating
            //the cloud should be brighter
            const howCloseToSun = ((window.innerWidth - x) / window.innerWidth)
            ctx.shadowOffsetY = howCloseToSun * 40;
            ctx.shadowOffsetX = howCloseToSun * 10; 
            ctx.shadowColor = 'black';
            //draw the rectangle onto the canvas
            ctx.fillRect(x, y, width, height);
            ctx.closePath();
        }
    }

    //wrapper method to call render after a new painting has been made
    redraw() {
        this.createBackground();
        this.render();
    }

    create() {
        return html`<div class="container">
            <canvas id="background"></canvas>
            <button onclick=${() => this.redraw()}>Draw</button>
        </div>`
    }
}


class App extends Component {
    init() {
        this.painting = new Painting();
    }


    create() {
        return html`<main>
            ${this.painting.node}
            <footer>Built with <a href="https://github.com/amirgamil/poseidon">Poseidon</a> by <a href="https://amirbolous.com/">Amir</a>
            inspired by <a href="https://github.com/JustGoscha/skyline">skyline</a></footer>
        </main>`
    }
}

const app = new App();
document.body.appendChild(app.node);