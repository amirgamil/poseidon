const browserEnv = require("browser-env");
const {
    Component,
    List,
    Atom,
    ListOf,
    CollectionStore, 
    CollectionStoreOf,
} = require("../src/poseidon.js");

class Meal extends Atom {
    get type() {
        return Meal;
    }
}

class Birthday extends Atom {
    get comparator() {
        return this.get("year");
    }

    get type() {
        return Birthday;
    }
}

const test = require('ava');
// Create document global var
browserEnv(["document"]);

//Stores
test('iterating', t => {
    //test we can iterate over stores directly
    const breakfast = new Meal({plate: "eggs", drink: "milk"});
    const lunch = new Meal({plate: "something", drink: "something else"});
    const dataStore = new CollectionStore([breakfast, lunch]);
    let meals = dataStore.data.values();
    for (let meal of dataStore) {
        t.is(meal, meals.next().value);
    }
});


test('definition', t => {
    //test we can define a store by passing uninitalized atoms with a reference to the Atom class and let Poseidon handle the creation
    const breakfast = {plate: "eggs", drink: "milk"};
    const lunch = {plate: "something", drink: "something else"};
    const dataStore = new CollectionStore([breakfast, lunch], Meal);
    const newStore = new CollectionStore([new Meal(breakfast), new Meal(lunch)]);
    const storeIterator = dataStore.data.values();
    const newStoreIterator = newStore.data.values();
    let curr = storeIterator.next()
    while (!curr.done) {
        t.deepEqual(curr.value, newStoreIterator.next().value);
        curr = storeIterator.next(); 
    }
});


test('sorting', t => {
    const date1 = new Birthday({year: 1995});
    const date2 = new Birthday({year: 1963});
    const date3 = new Birthday({year: 2010});
    const date4 = new Birthday({year: 2001});
    const date5 = new Birthday({year: 2021});
    const dateStore = new CollectionStore([date1, date2, date3, date4, date5]);
    t.deepEqual(dateStore.serialize(), JSON.stringify([date2, date1, date4, date3, date5]));
})



test('addremove', t => {
    const date1 = new Birthday(1995);
    const date2 = new Birthday(1963);
    const dataStore = new CollectionStore();
    const firstTruth = new CollectionStore([date1, date2]);
    dataStore.add(date1);
    //check that Poseidon inferred correct type
    t.is(dataStore.atomClass, Birthday);
    dataStore.add(date2);
    t.deepEqual(dataStore, firstTruth);
    dataStore.remove(date1); 
    const secondTruth = new CollectionStore([date2])
    t.deepEqual(dataStore, secondTruth);
})



//Lists
class FormData extends Atom {
    get type() {
        return FormData;
    }
}

class FormItem extends Component {
    init(data){
        this.data = data;
        this.handleFirstInput = this.handleFirstInput.bind(this);
        this.bind(this.data);
    }

    handleFirstInput(evt) {
        this.data.update({first:evt.target.value});
    }

    create({first}){
        return {tag: "div",
        children: [
          {tag: "p",
           children: [
               {tag: "TEXT_ELEMENT",
                nodeValue: first}
           ]}
        ]}; 
    }
}

class FormList extends ListOf(FormItem) {
    create() {
        return {tag: "div",
                children : this.nodes} 
                   
    }
}

class FormDataStore extends CollectionStoreOf(FormData) {

}

class Form extends Component {
    init() {
        const test1 = new FormData({first: "hello"});
        const test2 = new FormData({first: "hi"});
        const test3 = new FormData({first: "what's up"})
        this.store = new FormDataStore([test1, test2, test3]);
        this.list = new FormList(this.store, data => this.store.remove(data));
        // this.bind(this.data);
    }

    create() {
         return {tag: "div",
                 children: [
                    {tag: "h2",
                    children: [
                       {tag: "TEXT_ELEMENT",
                        nodeValue: "Store"}
                    ],
                    attributes: {style: "color:green;"}},
                    this.list.node
                 ]}
    }

}

test('displayList', t => {
    const app = new Form();
    document.body.appendChild(app.node); 
    //initial load
    t.is(document.body.innerHTML, `<div><h2 style="color: green;">Store</h2><div><div><p>hello</p></div><div><p>hi</p></div><div><p>what's up</p></div></div></div>`);
});



