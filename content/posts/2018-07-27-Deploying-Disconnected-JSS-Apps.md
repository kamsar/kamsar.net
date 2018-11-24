---
title: Deploying Disconnected JSS Apps
date: 2018-07-27 08:16:07
categories: JSS
---

It's possible to deploy server-side rendered [Sitecore JSS](https://jss.sitecore.net) sites in [disconnected mode](https://jss.sitecore.net/docs/fundamentals/application-modes). When deployed this way, the JSS app will run using disconnected layout and content data, and will not use a Sitecore backend.

## Why would I want this?

In a word, _previewing_. Imagine during early development and prototyping of a JSS implementation. There's a team of designers, UX architects, and frontend developers who are designing the app and its interactions. In most cases, Sitecore developers may not be involved yet - or if they are involved, there is no Sitecore instance set up.

This is one of the major advantages of JSS - using disconnected mode, a team like this can develop non-throwaway frontend for the final JSS app. But stakeholders will want to review the in-progress JSS app somewhere other than `http://localhost:3001`, so how do we put a JSS site somewhere shared without having a Sitecore backend?

> Wondering about real-world usage?
> The [JSS docs](https://jss.sitecore.net) use this technique.

## How does it work?

Running a disconnected JSS app is a lot like [headless mode](https://jss.sitecore.net/docs/fundamentals/application-modes): a reverse proxy is set up that proxies incoming requests to Layout Service, then transforms the result of the LS call into HTML using JS server-side rendering and returns it. In the case of disconnected deployment instead of the proxy sending requests to the Sitecore hosted Layout Service, the requests are proxied to the disconnected layout service.

## Setting up a disconnected app step by step

To deploy a disconnected app you'll need a Node-compatible host. This is easiest with something like Heroku or another PaaS Node host, but it can also be done on any machine that can run Node. For our example, we'll use [Heroku](https://www.heroku.com).

### Configuring the app for disconnected deployment

Any of the JSS sample templates will work for this technique. [Create yourself a JSS app with the CLI in 5 minutes](https://jss.sitecore.net/docs/getting-started/quick-start) if you need one to try.

1. Ensure the app has no `scjssconfig.json` in the root. This will make the build use the local layout service.
1. Create a build of the JSS app with `jss build`. This will build the artifacts that the app needs to run.
1. Install npm packages necessary to host a disconnected server: `yarn add @sitecore-jss/sitecore-jss-proxy express` (substitute `npm i --save` if you use npm instead of yarn)
1. Deploy the following code to `/scripts/disconnected-ssr.js` (or similar path). Note: this code is set up for React, and will require minor tweaks for Angular or Vue samples (`build` -> `dist`)
    ```jsx
    const express = require('express');
    const { appName, language, sitecoreDistPath } = require('../package.json').config;
    const scProxy = require('@sitecore-jss/sitecore-jss-proxy').default;
    const { createDefaultDisconnectedServer } = require('@sitecore-jss/sitecore-jss-dev-tools');
    const app = require('../build/server.bundle');

    const server = express();

    // the port the disconnected app will run on
    // Node hosts usually pass a port to run on using a CLI argument
    const port = process.argv[2] || 8080;

    // create a JSS disconnected-mode server
    createDefaultDisconnectedServer({
      port,
      appRoot: __dirname,
      appName,
      language,
      server,
      afterMiddlewareRegistered: (expressInstance) => {
        // to make disconnected SSR work, we need to add additional middleware (beyond mock layout service) to handle
        // local static build artifacts, and to handle SSR by loopback proxying to the disconnected
        // layout service on the same express server

        // Serve static app assets from local /build folder into the sitecoreDistPath setting
        // Note: for Angular and Vue samples, change /build to /dist to match where they emit build artifacts
        expressInstance.use(
          sitecoreDistPath,
          express.static('build', {
            fallthrough: false, // force 404 for unknown assets under /dist
          })
        );

        const ssrProxyConfig = {
          // api host = self, because this server hosts the disconnected layout service
          apiHost: `http://localhost:${port}`,
          layoutServiceRoute: '/sitecore/api/layout/render/jss',
          apiKey: 'NA',
          pathRewriteExcludeRoutes: ['/dist', '/build', '/assets', '/sitecore/api', '/api'],
          debug: false,
          maxResponseSizeBytes: 10 * 1024 * 1024,
          proxyOptions: {
            headers: {
              'Cache-Control': 'no-cache',
            },
          },
        };

        // For any other requests, we render app routes server-side and return them
        expressInstance.use('*', scProxy(app.renderView, ssrProxyConfig, app.parseRouteUrl));
      },
    });
    ```
1. Test it out. From a console in the app root, run `node ./scripts/disconnected-ssr.js`. Then in a browser, open `http://localhost:8080` to see it in action!

### Deploying the disconnected app to Heroku

Heroku is a very easy to use PaaS Node host, but you can also deploy to Azure App Service or any other service that can host Node. To get started, sign up for a Heroku account and install and configure the [Heroku CLI](https://devcenter.heroku.com/articles/heroku-cli).

1. We need to tell Heroku to build our app when it's deployed.
    * Locate the `scripts` section in the `package.json`
    * Add the following script:
    ```
    "postinstall": "npm run build"`
    ```
1. We need to tell Heroku the command to use to start our app.
    * Create a file in the app root called `Procfile`
    * Place the following contents:
    ```
    web: node ./scripts/disconnected-ssr.js $PORT
    ```
1. To deploy to Heroku, we'll use Git. Heroku provides us a Git remote that we can push to that will deploy our app. To use Git, we need to make our app a Git repository:
    ```
    git init
    git add -A
    git commit -m "Initial commit"
    ```
1. Create the Heroku app. This will create the app in Heroku and configure the Git remote to deploy to it. Using a console in your app root:
    ```
    heroku create <your-heroku-app-name>
    ```
1. Configure Heroku to install node `devDependencies` (which we need to start the app in disconnected mode). Run the following command:
    ```
    heroku config:set NPM_CONFIG_PRODUCTION=false YARN_PRODUCTION=false
    ```
1. Deploy the JSS app to Heroku:
```
git push -u heroku master
```
1. Your JSS app should be running at `https://<yourappname>.herokuapp.com`!

> In case it's not obvious, do not use this setup in production. The JSS disconnected server is not designed to handle heavy production load.
