---
title: "Bot Army Cookbook"
layout: listing.html
---

...use the bot army for testing, (link)

...why bots? (page)

...why behavior trees? (page)



 ```md
## Notes/TODO

These are mostly tailored to load testing, consider if/how we want to address 
functional testing patterns.

(*) try to write each title in a format more like "How do I do X?"

### General concepts and best practices

- what the bots are good at (stateful + "organic")
- what actions can do
- keeping actions atomic, yet flexibly parameterized - reuse + doubling as load/functional testing
- outcomes (when to fail, when to error)
- working with the context (the bot's "memory")
- number of bots vs number of actions per second and how to control
- you're going to be writing some Elixir...
- Lua scripting option???
- Logging


### Writing Trees section

- power comes from node composition
- nesting subtrees for reuse and abstraction
- example auth sequence
- ways to repeat
- sharing data between bots (`SharedData`)
- orchestrating bots working in tandem (partitioning bots actions and waiting for other bots to finish) 
- "ramping up" bot count (via uniform random wait times)
- if/then/else samples


### Writing Actions section

- relying on context
- default values
- atomic atomic atomic!
- using `with` or `case` and logging and outcomes
- example adding users/pools
- blocking for async results
- not blocking for async results (`:continue` and `withRetry`)
- options/defaults as flags vs optional args vs maps vs keyword lists


### Custom Bot

- when you need it
- adding a concurrent websockets/long polling "channel"

### Gotchas

- beware side-effects
- random values and run-time vs compile time
- race conditions when blocking in actions with a second "channel" (use `withRetry`)
- forgetting to put the arguments in a list

### Style guide ?
```

### How do I...?
