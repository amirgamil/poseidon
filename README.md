# Poseidon  🔱
## Intro
Poseidon is, to use a nice description by Reef, an anti-framework. It's a a no-dependency, component-based Javascript framework for rendering UI on the web. It aims at being lightweight, fast, and intuitive (i.e. easy to use) for building static and dynamic apps without compromising on .....

To allow for a declarative, event-driven framework through which we interact with the UI, Poseidon distinguishes between UI that gets rendered and data that powers the UI. Whenever changes are made to the data, an event is fired or emitted to update the UI, and whenever an update is made to the UI to change data, an event is fired to update the store in the database. We do this by binding data to event handelers. This allows us to encapsulate logic needed to update data when changes are made so that making changes to the UI is simple.

In this way, Poseidon makes it very easy to both distinguish, maintain, and interface the data that powers applications with the UI that gets rendered accordingly. 

Takes from Backbone's and Torus's model-view flavor

### Goals
- Connecting to data sources should be easy, focus on the UI rendering bit
- More low, level, interface with the DOM
- Markup language via template literals, don't want to use JSX since this would require a build stage (i.e. to compile the JSX Javascript) and we don't want to deal with dependencies or configs
    a. Should be able to drop this as a script tag and start developing instantly 
- 


### Notes
1. Define unit of UI component via component class
2. UI should interface with data models to consume and update data (via lists and other things)
3. UI design should be declarative
4. Bind data or things that change within that component, keep virtual DOM to monitor changes 
    a. Diffing algorithm to figure out what's changed and render it accordingly

