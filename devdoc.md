**This is a development doc that explains code nuances and organization of this project.**

Overview
-----

Frontend is divided to three parts: tree, query, and summary. Respective files are listed under `app/feature/`. We factor out communication to backend to `service` folder, and re-usable component in `component` folder. The `actionHandler` folder also contains files for each of these three parts.

The main technologies used are _React_, _D3_ and _mobx_. Only the tree and the pie chart are drawn using D3 and they are contained in a react component. The rest of documentation is broken up into features.

Querying explained:
---- 
We exemplify logic and structure through cases.

E.g. User typed domain name and clicked "GO"

1. User click is handled by `onClick` directive in react component in `QueryBoxContainer.js`
1. an action with type `QUERY_SUBMITTED` is dispatched from `QueryBoxContainer.js`
2. `AppDispatcher` dispatches the action to all registered handlers, as initialized in `App.js`
3. `QueryBoxActionHandler.js` decides to respond to the event by calling `handleQuerySubmitted`
4. `QueryBoxStore` contains the current application state and is used to retrieve relevant info. The result is processed then submitted to the server via a call to `queryService.queryDomains` 
5. `TreeStore` and `SummaryStore` are modified by calling methods marked by `@action` decorator: this will tell mobx framework to check all `@observable` properties in those store classes, then automatically update any related component.

Tree
------
* `TreeContainer.js` contains buttons and and the main tree
* `TreeOfLife.js` is a React component wrapper for D3 tree drawing
* Tree update: Whenever `TreeStore` is modified, the `autorun()` function inside `TreeOfLife.js` is run to trigger D3's re-rendering. 

Example: user clicks on an internal node in tree

1. since click events on D3 drawn tree are handled by D3, we need to pre-register event handler callbacks to `TreeDrawer.js`. This is achieved by calling `treeDrawer.bindEvent` in `TreeOfLife`. 
2. After user's click, callbacks in `TreeOfLife` are called, and actions are dispatched using `AppDispatcher`
3. `TreeActionHandler` handles the action, and a `nodeDetail` object is created inside `TreeStore` by calling `setNodeDetail`
4. This mutates `TreeStore` and UI inside `TreeContainer` will be automatically updated. In particular, since `treeStore.nodeDetail` is not null, `NodeDetailContainer` will be rendered out, resulting a pop up box.

TreeStore
------
In tree store, we maintain several application states:

- `masterTree`: a tree object; although appearing as a method, this is used as a property, see mobx `@computed` documentation.
- `displayRoot`: also a tree object, but unlike `masterTree`, it does not contain the entire tree, nodes that are not displayed on screen are removed.
- `displayRoot` vs `masterTree`: In rendering UI, we some times wish to modify how a tree is displayed (e.g. modify branch length, remove certain nodes) but we should also keep an intact, master copy of tree if it were to be reset. Hence `displayRoot` concerns only the partial tree shown on screen, and `masterTree` is a master copy and should never be changed.
- `currentDisplayLevel` indicates the current tree viewing resolution. e.g. phylum, genus

