---
title: "Why Behavior Trees?"
---

Simulating real users is hard.  When testing, we want to be able to describe how to
react to a given situation, without being too rigid.  We'd like to be able to
describe complex behaviors and conditional sequences in a way that is easy to manage
and change.

Behavior trees are the technology that power the non-player-characters' AI in video
games.  They are similar to finite state machines, but simpler to manage, especially
as they get more and more complex.

The secret to their simplicity and power come from 5 fundamentals:

1. The data structure is a tree.  This makes it composable, meaning you can build up 
   complex behaviors by nesting smaller subtrees.
2. Each node has 2 possible transitions - "fail" or "succeed."  These are the only 2
   transitions, no matter how many nodes you add.
3. Leaf nodes are actions.  Actions can do what ever you want, including reading the
   bot's state, performing side effects, and updating the bot's state.  Actions must 
   report if they failed or succeeded.
4. Internal nodes are control nodes - they control traversal through the tree.  There 
   are a number of [available control 
   nodes](https://hexdocs.pm/behavior_tree/BehaviorTree.Node.html#content).  The most 
   common ones are "sequence" and "select."  Sequence nodes will attempt to run each 
   child from left to right.  If each child succeeds, it will succeed.  If a child 
   fails, it will fail.  Select nodes are the inverse - if all children fail, it 
   fails, otherwise it succeeds when one of its children succeeds.  **The power of 
   behavior trees comes from how you nest control nodes.**
5. The behavior tree's "active" node is always one of the action (leaf) nodes.  When
   it fails or succeeds, it will traverse to another action, based on the structure
   of the tree.

A bot has a behavior tree "template" to follow.  It run in a loop where it runs the 
current action, gets the outcome, traverses to the next action, and repeats.  In the 
Bot Army, trees and actions are kept separate, bot for organization, but also
because actions can be reused in different orders in different trees.

A behavior tree looks like this:

```elixir
def tree do
  sequence([
    action(MyActions, :get_ready),
    action(CommonActions, :wait, [5]),
    select([
      action(MyActions, :try_something, [42]),
      action(MyActions, :try_something_else),
      action(CommonActions, :error, ["Darn, didn't work!"])
    ]),
    MyOtherTree.tree(),
    action(CommonActions, :done)
  ])
end
```

The bot would call these corresponding actions:

```elixir
def get_ready(context) do
  {id: id} = set_up()
  {:succeed, id: id} # adds `id` to the context for future actions to use
end

def try_something(context, magic_number) do
  case do_it(context.id, magic_number) do
    {:ok, _} -> :succeed
    {:error, _} -> :fail
  end
end

def try_something_else(context), do: ...
```

[Read more] about behavior trees, or [watch a video].


[Read more]: 
https://en.wikipedia.org/wiki/Behavior_tree_(artificial_intelligence,_robotics_and_control)
[watch a video]: https://www.youtube.com/watch?v=3sLYzxuKGXI
