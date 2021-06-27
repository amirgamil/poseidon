
//helpful constants to represent complete/incomplete in a Todo
const COMPLETE = 1;
const INCOMPLETE = 0;

//consists of a note and status (completed or note)
class Todo extends Atom {

}

class TodoDataSource extends CollectionStoreOf(Todo) {

}


class TodoComponent extends Component {
    init(data, removeCallBack) {
        //`this.data` is a reserved atrtibute for passing data into the create method which we can use 
        //to render things accordingly
        this.data = data; 
        //save the callback passed in to remove an item so we can access it in our relevant method later
        //note that each ToDo handles its own state. This is by design, components are responsible for maintaing, updating, and removing
        //their own state.
        this.removeCallBack = removeCallBack;
        //don't forget to bind any internal methods so we have access to the correct this
        this.deleteTodo = this.deleteTodo.bind(this);
        this.editing = false;
        this.toggle = this.toggle.bind(this);
        //we bind data to let Poseidon know that it should trigger a re-render whenever state is changed
        //`this.bind` takes an optional callback function which will get called whenever state of the atomic data changes
        //if no callback is provided, it will assume we only want to re-render and call this.render()
        //note if you add your own callback function, don't forget to call `this.render()` so that the UI updates to 
        //reflect any changes in state
        this.bind(data);

    }

    deleteTodo(evt) {
        //use the remove
        this.removeCallBack(this.data);
    }

    toggle(evt) {
        //we update atomic data by passing in a dictionary with keys mapping to the new values 
        //we want to update in the atom
        this.data.update({status: evt.target.checked});
        //note we don't need to call a render method since recall we bind the data which will automatically trigger
        //a re-render when the data changes
    }

    create({note, status}) {
        //generate a unique id that will be used for our input and label
        const id = Date.now();
        return html`<div class="todo">
            <input type="checkbox" id=${id} name="todoItem" checked=${status} onclick=${this.toggle}/>
            <label for=${id}>${status ? html`<strike>${note}</strike>` : note}</label>
            <button onclick=${this.deleteTodo}>Delete</button> 
        </div>`
    }
}

class TodoList extends ListOf(TodoComponent) {
    create() {
        return html`<div class="todoList">
            ${this.nodes}
        </div>`
    }
}


class App extends Component {
    init() {
        //initalize stuff here
        //initalize our data source and our list
        this.dataSource = new TodoDataSource([{
            note: "Get groceries",
            status: INCOMPLETE 
        }, {
            note: "Finish hw",
            status: COMPLETE 
        }]);
        this.current = "";
        //again don't forget to bind the method to the current reference to this (note is is a Javascript internal function)
        //which returns the same method with this bound to whatever we're currently referencing
        //TODO: why does adding this stuff below this.bind cause problems
        this.addTodo = this.addTodo.bind(this);
        this.handleInput = this.handleInput.bind(this);
        //initalize a new list passing in our data store and a callback to remove an item
        //any collection source natively implements remove which we take advantage of here
        this.listTodos = new TodoList(this.dataSource, item => this.dataSource.remove(item));
        //we bind our data source so whenever a change is made, the UI gets updated to reflect it
        this.bind(this.dataSource);
    }

    handleInput(evt) {
        //update the curernt todo list value with changes made when a user has typed something
        this.current = evt.target.value;
        //trigger a re-render so that Poseidon displays the new value
        this.render();
    }

    //method to add a new Todo when a user enters one
    addTodo(evt) {
        this.dataSource.add(new Todo({note: this.current, status: INCOMPLETE}));
    }

    create() {
        return html`<main>
            <div class="todoEntry">
                <input value=${this.current} oninput=${this.handleInput} placeholder="Enter a new Todo!" />
                <button onclick=${this.addTodo}>+</button>
            </div>
            ${this.listTodos.node}
            <footer>Built with <a href="https://github.com/amirgamil/poseidon">Poseidon</a> by <a href="https://amirbolous.com/">Amir</a></footer>
        </main>` 
    }
}

const app = new App();
document.body.appendChild(app.node);