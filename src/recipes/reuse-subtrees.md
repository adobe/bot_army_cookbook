---
title: Reuse subtrees
level: basic
---

One of the most powerful features of Behavior Trees is that you can build up lots of
smaller simpler trees and _compose_ them together into larger, more complex ones.

How does this work in Elixir? It is pretty simple:

```elixir
def auth do
  Node.sequence([
    action(User, :choose_from_pool),
    action(User, :log_in_current_user)
  ])
end

def read_posts(n, category) do
  Node.sequence([
    Node.repeat(
      n,
      action(Post, :fetch, [[category: category]])
    )
  ])
end

def write_post do ...

def tree do
  Node.sequence([
    auth(),
    Node.random([
      read_posts(5, "elixir"),
      write_post(),
      # etc...
    ])
  ])
end
```

Each tree is defined, and can be used by other trees. This helps with organization,
but also lets you use the same subtree in multiple places in a larger tree, and can
also make complex trees much easier to see what they are doing.

Because each tree is defined as a normal Elixir function, you can have it define
parameters which it can pass down into its actions, allowing you to parameterize
whole subtrees.
