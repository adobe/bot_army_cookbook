---
title: Reuse actions
level: basic
---

Actions are what give bots agency. But they also are the part of the bots that
require writing custom code. When you add more functionality, you need to write more
actions. Ideally, you can craft your actions in such a way that they can be mixed
and matched in different ways without having to make changes to them every time.

Here are a few tips for maximizing reuse.

## Keep actions atomic

Actions should represent simple commands: "Fetch all posts." "Update album name."
"Download image." In some ways, they are thin wrappers around an interface for
interacting with an external system. The only logic they should contain is how they
perform their command, and how to report back the outcome and any relevant data.

Any further logic than that should be [defined by the structure of the tree][logic].
If an action performs any logic on its own, it becomes specialized to only one way of
using it.

## `:fail` vs. `:error` outcomes

At first you may be inclined to make your bot error if an action doesn't work. This
makes sense, but the problem is that if your action errors, the bot will die
immediately. You might want to use the action in a different way where you have a
fallback action if it doesn't work, but you won't be able to if the first one errors.

It is better to always `:fail`. You can always wrap it in a `Node.select` and follow
it with [`BotArmy.Action.error`][error]. This way you can decide if the bot should
die
at the tree level, instead of the action level.

## Be careful about side effects

By definition, actions are side effects. The problem comes in when you want an
action to perform a side effect in one use case, but not another. You could pass in
a flag to parameterize the side effect, but that is messy.

It is better to wrap the side effect in its own action and run it after your action
in a `Node.sequence`. This way you can decide if the side effect should happen at the
tree level instead of the action level.

## Keep actions flexible

You probably will need to make actions flexible in order to get full use out of them.
See how to [parameterize actions][flexible] on more tips on how to do this.

By following these tips, you can reuse actions, not only in different ways for
different trees, but also across both load and integration tests, which is a very
powerful feature.

[logic]: ../conditionally-run-actions/
[error]: https://hexdocs.pm/bot_army/1.0.0/BotArmy.Actions.html#error/2
[flexible]: ../parameterize-actions/
