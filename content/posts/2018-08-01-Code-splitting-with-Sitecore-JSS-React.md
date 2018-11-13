---
title: Code splitting with Sitecore JSS + React
date: 2018-08-01 08:43:31
categories: JSS
---

Page weight - how much data a user needs to download to view your website - is a big deal in JavaScript applications. The more script that an application loads, the longer it takes to render for a user - especially in critical mobile scenarios. The longer it takes an app to render, the less happy the users of that app are. JavaScript is especially important to keep lightweight, because JS is not merely downloaded like an image - it also has to be [parsed and compiled by the browser](https://developers.google.com/web/fundamentals/performance/optimizing-content-efficiency/javascript-startup-optimization/). Especially on slower mobile devices, this parsing can take longer than the download! So less script is a very good thing.

Imagine a large Sitecore JSS application, with a large number of JavaScript components. With the default JSS applications the entire app JS must be deployed to the user when any page in the application loads. This is simple to reason about and performs well with smaller sites, but on a large site it is detrimental to performance if the home page must load 40 components that are not used on that route in order to render.

## Enter Code Splitting

[_Code Splitting_](https://webpack.js.org/guides/code-splitting/) is a term for breaking up your app's JS into several chunks, usually via [webpack](https://webpack.js.org). There are many ways that code splitting can be set up, but we'll focus on two popular automatic techniques: route-level code splitting, and component-level code splitting.

Route-level code splitting creates a JS bundle for each route in an application. Because of this, it relies on the app using _static routing_ - in other words knowing all routes in advance, and having static components on those routes. This is probably the most widespread code splitting technique, but it is fundamentally incompatible with JSS because the app's structure and layout is defined by Sitecore. We do not know all of the routes that an app has at build time, nor do we know which components are on those routes because that is also defined by Sitecore.

Component-level code splitting creates a JS bundle for each component in an application. This results in quite granular bundles, but overall excellent compatibility with JSS because it works great with dynamic routing - we only need to load the JS for the components that an author has added to a given route, and they're individually cacheable by the browser providing great caching across routes too.

## Component-level Code Splitting with React

The [react-loadable](https://github.com/jamiebuilds/react-loadable) library provides excellent component-level code splitting capabilities to React apps. Let's add it to the JSS React app and split up our components!

### Step 1: Add `react-loadable`

We need some extra npm packages to make this work.

```sh
// yarn
yarn add react-loadable
yarn add babel-plugin-syntax-dynamic-import babel-plugin-dynamic-import-node --dev

// npm
npm i react-loadable
npm i babel-plugin-syntax-dynamic-import babel-plugin-dynamic-import-node --save-dev
```

### Step 2: Make the `componentFactory` use code splitting

In order to use code splitting, we have to tell `create-react-app` (which uses `webpack`) how to split our output JS. This is pretty easy using [dynamic `import`](https://reactjs.org/docs/code-splitting.html#import), which works like a normal `import` or `require` but loads the module lazily at runtime. [react-loadable](https://github.com/jamiebuilds/react-loadable) provides a simple syntax to wrap any React component in a lazy-loading shell.

In JSS applications, the _Component Factory_ is a mapping of the names of components into the implementation of those components - for example to allow the JSS app to resolve the component named `'ContentBlock'`, provided by the Sitecore Layout Service, to a React component defined in `ContentBlock.js`. The Component Factory is a perfect place to put component-level code splitting.

In a JSS React app, the Component Factory is generated code by default - inferring the components to register based on filesystem conventions. The `/scripts/generate-component-factory.js` file defines how the code is generated. The generated code - created when a build starts - is emitted to `/src/temp/componentFactory.js`. Before we alter the code generator to generate split components, let's compare registering a component in each way:

##### JSS React standard componentFactory.js
```js
// static import
import ContentBlock from '../components/ContentBlock';

// create component map (identical code)
const components = new Map();
components.set('ContentBlock', ContentBlock);
```

##### react-loadable componentFactory.js
```jsx
import React from 'react';
import Loadable from 'react-loadable';

// loadable dynamic import component - lazily loads the component implementation when it is first used
const ContentBlock = Loadable({
  // setting webpackChunkName lets us have a nice chunk filename like ContentBlock.hash.js instead of 1.hash.js
  loader: () => import(/* webpackChunkName: "ContentBlock" */ '../components/ContentBlock'),
  // this is a react component shown while lazy loading. See the react-loadable docs for guidance on making a good one.
  loading: () => <div>Loading...</div>,
  // this module name should match the webpackChunkName that was set. This is used to determine dependency during server-side rendering.
  modules: ['ContentBlock'],
});

// create component map (identical code)
const components = new Map();
components.set('ContentBlock', ContentBlock);
```

#### Updating the Component Factory Code Generation

In order to have our component factory use splitting, let's update the code generator to emit `react-loadable` component definitions.

Modify `/scripts/generate-component-factory.js`:

```js
// add this function
function LoadableComponent(importVarName, componentFolder) {
    return `const ${importVarName} = Loadable({
    loader: () => import(/* webpackChunkName: "${componentFolder}" */ '../components/${componentFolder}'),
    loading: () => <div>Loading...</div>,
    modules: ['${componentFolder}'],
    });`;
}

// modify generateComponentFactory()...

// after const imports = [];
imports.push(`import React from 'react';`);
imports.push(`import Loadable from 'react-loadable';`);

// change imports.push(``import ${importVarName} from '../components/${componentFolder}';``); to
imports.push(LoadableComponent(importVarName, componentFolder));
```

You can find a completed [gist of these changes here](https://gist.github.com/kamsar/9a616dffdb2dc1d76772cc796d716b03). Search in it for `[CS]` to see each change in context. Don't copy the whole file, in case of future changes to the rest of the loader.

##### Try it!

Start your app up with `jss start`. At this point Code Splitting should be working: you should see a JS file get loaded for each component on a route, and a short flash of `Loading...` when the route initially loads.

But it still has some issues that could make it more usable. If the app is server-side rendered in [headless or integrated modes](https://jss.sitecore.net/docs/fundamentals/application-modes) none of the content will be present because the dynamic imports are asynchronous and have not resolved before the SSR completes. We'd also love to avoid that flash of loading text if the page was server-side rendered, too. Well guess what, we can do all of that!

### Step 3: Configure code splitting for Server-Side Rendering

Server-side rendering with code splitting is a bit more complex. There are several pieces that the app needs to support:

* Preload all lazy loaded components, so that they render immediately during server-side rendering instead of starting to load async and leaving a loading message in the SSR HTML.
* Determine which lazy loaded components were used during rendering, so that we can preload the same components' JS files on the client-side to avoid the flash of loading text.
* Emit `<script>` tags to preload the used components' JS files on the client side into the SSR HTML.

#### 3.1: Configure SSR Webpack to understand dynamic import

The build of the server-side JS bundle is separate from the client bundle. We need to teach the server-side build how to compile the dynamic import expressions. Open `/server/server.webpack.config.js`.

```js
// add these after other imports
const dynamicImport = require('babel-plugin-syntax-dynamic-import');
const dynamicImportNode = require('babel-plugin-dynamic-import-node');
const loadableBabel = require('react-loadable/babel');

// add the plugins to your babel-loader section
//...
use: {
  loader: 'babel-loader',
  options: {
  babelrc: false,
  presets: [env, stage0, reactApp],
  // [CS] ADDED FOR CODE SPLITTING
  plugins: [dynamicImport, dynamicImportNode, loadableBabel],
},
```

You can find a completed [gist of these changes here](https://gist.github.com/kamsar/016b591148325d7de9260042d8113286). Search in it for `[CS]` to see each change in context. Don't copy the whole file, in case of future changes to the rest of the webpack config.

#### 3.2: Configure server.js

The `/server/server.js` is the entry point to the JSS React app when it's rendered on the server-side. We need to teach this entry point how to successfully execute SSR with lazy loaded components, and to emit preload script tags for used components.

```js
// add to the top
import Loadable from 'react-loadable';
import manifest from '../build/asset-manifest.json';

function convertLoadableModulesToScripts(usedModules) {
  return Object.keys(manifest)
    .filter((chunkName) => usedModules.indexOf(chunkName.replace('.js', '')) > -1)
    .map((k) => `<script src="${manifest[k]}"></script>`)
    .join('');
}

// add after const graphQLClient...
const loadableModules = [];

// add after initializei18n()...
.then(() => Loadable.preloadAll())

// wrap the `<AppRoot>` component with the loadable used-component-capture component
<Loadable.Capture report={(module) => loadableModules.push(module)}>
  <AppRoot path={path} Router={StaticRouter} graphQLClient={graphQLClient} />
</Loadable.Capture>

// append another .replace() to the rendered HTML transformations
.replace('<script>', `${convertLoadableModulesToScripts(loadableModules)}<script>`);
```

You can find a completed [gist of these changes here](https://gist.github.com/kamsar/29370b58f7a4fb15bed74521e01ad6bc) **with better explanatory comments**. Search in it for `[CS]` to see each change in context. Don't copy the whole file, in case of future changes to the rest of the entry point.

#### 3.3: Configure client-side index.js

The `/src/index.js` is the entry point to the JSS React app when it's rendered on the browser-side. We need to teach this entry point how to wait to ensure that all preloaded components that SSR may have emitted to the page are done loading before we render the JSS app the first time to avoid a flash of loading text.

```js
// add to the top
import Loadable from 'react-loadable';

// add after i18ninit()
.then(() => Loadable.preloadReady())
```

You can find a completed [gist of these changes here](https://gist.github.com/kamsar/ecbc0a50fdb877eb598ef9c3a385aff9). Search in it for `[CS]` to see each change in context. Don't copy the whole file, in case of future changes to the rest of the entry point.

### Step 4: Try it out

With the code changes to enable splitting complete, deploy your app to Sitecore and try it in integrated mode. You should see the SSR HTML include a script tag for every component used on the route, and the rendering will wait until the components have preloaded before showing the application. This preloading means the browser does not have to wait for React to boot up before beginning load of the components, resulting in a much faster page load time.

{% asset_img ssr-trace.png %}

The ideal component loading technique for each app will be different depending on the number and size of each component. Using the standard JSS styleguide sample app, enabling component code-splitting like this resulted in transferring almost 40k less data when loading the home page (which has a single component) vs the styleguide page (which has many components). This difference increases with the total number of components in a JSS app - but for most apps, code splitting is a smart idea if the app has many components that are used on only a few pages.

## Sources

* [Upgrading a create-react-app project to a SSR + code splitting setup](https://medium.com/bucharestjs/upgrading-a-create-react-app-project-to-a-ssr-code-splitting-setup-9da57df2040a)
* [Code Splitting in Create React App](https://serverless-stack.com/chapters/code-splitting-in-create-react-app.html)
* [react-loadable](https://github.com/jamiebuilds/react-loadable)
* [Webpack Code Splitting Guide](https://webpack.js.org/guides/code-splitting/)
