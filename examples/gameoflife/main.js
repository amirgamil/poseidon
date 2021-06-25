//represents a single cell in a game of life board
const Cell = (data) => {
    //Set x and y coordinate from data
    return {
        tag: 'div',
        attributes: {
            class: "cell",
            style: `transform: translate(${data[0]}px, ${data[1]}px)`    
        }
    }
}
//initial number of particles in the simulation
const INITIAL_NUM = 500;
//set width/height of a square to a fixed 10px
const SQUARELENGTH = 10;

//board contains all of the cells 
class Board extends Component {
    init(initNum = INITIAL_NUM) {
        //2D array representing the cells on the board
        this.grid = []
        //2D array representing state of each cell - alive or dead. 0 indicates dead, any non-zero value indicates alive
        //with the value indicating the age
        this.world = []
        this.table = document.createElement('table');
        this.table.className = 'world';
        //loop through intervals of `SQUARELENGTH` for each of the rows
        //add padding to account for gaps between cells so that game canvas does not stretch beyond full screen
        this.maxRows = Math.floor((window.innerHeight - 50) / (SQUARELENGTH + 4));
        this.maxCols= Math.floor((window.innerWidth- 50) / (SQUARELENGTH + 1));
        for (let i = 0; i < this.maxRows; i++) {
            this.grid[i] = [];
            this.world[i] = [];
            var line = document.createElement('tr');
            for (let j = 0; j < this.maxCols; j++) {
                var cell = document.createElement('td');
                cell.style.background = '#F0F0F0';
                cell.className = 'cell'
                cell.addEventListener("mousedown", (evt) => this.onMouseDownHandler(i, j, evt));
                cell.addEventListener("mouseup", (evt) => this.onMouseUpHandler(i, j, evt));
                cell.addEventListener("mouseover", (evt) => this.onMouseOverHandler(i, j, evt));
                //set the cell in the grid
                this.grid[i][j] = cell;
                this.world[i][j] = 0
                //register event handlers here eventually
                line.appendChild(cell);
            }
            this.table.appendChild(line);
        }

        //initial set up of particles
        for (let i = 0; i < initNum; i++) {
            //randomly selecting a specific cell is equivalent of randomly selecting an entry from our grid
            const row = Math.floor(Math.random() * this.grid.length);
            const col = Math.floor(Math.random() * this.grid[0].length);
            this.world[row][col] = 1;
            this.grid[row][col].style.background = 'black';
        }
    } 


    //helper method to check whether a neighboring cell is in bounds
    isInBounds(x, y) {
        if (x < 0 || y < 0 || x >= this.maxRows || y >= this.maxCols) {
            return false;
        }
        return true;
    }

    //helper method to check the number of adjacent cells that are alive 
    numAdjAlive(row, col) {
        var count = 0;
        const nextSteps = [[-1, -1], [-1, 0], [-1, 1], [0, -1], [0, 1], [1, -1], [1, 0], [1, 1]];
        for (let next of nextSteps) {
            const nextRow = row + next[0];
            const nextCol = col + next[1];
            if (!this.isInBounds(nextRow, nextCol)) continue;
            //recall an adjacent cell may not have been initialized yet in which case it's still dead naturally
            count += this.isAlive(nextRow, nextCol);
        }
        return count;
    }

    isAlive(row, col) {
        return this.world[row][col] ? 1 : 0; 
    }

    changeCellState(i, j) {
        if (this.world[i][j] === 1) {
            this.world[i][j] = 0;
            this.grid[i][j].style.background = '#90EE90'; 
        } else {
            this.world[i][j] = 1;
            this.grid[i][j].style.background = 'black';
        }
        this.render();
    }

    onMouseOverHandler(i, j, evt) {
        if (this.mouseDown) {
            this.changeCellState(i, j)
        }
    }

    onMouseDownHandler(i, j, evt) {
        console.log(i, j);
        this.changeCellState(i, j);
        this.mouseDown = true;
    }

