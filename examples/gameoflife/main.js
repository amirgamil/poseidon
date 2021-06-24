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



const randomWindowX = () => {
    return Math.random() * window.innerWidth - SQUARELENGTH;
}
const randomWindowY = () => {
    //save space for footer
    return Math.random() * window.innerHeight - 35;
}

//initial number of particles in the simulation
const INITIAL_NUM = 200;
//set width/height of a square to a fixed 10px
const SQUARELENGTH = 10;

//helper method to check whether a neighboring cell is in bounds
const isInBounds = (x, y, maxRows, maxCols) => {
    if (x < 0 || y < 0 || x >= maxRows || y >= maxCols) {
        return false;
    }
    return true;
}

//helper method to check the number of adjacent cells that are alive 
const numAdjAlive = (row, col, grid, map, neighbors) => {
    var count = 0;
    const nextSteps = [[-1, -1], [-1, 0], [-1, 1], [0, -1], [0, 1], [1, -1], [1, 0], [1, 1]];
    console.log(neighbors);
    for (let next of neighbors) {
        const adjCell = map.get(next[0].toString() + "," + next[1].toString());
        //recall an adjacent cell may not have been initialized yet in which case it's still dead naturally
        count += adjCell ? adjCell[2] : 0; 
    }
    return count;
}

//board contains all of the cells 
class Board extends Component {
    init() {
        //2D array represent list of all possible grid positions
        this.grid = []
        //loop through intervals of `SQUARELENGTH` for each of the rows
        //memoize neighbors for optimization
        this.neighbors = new Map()
        const maxRows = Math.floor((window.innerWidth - SQUARELENGTH) / SQUARELENGTH);
        const maxCols= Math.floor((window.innerHeight- SQUARELENGTH) / SQUARELENGTH);
        const nextSteps = [[-1, -1], [-1, 0], [-1, 1], [0, -1], [0, 1], [1, -1], [1, 0], [1, 1]];
        for (let i = 0; i < window.innerWidth - SQUARELENGTH; i += SQUARELENGTH) {
            const rowI = []
            for (let j = 0; j < window.innerHeight - 35; j += SQUARELENGTH) {
                rowI.push(j);
                const adj =  [];
                //get neighbors and add them
                for (let next of nextSteps) {
                    let nextX = i + next[0];
                    let nextY = j + next[1];
                    if (isInBounds(nextX, nextY, maxRows, maxCols)) {
                        adj.push([nextX, nextY]);
                    } 
                }
                this.neighbors.set(this.grid.length.toString() + "," + j.toString(), adj);
            }
            //append entire row to grid
            this.grid.push(rowI);
        }


        //store the entire list of particles as an array 
        //store lists as arrays of [xPos, yPos, state] where state = 1 indicates alive and state = 0 indicates dead
        //note xPos, yPos are the actual pixel values on the screen
        this.cells = [];
        //keep map of string <row, col> to cooresponding [xPos, yPos, isAlive]
        this.mapGridToState = new Map();
        //initial set up of particles
        for (let i = 0; i < INITIAL_NUM; i++) {
            //randomly selecting a specific cell is equivalent of randomly selecting an entry from our grid
            const row = Math.floor(Math.random() * this.grid.length);
            const xPos = SQUARELENGTH * row;
            const yPos = Math.floor(Math.random() * this.grid[0].length);
            //(xPos, yPos) defines the upper left-hand corner of a cell
            const cell = [xPos, this.grid[row][yPos], 1];
            this.cells.push(cell);
            this.mapGridToState.set(xPos.toString() + "," + yPos.toString(), cell); 
        }
    } 
    //represents a step to compute the next frame of the simulation 
    step() {

        //check 3 rules
        //1. Any live cell with two or three neighbors survives
        //2. Any dead cell with three live neighbors becomes a live cell
        //3. All other live cells die in the next generation
        const newCells = []
        for (let row = 0; row < this.grid.length; row++) {
            for (let col = 0; col < this.grid[0].length; col++) {
                //recall values in this.grid [x, y] consist of 0-indexed rows and SQUARELENGTH * 0-indexedcols 
                const yCol = SQUARELENGTH * col;
                const key =  row.toString() + "," + yCol.toString();
                const cell = this.mapGridToState.get(key);
                const numAdjacentAlive = numAdjAlive(row, col, this.grid, this.mapGridToState, this.neighbors.get(key));
                console.log(numAdjacentAlive);
                if (cell) {
                    //if two or more neighbors are alive, the cell lives on, otherwise it should die
                    cell[2] = Number(numAdjacentAlive === 2 || numAdjacentAlive === 3);
                    if (cell[2]) newCells.push(cell);
                } else {
                    if (numAdjacentAlive === 3) {
                        //dead cell becomes alive
                        //note we multiply row by squarelength since recall we appended multiples of squarelength in column
                        //but rows are 0-indexed
                        const newCell = [SQUARELENGTH * row, col, 1];
                        //set new cell in map and append it to our display cells
                        this.mapGridToState.set([row, col], newCell);
                        newCells.push(newCell);
                    }
                }
            }
        }
        this.cells = newCells;
        console.log(this.cells);
    }
}

//component represents the full game of life simulation
class BoardSimulation extends Component {
    init() {
        this.boardSystem = new Board();
        //timestamp of last step call
        let lastTime = 0; 
        const step = (currentTime) => {
            if (!lastTime || currentTime - lastTime > 5000) {
                //only update state every 300ms
                this.boardSystem.step();
                console.log(this.boardSystem.cells);
                this.render();
                lastTime = currentTime;
            }
            window.requestAnimationFrame(step);
        };
        // step();
        setTimeout(() => {
            this.boardSystem.step();
            console.log(this.boardSystem.cells);
            this.render();
        }, 5000);
        //eventually add controls to set parameters in the simulation
    }

    create() {
        return html`<div class = "simulation">
            ${this.boardSystem.cells.map(cell => Cell(cell))}
        </div>`
    }
}

class App extends Component {
    init() {
        this.boardSimulation= new BoardSimulation();
    }

    create() {
        return html`<main>
            ${this.boardSimulation.node}
            <footer>Built with <a href="https://github.com/amirgamil/poseidon">Poseidon</a> by <a href="https://amirbolous.com/">Amir</a></footer>
        </main>` 
    }
}

const app = new App();
document.body.appendChild(app.node);