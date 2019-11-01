---
title: Share data between bots
level: advanced
---

Bots share data between _actions_ via the `context`. But how do you share data
between different bots?

The bot army provides a [`SharedData`][shared data] module just for this case. It
works similar to the `get`/`put`/`update` features of `Map`, allowing you to define
key value pairs in a global space. Also, any custom config [passed in] when you
start your test will be available in `SharedData` to access in your actions or trees.

## Accessing custom config

This is how you would set and use custom config:

```elixir
# start your tests like this from the command line:
# mix bots.load_test --n 100 --tree "MyBots.MyTree" --custom '[run_id: "abc", num_albums: 20]'

def tree do
  albums_to_create = BotArmy.SharedData.get(:num_albums) || 10

  Node.sequence([
    action(BotArmy.Actions, :log, ["run_id: " <> BotArmy.SharedData.get(:app_id)]),
    Node.repeat_n(
      albums_to_create,
      Node.sequence([
        action(MyActions, :create_album),
        ...
      ])
    ),
    ...
  ])
end
```

## Concurrency problems

Let's say you want to make a test where each bot will look in `SharedData` for an
album invite to join, and if it doesn't find one, it will create an album and put the
invite in `SharedData` for the other bots to use.

Or as a small, yet significant variant, maybe you have a test where one bot creates
an album, puts the invite id in `SharedData`, and then another bot joins it.

These sound like very reasonable test cases. But beware, here be dragons!

The problem is that as soon as you have multiple bots, running at the same time,
trying to access the same shared resource, you have opened the box to all the
concurrency challenges, such as race conditions and consistency issues.

You might make the following **incorrect** tree for the first example:

```elixir
def tree do
  Node.select([
    Node.sequence([
      action(MyActions, :get_invite_from_shared_data),
      action(MyActions, :join_selected_invite)
    ]),
    Node.sequence([
      action(MyActions, :create_album),
      action(MyActions, :put_invite_in_shared_data)
    ])
  ]),
  ...
end

```

The logic here is correct. The problem is that all bots will run this tree at about
the same time, so they all will check `SharedData` for an invite at the same time,
and they all will come up empty, so they all will go create an album and share the
invite id. You just inadvertently created hundreds of albums and shared invites,
with each bot in its own album.

Fixing this situation is difficult. `SharedData` doesn't have any kind of locking
system built in. If you build one on your own, you will have created a single
bottleneck that all bots must pass through, which can cause problems.

The easiest fix I've come up with so far is to offset the bots so that you don't run
into a situation where multiple bots are checking `SharedData` before it has a chance
to get populated. You can do this by staggering the bot [start up times], but that
won't grantee fixing the problem. You could also ensure only a single bot makes the
albums, while the others wait. If you are doing integration testing, use a `pre` tree
for that. Otherwise, you can do something like this:

```elixir
# in your tree
...
Node.sequence([
  action(MyActions, :check_bot_id, [1]),
  action(MyActions, :create_album)
])
...

# action
# All bots have `context.id`, which starts at 0 and increments by 1.
# Be careful, if a bot dies, that id will not be used again in other bots (until the
# next run)!
def check_bot_id(%{id: id}, allowed) when id == allowed, do: :succeed
def check_bot_id(), do: :fail
```

In the second example, you have the problem of [making one bot wait for
another][wait]. That is a full topic on its own, so see the linked post for full
details.

In general, try to avoid using `SharedData` as much as possible. It should only be
used to read run time config, or in cases where your users would legitimately
communicate with each other in a system other than the one under test (like emailing
an invitation to a friend). Keep race conditions in mind by thinking about how many
bots will be accessing `SharedData` at the same time.

[shared data]: https://git.corp.adobe.com/pages/manticore/bot_army/BotArmy.SharedData.html#content
[passed in]: https://git.corp.adobe.com/pages/manticore/bot_army/Mix.Tasks.Bots.LoadTest.html
[wait]: ../wait-for-another-bot-to-finish-an-action
[start up times]: ../ramp-up-the-bot-count-over-time