    onMouseUpHandler(i, j, evt) {
        this.mouseDown = false;
    }

    //represents a step to compute the next frame of the simulation 
    step() {
        //check 3 rules
        //1. Any live cell with two or three neighbors survives
        //2. Any dead cell with three live neighbors becomes a live cell
        //3. All other live cells die in the next generation
        const copyNewWorld = [];
        for (let row = 0; row < this.grid.length; row++) {
            copyNewWorld[row] = []
            for (let col = 0; col < this.grid[0].length; col++) {
                //do stuff
                //check if is alive
                const cell = this.grid[row][col];
                const numNeighborsAlive = this.numAdjAlive(row, col); 
                if (this.isAlive(row, col)) {
                    if (numNeighborsAlive === 2 || numNeighborsAlive === 3) {
                        //increment the age of the cell
                        copyNewWorld[row][col] = 1 + this.grid[row][col];
                        cell.style.background = cell.style.background; 
                    } else {
                        copyNewWorld[row][col] = 0;
                        //change to light green color to indicate it has died
                        cell.style.background = '#90EE90';
                    }
                } else {
                    if (numNeighborsAlive === 3) {
                       cell.style.background = 'black'; 
                       copyNewWorld[row][col] = 1;
                    } else {
                        copyNewWorld[row][col] = 0;
                        // cell.style.background = '#F0F0F0';
                    } 
                    
                }
            }
        }
        this.world = copyNewWorld;
    }
}

//component represents the full game of life simulation
class BoardSimulation extends Component {
    init() {
        this.boardSystem = new Board();
        //timestamp of last step call
        let lastTime = 0; 
        this.step = () => {
            this.boardSystem.step();
            this.render();
        };

        this.run = (currentTime) => {
            if (!lastTime || currentTime - lastTime > 100) {
                // var t0 = performance.now();
                this.step();
                // var t1 = performance.now();
                // console.log("render took " + (t1 - t0) + "miliseconds");
                lastTime = currentTime;
            }
            //set ID returned by requestAnimationFrame so we can stop it in the future
            this.req = window.requestAnimationFrame(this.run);
        }
    }

    create() {
        return html`<div class = "simulation">
            ${this.boardSystem.table}
        </div>`
    }
}

class App extends Component {
    init() {
        this.boardSimulation= new BoardSimulation();
        this.setNumber = this.setNumber.bind(this);
        this.chageGameState = this.chageGameState.bind(this);
        this.running = false;
    }

    //mark this function as async since we don't know how long it will take for the user to pass in their input
    //this prevents a `hander took ___` warning 
    async setNumber(evt) {
        //remove focus from the button
        evt.target.blur();
        //pause execution until the user has entered a value
        const val = await window.prompt('Enter starting # of particles: ');
        const parsedVal = parseInt(val, 10);
        if (!isNaN(parsedVal)) {
            console.log(parsedVal);
            this.boardSimulation = new BoardSimulation(parsedVal);
            this.render();
        }
    }

    chageGameState(evt) {
        if (this.running) {
            //stop previously scheduled animation
            window.cancelAnimationFrame(this.boardSimulation.req);
            this.running = false;
            this.render();
        } else {
            //start simulation
            this.boardSimulation.run();
            this.running = true;
            this.render();
        }
    }

    create() {
        return html`<main>
            ${this.boardSimulation.node}
            <div class="displayBar">
                <button onclick = ${this.chageGameState}>${this.running ? "Stop" : "Run"}</button>
                <button onclick = ${() => this.boardSimulation.step()}>Step</button>
                <button onclick=${() => { 
                    this.boardSimulation.init();
                    this.boardSimulation.render();
                }}>Clear</button>
                <button onclick=${(evt) => this.setNumber(evt)}>Set #</button>
            </div>
            <footer>Built with <a href="https://github.com/amirgamil/poseidon">Poseidon</a> by <a href="https://amirbolous.com/">Amir</a></footer>
        </main>` 
    }
}

const app = new App();
document.body.appendChild(app.node);