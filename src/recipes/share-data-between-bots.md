---
title: Share data between bots
level: advanced
---

Bots run independently, each with their own state. However, sometimes you might want
to share data _between_ bots. How do you do that?

One way is to use the system under test. For example, bots can make posts to a
shared album and fetch new album content in a loop (or with a separate [syncing
channel][sync]). But what if you want bots to share information directly?

First off, make sure there is a legitimate real-world scenario where actual users
would share data outside of your system under test. For example, using email or
social media to send invites to contacts (or strangers). If this still applies you
can use [`BotArmy.SharedData`][shared data] as a global mutable state accessible by
all bots to `get`, `put` and `update` data.

Be careful though, sharing data can cause all kinds of tricky concurrency problems
(see below). I advise using `SharedData` sparingly!

One exception is that it is OK to use `SharedData` to expose [run-time
configuration][config] to your bots.

## Accessing custom config

The test runners automatically preload `SharedData` with your run-time configuration.
Here is an example:

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

This sounds like very reasonable test cases. But beware, here be dragons!

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
with each bot in its own album!

Fixing this situation is difficult. `SharedData` doesn't have any kind of locking
system built in. If you build one on your own, you will have created a single
bottleneck that all bots must pass through, which can cause problems.

The easiest fix I've come up with so far is to offset the bots so that you don't run
into a situation where multiple bots are checking `SharedData` before it has a chance
to get populated. You can do this by staggering the bot [start up times], but that
won't grantee fixing the problem.

Also, as a small, yet significant variant, maybe you want one bot to create an album
and put the invite id in `SharedData`, and then another bot to join it. In this
example, you have the problem of [making one bot wait for another][wait]. That is a
full topic on its own, so see the linked post for full details, though a useful trick
is relying on the fact that each bot has a unique id:

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

## Using locks

If you really want to use locking, you can, but it involves reaching through the
abstraction that `SharedData` exposes. Currently, `SharedData` wraps
[`ConCache`][concache], so you can use the locking tools exposed there. For example,
here is how you could supply a list of email addresses in your `SharedData` config,
and deal them out to each bot:

```elixir
# in your action
def get_email_from_shared_data(context) do
  # Concache.isolated locks the :users row until the function exits
  # (Similar to a transaction).
  # :bot_shared_data is the hard-coded name for the ConcCache process
  user_name =
    ConCache.isolated(:bot_shared_data, :users, fn ->
      [user | temp_list] = BotArmy.SharedData.get(:users)
      BotArmy.SharedData.put(:users, temp_list)
      user
    end)
  {:succeed, [user_name: user_name]}
end
```

This can be very handy, but be aware that it relies on information that technically
should be non-public. Perhaps a future version of `SharedData` will expose this
ability. Also note that if you attempt to do something time consuming inside of the
isolated function (like hit an auth endpoint over http), you will create a bottleneck
and your bots will probably time out.

[sync]: ../use-websockets
[shared data]: https://hexdocs.pm/bot_army/1.0.0/BotArmy.SharedData.html
[config]: https://hexdocs.pm/bot_army/1.0.0/Mix.Tasks.Bots.LoadTest.html
[wait]: ../wait-for-another-bot-to-finish-an-action
[start up times]: ../ramp-up-the-bot-count-over-time
[concache]: https://github.com/sasa1977/con_cache
