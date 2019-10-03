var Metalsmith = require("metalsmith");
var collections = require("metalsmith-collections");
var markdown = require("metalsmith-markdown");
var layouts = require("metalsmith-layouts");
var partial = require("metalsmith-partial");
var discoverPartials = require("metalsmith-discover-partials");
var hbtmd = require("metalsmith-hbt-md");
var handlebars = require("handlebars");
var permalinks = require("metalsmith-permalinks");
var watch = require("metalsmith-watch");
var serve = require("metalsmith-serve");
var postcss = require("metalsmith-with-postcss");
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
        title: "Bot Army Cookbook",
        description: "Tips, Tricks, and Recipes for Building Effective Bots",
        url: "https://git.corp.adobe.com/pages/manticore/bot_army_cookbook/",
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
                    "layouts/**/*": "**/*.md",
                    "partials/*": "**/*.md",
                    "public/*": true
                },
                livereload: isDev
            })
        )
    )
    .use(collections({ recipes: "recipes/*.md" }))
    .use(discoverPartials())
    .use(
        partial({
            directory: "./partials",
            engine: "handlebars"
        })
    )
    .use(hbtmd(handlebars))
    .use(metallic())
    .use(
        postcss({
            plugins: {
                tailwindcss: {},
                autoprefixer: {}
            }
        })
    )
    .use(markdown())
    .use(permalinks({ relative: false }))
    .use(
        layouts({
            default: "recipe.hbs",
            pattern: "**/*.html",
            engine: "handlebars"
        })
    )
    .build(function(err, files) {
        if (err) {
            throw err;
        }
    });
