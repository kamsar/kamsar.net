---
title: Routing Sitecore links with JSS
date: 2018-09-12 11:59:43
categories: JSS
---

When building a single-page app with [Sitecore JSS](https://jss.sitecore.net) and defining internal links in Sitecore content, you may notice that clicking the link in the JSS app does not act like a _single_ page app. Instead the link click causes a full page refresh to occur, because the routing library used by the app is not aware that the link emitted by JSS can be treated as a route link.

Maybe you don't want that to happen, because you like the fluidity of single-page apps or want to reduce bandwidth. Excellent! You've come to the right place.

The following examples use React, but the same architectural principles will translate well to Vue or Angular apps and the JSS field data schema is identical.

There are two places where we can receive links back from Sitecore:

## Link Fields

Sitecore supports content fields that are explicitly hyperlinks (usually _General Link_ fields, also referred to as `CommonFieldTypes.GeneralLink` in JSS disconnected data). When returned these fields contain link data (a `href`, optionally body text, CSS class, target, etc). In JSS apps, these are rendered using the `Link` component like so:

```js
import { Link } from '@sitecore-jss/sitecore-jss-react';

export default MyJSSComponent = (props) =>
    <Link field={props.fields.externalLink} />;
```

This gives us normal anchor tag output in the DOM:

```html
<a href="/path">Link Text</a>
```

But in `react-router`, a link needs to be rendered using `react-router-dom`'s `Link` component instead, for example:

```js
import { Link } from 'react-router-dom';

export default RouterLinkComponent = (props) =>
    <Link to="/path">Link Text</Link>;
```

To make JSS general links render using `react-router` links for internal links, we can create a component that conditionally chooses the link component like this:

```js
import React from 'react';
import { Link } from '@sitecore-jss/sitecore-jss-react';
// note we're aliasing the router's link component name, since it conflicts with JSS' link component
import { Link as RouterLink } from 'react-router-dom';

/** React component that turns Sitecore link values that start with / into react-router route links */
const RoutableSitecoreLink = (props) => {
  const hasValidHref = props.field && props.field.value && props.field.value.href;
  const isEditing = props.editable && props.field.editable;

  // only want to apply the routing link if not editing (if editing, need to render editable link value)
  if(hasValidHref && !isEditing) {
    const value = props.field.value;

    // determine if a link is a route or not. This logic may not be appropriate for all usages.
    if(value.href.startsWith('/')) {
      return (
        <RouterLink to={value.href} title={value.title} target={value.target} className={value.class}>
          {props.children || value.text || value.href}
        </RouterLink>
      );
    }
  }

  return <Link {...props} />;
};

// usage - drop-in replacement for JSS' Link component
export default MyJSSComponent = (props) =>
    <RoutableSitecoreLink field={props.fields.externalLink} />;
```

With this component, now your internal link values will be turned into router links and result in only a new fetch of route data instead of a page refresh!

## Rich Text Fields

Rich Text fields are a more interesting proposition because they contain free text that is placed into the DOM, and we cannot inject `RouterLink` components directly into the HTML blob. Instead we can use React's DOM access to attach an event handler to the rich text markup after it's rendered by React that will trigger route navigation.

Similar to the general link field handling, we can wrap the JSS default `RichText` component with our own component that selects whether to bind the route handling events based on whether we're editing the page or not:

```js
import React from 'react';
import ReactDOM from 'react-dom';
import { RichText } from '@sitecore-jss/sitecore-jss-react';
import { withRouter } from 'react-router-dom';

/** Binds route handling to internal links within a rich text field */
class RouteLinkedRichText extends React.Component {
  constructor(props) {
    super(props);

    this.routeHandler = this.routeHandler.bind(this);
  }

  // handler function called on click of route links
  // pushes the click into the router history thus changing the route
  // props.history comes from the react-router withRouter() higher order component.
  routeHandler(event) {
    event.preventDefault();
    this.props.history.push(event.target.pathname);
  }

  // rebinds event handlers to route links within this component
  // fired both on mount and update
  bindRouteLinks() {
    const hasText = this.props.field && this.props.field.value;
    const isEditing = this.props.editable && this.props.field.editable;

    if(hasText && !isEditing) {
      const node = ReactDOM.findDOMNode(this);
      // selects all links that start with '/' - this logic may be inappropriate for some advanced uses
      const internalLinks = node.querySelectorAll('a[href^="/"]');

      internalLinks.forEach((link) => {
        // the component can be updated multiple times during its lifespan,
        // and we don't want to bind the same event handler several times so unbind first
        link.removeEventListener('click', this.routeHandler, false);
        link.addEventListener('click', this.routeHandler, false);
      });
    }
  }

  // called once when component is created
  componentDidMount() {
    this.bindRouteLinks();
  }

  // called if component data changes _after_ created
  componentDidUpdate() {
    this.bindRouteLinks();
  }

  render() {
    // strip the 'staticContext' prop from withRouter() 
    // to avoid confusing React before we pass it down
    const { staticContext, ...props } = this.props;

    return <RichText {...props} />;
  }
};

// augment the component with the react-router context using withRouter()
// this gives us props.history to push new routes
RouteLinkedRichText = withRouter(RouteLinkedRichText);

// usage - drop-in replacement for JSS' RichText component
export default MyJSSComponent = (props) =>
    <RouteLinkedRichText field={props.fields.richText} />;
```

Now internal links entered in rich text fields will also be treated as route links.

## Advanced Usages

These examples use simple internal link detection that consists of "starts with `/`." There are some edge cases that can defeat simple link detection, such as:

* Scheme-insensitive links (`//google.com`) that are HTTP or HTTPS depending on the current page. These are an antipattern; encrypt all your resources.
* Links to static files (i.e. media files).

For use cases such as this, more advanced detection of internal links may be required that is situational for your implementation.