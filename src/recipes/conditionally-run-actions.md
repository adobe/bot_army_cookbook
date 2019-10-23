---
title: Conditionally run actions
---

The power of the bots is that they are _organic_, and can _respond_ to their current
context. In order to work that way, they require logic operations to choose which
action to take next. How can you encode logic in the bots?

> The number one takeaway is to use the _structure of the tree_, rather than code
> within the actions, to get organic behavior. Be sure you fully understand
> [how behavior trees work][1]!

Remember that each node in your tree only has two "transitions," `:succeed` or
`:fail`. You can create complex transitions from one action to another with only
these two outcomes by the way you _nest_ the [different types of control nodes][2].

Here are some examples of common logical structures.

## If/Then

If/then is as simple as using the `sequence` control node. Each action will only
occur if the previous one succeeds.

```elixir
def if_then_tree() do
  Node.sequence([
    attempt_xyz_tree(),
    post_xyz_tree()
  ])
end
```

Keep in mind that if _any_ of the actions `:fail`, the whole `sequence` node will
`:fail`. The [`always_succeed`][3] control node is useful if you want to attempt an
action but don't want its outcome to affect the `sequence` it is a part of, like
this:

```elixir
def if_then_tree() do
  Node.sequence([
    attempt_xyz_tree(),
    Node.always_succeed(post_xyz_tree())
  ])
end
```

In this example, the `if_then_tree` will `:succeed` as long as `attempt_xyz_tree`
succeeds, regardless of the outcome of `post_xyz_tree`.

## If/Else

If/else is simply the `select` control node. Each action will be attempted until one
succeeds. Keep in mind that if _all_ of the actions `:fail`, the whole `select`
node will `:fail`.

```elixir
def if_else_tree() do
  Node.select([
    attempt_xyz_tree(),
    fallback_to_abc_tree()
  ])
end
```

## If/Then/Else

You can build up more complex logic by combining the two approaches above.

```elixir
def if_then_else_tree() do
  Node.select([
    Node.sequence([
      attempt_xyz_tree(),
      post_xyz_tree()
    ]),
    fallback_to_abc_tree()
  ])
end
```

In this example, if `attempt_xyz_tree` succeeds, `post_xyz_tree` will run, and
(assuming that succeeds) `if_then_else_tree` will succeed. If `attempt_xyz_tree`
fails, then `fallback_to_abc_tree` will run (and `if_then_else_tree` will fail or
succeed depending on that outcome).

## Keeping trees organized

You might have noticed in the example above, that the first subtree in the top level
`select` is the same
as `if_then_tree`.

> When nesting trees, it is much easier to keep track of the flow if you name each of
> your subtrees and refer to them by name.

Like this:

```elixir
def if_then_else_tree() do
  Node.select([
    if_then_tree(),
    fallback_to_abc_tree()
  ])
end
```

## Final thoughts

These approaches will let you build up transitions that are as complex as you need.
Using the structure of the tree to control the logic has two benefits. First, you
can mix and match the same actions in very different behaviors without having to
change any code in the actions. Second, you can make more complex behaviors simply
by nesting existing trees.

You may find it helpful to create a few actions that perform a simple check about the
bot's current state to use as the "pivot" in your logic branches. For example, an
action that checks if the bot is logged in:

```elixir
def is_logged_in?(%{token: token}) when is_binary(token), do: :succeed
def is_logged_in?(_), do: :fail
```

Keep in mind that the [`always_succeed`][3], [`always_fail`][4] and [`negate`][5] control nodes can
come in handy. And lastly, avoid unnecessary nesting, such as having a `sequence`
inside another `sequence`, which wouldn't have any effect on the logic flow.

[1]: ../../why-behavior-trees/
[2]: https://hexdocs.pm/behavior_tree/BehaviorTree.Node.html#content
[3]: https://hexdocs.pm/behavior_tree/BehaviorTree.Node.html#always_succeed/1
[4]: https://hexdocs.pm/behavior_tree/BehaviorTree.Node.html#always_fail/1
[5]: https://hexdocs.pm/behavior_tree/BehaviorTree.Node.html#negate/1
