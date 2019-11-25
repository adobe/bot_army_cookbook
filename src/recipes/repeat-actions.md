---
title: Repeat actions
level: intermediate
---

You probably won't get far in writing a bot before you need some kind of a loop.
Long-running bots run in a loop by their very nature, and even linear integration
tests often need to repeat certain actions or sequences. The bot army provides a
number of ways to build loops and repeat actions.

## When a tree "finishes"

When a bot gets to the end of its behavior tree, it will start again from the
beginning. The only way to actually make a bot stop is to have an action return an
outcome of `:done` or `{:error, reason}`. Be aware that when running a load test, the
runner will start a new bot in its place. Also note that the integration test runner
automatically wraps your trees with a "done" action after it to prevent them from
repeating.

```elixir
# alternates logging in and making a post forever
# if either action fails, it will start from the top again
def tree do
  Node.sequence([
    log_in(),
    make_post()
  ])
end
```

Sometimes you might want this, but other times you may only want a portion of the
tree to repeat.

## Using the `repeat_n` node

You can nest any action or subtree under the [`repeat_n` node][1], and it will be
repeated the specified number of times, regardless of its outcome. Note the [done
action][2] to stop the bot.

```elixir
# logs in, then makes 5 posts, then stops
def tree do
  Node.sequence([
    log_in(),
    Node.repeat_n(5, make_post()),
    action(BotArmy.Actions, :done)
  ])
end
```

This is the most straightforward approach, but sometimes you want to repeat steps
conditionally (more like a "while loop").

## Using the `:continue` outcome

Bots traverse their behavior trees based on `:fail` and `:succeed` node outcomes.
But there is actually another outcome that tells the behavior tree to stay on the
same node it is already on: `:continue`.

You can make an action repeat simply by returning that. You would probably want to
put some logic in there to make it eventually return a different outcome, otherwise
your bot would repeat that action forever.

While this works fine, it shifts the repeat logic into the action instead of the
tree, which makes the action less atomic, and thus less flexible and reusable.
Controlling loops via the tree is generally a better approach, plus you can repeat
full subtrees instead of a single action.

## Conditional repeats

The main approach handling repeat logic in the tree is to use one of
[`repeat_until_fail`][3] or [`repeat_until_succeed`][4]. These can be a little tricky
to use, and might require a subtree with some logic in it (see the [conditionally run
actions][5] recipe), but the basic concept is simple:

```elixir
# logs in, then likes posts until none are left
def tree do
  Node.sequence([
    log_in(),
    Node.repeat_until_fail(
      Node.sequence([
        select_next_post(),
        Node.always_succeed(like_selected_post())
      ])
    ),
    action(BotArmy.Actions, :done)
  ])
end
```

Notice how this uses [`always_succeed`][6] to ensure that only `select_next_post`
will break the loop.

## Limiting retries

You might have noticed in the previous example that if `select_next_post` never
fails, you will be stuck in an infinite loop. Sometimes you don't know if an action
will eventually fail (or succeed), especially when you are doing [validation style
actions][7], so you need a way limit how many times you loop.

One approach is to store a counter in the bot's context, and to be sure to increment
it every time you loop, and also to break the loop if it goes over your limit. Keep
in mind that actions should be as simple and atomic as possible, so this is a
slippery slope, but you can encapsulate this retry logic in a helper like this:

```elixir
def with_max_retries(success?, max_retries, context)
    when is_boolean(success?) and
         is_integer(max_retries) and
         max_retries > 0 do
  attempts = Map.get(context, :attempts, max_retries)
  cond do
    success? ->
      {:succeed, attempts: max_retries}

    attempts > 0 ->
      # optional, give some time before trying again
      Process.sleep(500)
      {:continue, attempts: attempts - 1}

    :else ->
      {:fail, attempts: max_retries}
  end
end
```

You can use it in your actions by giving it a boolean condition and letting it decide
what outcome to return:

```elixir
def validate_has_n_posts(context, expected_num) do
  post_count = get_posts() |> Enum.count()

  (post_count == expected_num)
  |> with_max_retries(5, context)
end
```

[1]: https://hexdocs.pm/behavior_tree/BehaviorTree.Node.html#repeat_n/2
[2]: https://git.corp.adobe.com/pages/BotTestingFramework/bot_army/BotArmy.Actions.html#done/1
[3]: https://hexdocs.pm/behavior_tree/BehaviorTree.Node.html#repeat_until_fail/1
[4]: https://hexdocs.pm/behavior_tree/BehaviorTree.Node.html#repeat_until_succeed/1
[5]: ../conditionally-run-actions/
[6]: https://hexdocs.pm/behavior_tree/BehaviorTree.Node.html#always_succeed/1
[7]: ../validate-expectations
