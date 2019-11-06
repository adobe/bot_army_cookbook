---
title: Use different trees for different bots
level: intermediate
---

When running multiple bots simultaneously, such as in a load test, a common question
is the relationship between bots and behavior trees. Here is the break down: your
test run will have many bots, but only one tree describing how the bots should
behave. Each bot is an individual "instance" of the same tree.

You might be inclined to want to be able to assign different trees to different bots,
such as having some bots that are "read only" and some that are "write only."

You can't do this directly, but it is not hard to get the same result by describing
what you want at the root level of your tree:

```elixir
def tree do
  Node.random_weighted([
    {write_tree(), 1},
    {read_tree(), 4}
  ])
end

def write_tree() do
  Node.repeat_until_fail(
    Node.always_succeed(
      Node.sequence([
        ...
      ])
    )
  )
end

# read_tree is similar
```

In this example, for every five bots, one of them will "choose" the write tree and
four of them will choose the read tree (approximately, it is random). Once a bot has
"chosen" a path, it will loop in that sub tree forever (until it dies).

While this is a useful pattern, think twice before doing something so "contrived."
Consider if the behavior you are creating represents real user behavior. If you are
trying to do a brute force performance test, this might be useful, but in the real
world users don't segregate this way. Some users might be more read or write heavy,
but they usually will alternate between varying durations of reading and writing
different types of content. You can more accurately model this with a well crafted
tree that [randomly] yet fluidly transitions between various sub trees.

[randomly]: ../use-random-values
