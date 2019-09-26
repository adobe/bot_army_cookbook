var Metalsmith = require("metalsmith");
var collections = require("metalsmith-collections");
var markdown = require("metalsmith-markdown");
var layouts = require("metalsmith-layouts");
var permalinks = require("metalsmith-permalinks");

Metalsmith(__dirname)
    .metadata({
        title: "My Static Site & Blog",
        description: "It's about saying »Hello« to the World.",
        generator: "Metalsmith",
        url: "http://www.metalsmith.io/"
    })
    .source("./src")
    .destination("./docs")
    .clean(true)
    .use(collections({ posts: "posts/*.md" }))
    .use(markdown())
    .use(permalinks({ relative: false }))
    .use(layouts({ engine: "handlebars" }))
    .build(function(err, files) {
        if (err) {
            throw err;
        }
    });
