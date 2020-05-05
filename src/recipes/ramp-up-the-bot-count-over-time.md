---
title: Ramp up the bot count over time
level: intermediate
---

When running a load test, you might want to increase the load over time. Normally,
this would be a feature of the test runner, but you can actually control it yourself
with a clever use of [`BotArmy.Actions.wait`][wait].

Simply start your tree with:

```elixir
def tree do
  Node.sequence([
    action(BotArmy.Actions, :wait, [0, ramp_up_period_in_seconds]),
    ...
  ])
end
```

Each bot will choose a random number of seconds within your defined bounds to wait
before continuing with the rest of the tree. The tricky part is realizing that
because the random functionality uses a uniform distribution, the wait times _should_
be more or less evenly spaced across the ramp-up duration. You can use this trick in
other similar situations, such as [using different trees for different bots][random trees].

[wait]: https://hexdocs.pm/bot_army/1.0.0/BotArmy.Actions.html#wait/3
[random trees]: ../use-different-trees-for-different-bots
