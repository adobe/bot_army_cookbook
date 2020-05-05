---
title: Validate expectations
level: basic
---

Testing commonly involves validating expectations. This happens all the time in
functional tests, but is also useful in any test that needs to wait for something to
happen before moving on.

While you can always validate API responses right when you call them (usually with
pattern matching in a `case` or `with` statement), you'll often need to separate your
actions into a "fetch" step and a "validate" step. If your validation is in it's own
step, you'll have to rely on the `context` to access the data that was previously
fetched and stored.

You can hard code your expectations in your trees (even if they have some degree of
randomness) like this:

```elixir
# your tree
parallel "changing post name" do
  name = "My post " <> random_string()
  Node.sequence([
    log_in(),
    # this sets `context.current_post` to the HTTP resonse
    action(Post, :create, [%{name: name}]),
    # this updates `context.current_post` with the updated HTTP response
    action(Post, :update_current_post, [%{name: name <> "updated!"}]),
    action(Post, :validate_current_post, [%{name: name <> "updated!"}]),
  ])
end

# your action (this is generic enough to validate any expected values)
def validate(%{current_post: actual_values}, expected_values) do
  if Enum.all?(expected_values, &(&1 in actual_values)) do
    :succeed
  else
    Logger.error(
      "Validation failed.\nExpecting values: #{inspect(expected_values, pretty: true)}\nAcutal values: #{
        inspect(actual_values, pretty: true)
      }"
    )
    :fail
  end
end
```

This just makes sure all of the expected values are in the actual values. The
`&(&1 ...)` syntax is short for `fn arg1 -> arg1 ... end)`. Note that this will only
check the supplied fields, so this will pass even if the current post has more fields
than what you specify in `expected_values`.

An alternative to hard coding values is to store expected values in the context.
This may be useful for example to store the number of posts after fetching them,
and using that later to check if the number changes after updating, adding or
deleting a post.

## Retries

One of the trickiest parts of validation is validating asynchronous data. The data
may not have arrived, or only partially arrived when you attempt to validate it. How
do you know if it is incorrect, or merely still in transit?

A common approach is to retry your validation multiple times, pausing between
attempts, until the data is correct, or you decide you've waited long enough and give
up.

See [how to repeat actions] and [`retry_with_timeout`] for two expressive ways to do
retries.

[how to repeat actions]: ../repeat-actions/#limiting-retries
[`retry_with_timeout`]: https://github.com/adobe/bot_army_ui_testing_demo/blob/master/lib/actions/cookbook.ex#L105
[pin]: https://elixir-lang.org/getting-started/pattern-matching.html#the-pin-operator
