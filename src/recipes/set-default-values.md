---
title: Set default values
---

In order to make your actions more flexible and reusable, you probably will want to
provide default values in some cases. This isn't difficult, but you have a few
options on how to do it:

- function parameter defaults (optionally combined with pattern matching)
- using `Map.get(map, :key, default_value)` (or `Keyword.get`)
- using `value_that_could_be_nil || fallback_value`

Here is a fairly advanced example using of these options to make an action that can
be used in many different ways:

```elixir
@doc """
Reply to a feed item.  Can be called in different ways:

1) `reply(context, feed_item_id, "reply text")` where `feed_item_id` is a string to
   reply to a specific feed item

2) `reply(context, feed_type, "reply text") where `feed_type` is one of `:post`,
   `:asset`, or `:reply` to reply to a randomly chosen feed item of the specified
   type

3) `reply(context, "reply text")` to reply to a randomly chosen feed item of a
   randomly chosen feed type

You can also leave off the reply text in any version to use randomly generated text.

In addition, you can supply a 4th paramater as a string to use as the reply name,
otherwise `context.username` will be used.
"""

def reply(
      _context,
      type \\ Enum.random([:post, :asset, :reply]),
      text \\ random_text(),
      reply_name_override \\ nil
    )

def reply(context, feed_item_id, text, reply_name_override)
    when is_binary(feed_item_id) do
  reply_name = reply_name_override || Map.get(context, :username, "no name")
  # ...
end

def reply(context, :asset, text, reply_name_override) do
  # special handling for replying to assets
  # ...
end

def reply(context, other_type, text, reply_name_override)
    when other_type in [:post, :reply] do
  # ...
end

```

There's a log going on here, so let's unpack it.

First, if you define a function that has default values and multiple clauses, you
need to make a "function header" which specifies the defaults but has no body. You
will get a descriptive error if you forget. If you don't have multiple clauses, you
can put your default values in your normal function definition. In this case, the
first `def` line is the header, specifying default values.

This `reply` function always has an arity of 4, even if you call it with less
arguments. `context` is the only required parameter. The default values will be
applied if you don't specify those parameters yourself.

A common trick is to make a parameter optional by providing a default parameter of
`nil`. We do this for `reply_name_override`, then use `||` to provide a fallback. In
this case the fallback has a fallback (with `Map.get`), since we don't know if
`username` exists in the `context`.

For `type` and `text` we define default values in the function definition. Note that
the code after the `\\` only runs if an argument for that parameter wasn't provided,
so the various random functions will run with new random values each time this action
is called. Using a call-time function like this is a powerful trick.

Finally, the various pattern matching variations of the function define how to
respond in each case.

Putting it all together makes an action that is very flexible and reusable.
