var Metalsmith = require("metalsmith");
var collections = require("metalsmith-collections");
var markdown = require("metalsmith-markdown");
var layouts = require("metalsmith-layouts");
var permalinks = require("metalsmith-permalinks");
var watch = require("metalsmith-watch");
var serve = require("metalsmith-serve");
var metallic = require("metalsmith-metallic");
var msIf = require("metalsmith-if");

const isDev = process.argv.indexOf("--dev") >= 0;
const port = 8000;

process.stdout.write(`\nBuilding for ${isDev ? "dev" : "prod"}\n`);
isDev && process.stdout.write(`Preview at http://localhost:${port}/\n\n`);

Metalsmith(__dirname)
    .source("./src")
    .destination("./docs")
    .metadata({
        title: "My Static Site & Blog",
        description: "It's about saying »Hello« to the World.",
        generator: "Metalsmith",
        url: "http://www.metalsmith.io/",
        isDev: isDev
    })
    .clean(true)
    .use(msIf(isDev, serve({ port: port })))
    .use(
        msIf(
            isDev,
            watch({
                paths: {
                    "${source}/**/*": true,
                    "layouts/**/*": "**/*.md"
                },
                livereload: isDev
            })
        )
    )
    .use(metallic())
    .use(collections({ posts: "posts/*.md" }))
    .use(markdown())
    .use(permalinks({ relative: false }))
    .use(layouts({ engine: "handlebars" }))
    .build(function(err, files) {
        if (err) {
            throw err;
        }
    });
