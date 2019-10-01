---
title: "Bot Army Cookbook"
layout: listing.hbs
---

The "Bot Army" is a tool for testing apps and services with AI-powered "bots."  It 
can do both load testing and functional/integration testing.

First steps:

- [Why bots?](/why-bots) - because they simulate _real_ users
- You're going to have to know a little [Elixir](https://learnxinyminutes.com/docs/elixir/)
- Understand how to use [behavior trees](/why-behavior-trees) effectively
- Review the [full bot army docs](https://git.corp.adobe.com/pages/manticore/bot_army/readme.html)

Here are some useful recipes to with common bot tasks.

### How do I...?

<!--

----------------
    TODO
----------------

### Set up a "bot army" project
    - tree (load vs integration)
    - actions
    - "bootstrap" file
    - deps
    - run mix task

### Reuse actions
    - keeping actions atomic
    - flexibly parameterized
    - doubling as load/functional testing
    - fail vs error
    - careful about side effects

### Control the number of actions per second
    - number of bots vs frequency of actions per second
    - using `wait`

### Reuse subtrees
    - nesting
    - reuse
    - abstraction
    - parameterizing

### Authenticate a bot
    - existing username/password pool
    - choose username
    - authorize
    - store token

### Repeat actions
    - repeat action/tree
    - repeat-n
    - repeat-until-fail
    - repeat-until-succeed
    - succeed-rate
    - :continue
    - with-retry

### Share data between bots
    - Load test config/metadata
    - SharedData
    - create/share/join invite workflow 

### Use different trees for different bots
    - percentage based using root level random_weighted

### "Ramp up" bot count
    - via random wait times (uniform)

### Conditionally run actions
    - via tree stucture and :fail
    - if/then sample
    - if/then/else sample

### Set default values
    - as parameter defaults
    - as Map/Keyword defaults

### Use random values
    - in trees
    - as default function params
    - beware of compile time random values that don't change

## Parameterize actions
    - flexibility ftw
    - flags
    - optional args
    - maps/keywords

### Handle errors
    - case and with syntax
    - logging
    - :error vs :fail

### Fetch data from an HTTP endpoint
    - http libs
    - http wrapper

### Track current state
    - ex: current user, pools, current pool
    - careful to maintain proper sync
    - all actions need to understand the internal state and deal with missing data

### Wait for async results
    - blocking vs non blocking implications at bot level
    - blocking vs async at lib/Elixir level
    - receive w/ timeout

### Retry an action
    - loop in tree
    - :continue (fetch + validation)
    - timeout/max retries (with_retry)

### Validate expectations
    - validating data in context
    - hard code expectations
    - put expectations in context
    - use retries

### Wait for another bot to finish an action
    - wait
    - SharedData flags + retry
    - 2nd channel (websocket, etc) + retry

### Use websockets
    - 2nd channel concept
    - custom Bot
    - beware of blocking actions

### Use long-polling
    - blocking aproach in loop
    - non blocking (like websockets)

### Read from/ write to the file system
    - File.*
    - download via stream to file


### Run shell scripts
    - Cmd.*


### Write actions in Lua
    - ???

### browser testing
    - Hound
    - with_retry
-->
