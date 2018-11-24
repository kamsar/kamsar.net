"use strict";

const fs = require("fs");
const path = require("path");
const globby = require("globby");
const MarkdownIt = require("markdown-it");
const hljs = require('highlight.js');
const markdownItNamedHeadings = require("markdown-it-named-headings");
const yaml = require("js-yaml");
const mkdirp = require("mkdirp");

const FRONTMATTER_SEPERATOR = "---";
const BASE_PATH = path.resolve(path.join(__dirname), '..', 'content');

const markdownIt = MarkdownIt({
  typographer: true,
  highlight: function (str, lang) {
    if (lang && hljs.getLanguage(lang)) {
      try {
        return `<pre class="hljs"><code>${hljs.highlight(lang, str, true).value}</code></pre>`;
      } catch (__) {}
    }

    return `<pre class="hljs"><code>${str}</code></pre>`; // use external default escaping
  }
});

markdownIt.use(markdownItNamedHeadings);

ProcessContent().catch(e => {
  console.error(e);
  process.exit(1);
});

// Main function
async function ProcessContent() {
  const globs = path.join(__dirname, "../content", "**", "*.md");
  if (globs.length === 0) {
    throw new Error("You must pass file patterns in to be processed.");
  }

  globby(globs).then(result => {
    console.log(`Found ${result.length} markdown files.`);

    /*  if (options.watch) {
        // TODO: chokidar
        const d = debounce(
          function() {
            processOutput();
          },
          options.watchDebounce,
          true
        );

        // fs.watch isn't supported on linux.
        try {
          fs.watch(commonDir, { recursive: true }, function(event, filename) {
            d();
          });
        } catch (e) {
          console.log(e);
        }
      } */

    async function processOutput() {
      const summary = {
        routes: {}
      };

      const processing = [];

      result.forEach((file, i) => {
        processing.push((async () => {
          const outputPath = file.replace(".md", ".json");

          const postData = await readMarkdown(file);

          await writeFileContent(outputPath, JSON.stringify(postData, null, 2));

          const { bodyHtml, bodyContent, ...summaryData } = postData;

          const routePath = file.substring(BASE_PATH.length).replace('.md', '');
          summary.routes[routePath] = summaryData;
        })());
      });

      await Promise.all(processing);

      writeFileContent(
        path.resolve(path.join(__dirname, "../content/summary.json")),
        JSON.stringify(summary, null, 2)
      );
    }

    return processOutput();
  });
}

async function readMarkdown(file, options) {
  const fileContent = await readFileContent(file);
  const hasFrontmatter = fileContent.indexOf(FRONTMATTER_SEPERATOR) === 0;
  let content = fileContent.trim();
  let frontmatter = {};
  let jsonData = {};

  if (hasFrontmatter) {
    const splitContent = fileContent.match(/^-{3}[\s\S]+?-{3}/);
    frontmatter = yaml.safeLoad(
      splitContent[0].substring(3, splitContent[0].length - 3)
    );
    content = fileContent.substring(splitContent[0].length).trim();
  }

  jsonData = {
    ...frontmatter,
    bodyHtml: markdownIt.render(content)
  };

  jsonData.title = jsonData.title || jsonData.bodyHtml.match(/>(.*?)<\//)[1];

  return jsonData;
}

// Read a file making sure that it is not a directory first.
function readFileContent(file) {
  return new Promise((resolve, reject) => {
    if (!file || fs.lstatSync(file).isDirectory()) {
      resolve(null);
    }
    fs.readFile(file, (err, data) => {
      if (err) reject(err);
      resolve(data && data.toString());
    });
  });
}

// Write a file making sure the directory exists first.
function writeFileContent(file, content) {
  return new Promise((resolve, reject) => {
    mkdirp(path.dirname(file), err => {
      if (err) reject(err);
      fs.writeFile(file, content, (e, data) => {
        console.log(`Wrote ${file}`);
        resolve(data);
      });
    });
  });
}
