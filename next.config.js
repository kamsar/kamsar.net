const SUMMARY_JSON = require("./content/summary.json");
const withTypescript = require("@zeit/next-typescript");
const withCSS = require('@zeit/next-css');

module.exports = withCSS(withTypescript({
  exportPathMap: function() {
    const posts = {};
    const paths = {};

      Object.keys(SUMMARY_JSON.routes).forEach(file => {
        const routeData = SUMMARY_JSON.routes[file];
        const obj = {};

          console.log('handled', file);
          // Handle posts.
          const page = file
            .split("content")
            .join("")
            .split(".json")
            .join("");
          posts[page] = {
            page: "/post",
            query: {
              fullUrl: page
            }
          };

      });

    return Object.assign(
      {},
      {
        "/": { page: "/" }
      },
      posts,
      paths
    ); // aliases
  }
}));
