# Poseidon  🔱
![poseidon-npm](https://img.shields.io/npm/v/poseidon-ui-framework.svg)
![gzip-size](https://img.badgesize.io/https:/unpkg.com/poseidon-ui-framework/dist/bundle.js?compression=gzip)
![npm-install-size](https://packagephobia.com/badge?p=poseidon-ui-framework)
### Intro
Poseidon is, to use a nice description by [Reef](https://reefjs.com/), an anti-framework. It's a a no-dependency, component-based, and lightweight Javascript framework for rendering UI on the web. It aims at being lightweight, fast, and intuitive (i.e. easy to use) for building static and dynamic apps without compromising on performance and core features.

Currently testing it building a bunch of cool stuff - will clean up everything and add detailed documentation soon...

Some websites in production that use Poseidon:
- [Conway's game of life](https://gameoflifeposeidon.surge.sh/)
- [Welkin](https://welkin.surge.sh/)
- [Zeus](https://zeus.amirbolous.com/)
- [Apollo](http://apollo.amirbolous.com/)
- [Mercury](https://mymercury.surge.sh/)

Principles of least power - aims at offering as many of the rich features provided by frameworks like React and Bacbone while reducing as much as possible the overheads or levels of abstractions one needs to traverse in order to build cool stuff using the tool. In other words, if you can grasp a handful of small patterns that frequently crop-up, you can build really powerful tools. 

To allow for a declarative, event-driven framework through which we interact with the UI, Poseidon distinguishes between UI that gets rendered and data that powers the UI. This takes a similar flavor to the model-view approach adopted by Backbone and more generally, the model-view-controller pattern. This allows us to encapsulate logic needed to update data when changes are made, so that we can decompose the changing data from the reusable DOM elements of the UI that should reflect those changes. 

Concretely, this means that Poseidon provides a layer that interfaces with the UI in the forms of CollectionStores. 

In this way, Poseidon makes it very easy to both distinguish, maintain, and interface the data that powers applications with the UI that gets rendered accordingly. 

Takes from Backbone's model-view flavor and Torus's approach with evented data stores.

### Focuses
- Declarative UI framework
- Data systems and connecting to data models (e.g. in Backbone, Polymer, Torus)
- Events

### Patterns
Things to keep in mind and take advantage of when building applications. Collection of patterns that will crop up frequently - can use to build very powerful apps.
1. Using stores as the middle man between databases and rendering to the UI
2. Poseidon is *binding explicit*. In frameworks like React, a change in state will automatically trigger a re-render (the exact specifics of which can be controlled in `shouldComponentUpdate`). In Poseidon, we `bind` any data when we want a change to its state to trigger a callback function like a re-render.
    - In components, this means we bind atomic data or data sources when initializing a component to trigger a re-render when it changes (similar to useState or hooks in React)
3. Binding data to components should be done as the last thing when initializing components
    (why - binding calls handler first time, would change reference to this)
4. Taking advantage of lists composed from custom data structures using an atom
    - Allows you to define the UI (i.e. the DOM element) for a single item once, and render it for a list of items
5. Connecting lists with data sources to load their content from databases
6. Self-managing components - state stored and acted on locally. Allows you to easily compose different components without 
central stores or state becoming too clunky and unmanageable (some common complaints with Redux for example)
    - This means when loading lists, each component element of the list has access to its atomic data and a callback to remove the data from the store
    - That way, the component is self-managing since data can be added or removed from itself
7. Setting up data you want to access when rendering the UI by setting `this.data = ...` in the `init` of a component
8. Pure components and container components 
    - Container: interact directly with the store, have side-effects (e.g. List component)
    - Pure: mostly pure components, given same state will render the same UI
9. If you're using a router, two common approaches
    - If you have different pages that correspond to different components, have a simple switch statement on the current route
    when composing the UI in `create` and return the node of the corresponding component accordingly
    - If the component is largely similar and you only want to "toggle" certain parts of the UI or off, conditionals or ternary expressions directly within `create` are more convenients like
    ```${shouldLoad ? html`<h1>Unlocked!</h1>` : html`<h1>Locked :( </h1>`}```
    (if you want to map samle handler to different paths, do `['path1', 'path2'].forEach(path => router.on(path, handler)))`
10. Passing relevant bits of data to the handler if applicable so that components can make user of parameters/data 
11. Passing a remove call back (which is just a function in the higher component that handles removing it and updating state accordingly) from a higher order component if you want to be able to remove a current component

### Cool Features
1. Self-managing components
2. Easy to use client-side router
3. 0 dependencies! 
4. Component-specific styles, even if defined in general terms, will only affect those that exist in the current component! (component-specific styles should always be at the top of the css template literal)
    - Supports arbitrary nesting, pseudoelements, pseudoselectors, media/keyframes, and conditional rendering based on ternary conditions or state!
5. Can add JS expression in component-styles since Poseidon uses a custom css-like markup language!
6. JSX-like markup language so does not sacrifice the declarative feel of JSX react or raw HTML when building components
7. Fast virtual DOM with an in-house reconciliation algorithm

### Differences to Torus
1. Urgonomics of bindings, inferred to be implicit if none provided. Similar idea with defining data sources, bindings and definitions.
2. Directly control data passed to the `create` call in the init of a component by setting `this.data` when initializing a component (in `init`), does not to be called elsewhere 
    - Lends itself nicely to composition of components and some of the common patterns that come up in React 
3. Lists automatically sync changes from data source - don't need to bind a component to a data source but can provide 
custom functionality with a handler if necessary
4. Router kept separate from evented model, map route(s) directly to event handlers similar to `Express` or `gomux`


### Ideas to extend
1. Better support for interacting w. external sources like MongoDB, Airtable, etc. 
2. Define more complex events with Listening - give tools to create more events which can be listened to (kind of like in Backbone)


### Goals
- Connecting to data sources should be easy, focus on the UI rendering bit
- More low, level, interface with the DOM
- Markup language via template literals - runtime version of jsx (written in Javascript) similar to Torus, don't want to use JSX since this would require a build stage (i.e. to compile the JSX to Javascript) and we don't want to deal with dependencies or configs
    a. Should be able to drop this as a script tag and start developing instantly 

### Notes
1. Define unit of UI component via component class
2. UI should interface with data models to consume and update data (via lists and other things)
3. UI design should be declarative
4. Bind data or things that change within that component, keep virtual DOM to monitor changes 
    a. Diffing algorithm to figure out what's changed and render it accordingly


### Things I forget that may need to change
1. Regenerating styles when state changes - (how, not sure?), Styles bug where you initialize component with styles AFTER stylesheet has been generated?  
2. Pass collection data source into a list (and optional callback to)
call when items need to change
3. setStore for collection data source should pass in Atomic data
4. Make update for atom more versatile - what if you want to update a specific index of a property?
5. Add key-based reconciliation for list items?
