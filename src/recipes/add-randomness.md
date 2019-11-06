---
title: Add randomness
level: intermediate
---

The bot army is meant to imitate _real_ users, but what good is it if each bot is
doing the exact same thing? If each bot uses the same behavior tree template, how do
you make each bot act uniquely? The answer, obviously, is to include a little
randomness in your bots.

The bot army gives you quite a few ways to do this.

## Generating random values

First off, you'll probably need a way to generate random data so that all of your
write actions will be unique. Elixir has two main ways of doing this. You can get a
random value between 1 and n (inclusive) with `:rand.uniform(n)` (this looks a little
weird because it is actually Erlang), and you can choose a random element from a list
with `Enum.random([1,2,3,4])` (`Enum.random(1..4)` is equivalent).

Here is a quick and dirty random string generator that makes random strings of random
lengths.

```elixir
def random_string(length \\ :rand.uniform(100)) do
  fn -> Enum.random(?a..?z) end
  |> Stream.repeatedly()
  |> Enum.take(n)
  |> to_string()
end
```

You may want to look into the [StreamData] library for more (and better) random value
generators. Remember that you can use [default parameters] as a good place to use
random values.

## Compile-time vs. run-time considerations

When using random functions, you need to be careful to know if that function will run
every time you think it will. Depending on where a random function is in your code,
it might only get ran once at compile time, or it might get ran each time the
execution path reaches it. Here are some examples:

```elixir
# in helpers
def get_random_number, do: :rand.unique(10)

def tree do
  random_1 = :rand.unique(10)
  # functionally equivalent:
  random_2 = get_random_number()

  Node.repeat_n(
    random_1,
    Node.sequence([
      action(BotArmy.Actions, :log, [random_2]),
      action(MyActions, :log_a_random_number),
      action(MyActions, :log_n_or_random_number),
      action(BotArmy.Actions, :wait, [get_random_number()]),
      action(BotArmy.Actions, :wait, [0, 10])
    ])
  )
end

# in actions
def log_a_random_number(_context) do
  random_3 = get_random_number()
  Logger.info(random_3)
end

def log_n_or_random_number(_context, n \\ get_random_number()) do
  Logger.info(n)
end
```

A bot's tree only gets ran once, so `random_1` and `random_2` will only get set to a
random number once (per bot). This means the first `:log` action will log the same
random number each time it loops.

`:log_a_random_number` will log a different number each time because it gets called
every time the bot enters that action. The same goes for `:log_n_or_random_number`
(remember that default parameters get executed if needed each time their function is
executed).

The first `:wait` will wait the same time every loop (remember the tree definition
does not call any actions, it only describes how to call them, which means the
arguments get evaluated when the tree gets evaluated).

By contrast, the second `:wait` will have a different wait time every loop, because
the random selection within that range happens in the action.

## Randomizing the trees

Making each bot do different things at different times, is where behavior trees
really shine.

You can use [`Node.random`] and [`Node.random_weighted`] to give bots a chance to
"choose" which subtree to enter.

A good pattern for creating real-user-like bots is to build a tree that logs in, then
enters a continual loop that switches between various subtrees. You can gate those
subtrees to check for required conditions, and you can make each subtree loop for a
while before bouncing back up.

In order to make each subtree repeat, you could use a fixed number in
`Node.repeat_n`, or you could supply a random n as noted above. You can also use
[`BotArmy.Actions.succeed_rate`][succeed_rate] to randomize the chance to loop again.
For example, a succeed rate of 0.75 would "choose" to loop three out of four times on
average. This might seem unintuitive, especially if you are trying to control the
number of loops. It helps to think of it as looking at a real user who has just
finished one type of action, and guessing what the likelihood is that that user would
decide to do the same type of action again.

Tweaking all of these approaches is what will make your bots feel organic. Consider
how your real users decide what to do next. Remember that real users are a lot
slower than bots, so add appropriate random "idle" periods. And don't forget to also
have your bots check the state of the world periodically to respond to new data
instead of pure randomness.

Here is an example of all of these techniques:

```elixir
def tree do
  Node.sequence([
    log_in_tree(),
    # Main loop
    Node.repeat_until_fail(
      Node.sequence([
        # Check high priority actions first, but move on regardless of outcome
        Node.always_succeed(check_for_and_respond_to_new_notifications_tree()),
        # We don't want the outcome of any subtree to break the main loop
        Node.always_succeed(
          Node.random_weighted([
            {read_some_posts_tree(), 10},
            {make_some_replies_tree(), 5},
            {start_a_new_post_tree(), 2},
            # Go "idle" for up to 5 minutes
            {action(BotArmy.Actions, :wait, [0, 60 * 5]), 1}
          ])
        ),
        # take a short breather (up to 10 seconds)
        action(BotArmy.Actions, :wait, [0, 10]),
        # Maybe log out (5% of the time)
        # This is the only outcome that can exit main loop
        # We negate the outcome because if logout succeeds, we need to fail in order
        # to exit the loop, but if log out fails, we need to succeed to keep looping
        Node.negate(
          Node.sequence([
            action(BotArmy.Actions, :succeed_rate, [0.05]),
            action(User, :log_out)
          ])
        )
      ])
    )
  ])
end

# example subtree
def make_some_replies_tree() do
  Node.repeat_until_fail(
    Node.sequence([
      # leave subtree right away if it isn't actionable
      action(Posts, :do_any_exist?),
      action(Posts, :select_random_post),
      action(Posts, :reply_to_selected_post),
      # take a breath
      action(BotArmy.Actions, :wait, [5]),
      # loop 70% of the time
      action(BotArmy.Actions, :succeed_rate, [0.7])
    ])
  )
end
```

## Repeatability

Random is great, but you might be concerned about being able to repeat a specific
test run exactly. Luckily, the random functions described above all work off of a
seed, so if you supply a (random) seed at runtime, you can repeat the tests by using
the same seed:

```elixir
# set a seed before doing any random calls
:rand.seed(:exsplus, {1, 2, 3})
Enum.map(1..5, fn _ -> :rand.uniform(10) end)
# [4, 3, 8, 1, 6]

# if you use the seed again, you get the same results
:rand.seed(:exsplus, {1, 2, 3})
Enum.map(1..5, fn _ -> :rand.uniform(10) end)
# [4, 3, 8, 1, 6]

# a different seed gives different results
:rand.seed(:exsplus, {9, 9, 9})
Enum.map(1..5, fn _ -> :rand.uniform(10) end)
# [9, 10, 3, 4, 8]
```

Keep in mind that external factors that you can't control (like the state of the
system under test, or latency in your requests) might also affect your tests, even if
the random generator is doing the same thing.

[stagger]: ../ramp-up-the-bot-count-over-time/
[streamdata]: https://hexdocs.pm/stream_data/StreamData.html
[default parameters]: ../set-default-values/
[`node.random`]: https://hexdocs.pm/behavior_tree/BehaviorTree.Node.html#random/1
[`node.random_weighted`]: https://hexdocs.pm/behavior_tree/BehaviorTree.Node.html#random_weighted/1
[succeed_rate]: https://git.corp.adobe.com/pages/manticore/bot_army/BotArmy.Actions.html#succeed_rate/2
