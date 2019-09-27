var Metalsmith = require("metalsmith");
var collections = require("metalsmith-collections");
var markdown = require("metalsmith-markdown");
var layouts = require("metalsmith-layouts");
var permalinks = require("metalsmith-permalinks");
var watch = require("metalsmith-watch");
var metallic = require("metalsmith-metallic");

Metalsmith(__dirname)
    .source("./src")
    .destination("./docs")
    .metadata({
        title: "My Static Site & Blog",
        description: "It's about saying »Hello« to the World.",
        generator: "Metalsmith",
        url: "http://www.metalsmith.io/"
    })
    .clean(true)
    .use(
        watch({
            paths: {
                "${source}/**/*": true,
                "layouts/**/*": "**/*.md"
            },
            livereload: true
        })
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
