---
title: Parameterize actions
level: basic
---

Actions are intended to be simple and atomic to maximize reuse. A key factor in
achieving this is to make them flexible, which means parameterizing how they behave.
You can design your action's API in different ways, which will effect how usable they
are.

## Syntax

Before going into any actual API design, this is how you pass arguments to an action
in your tree:

```elixir
action(User, :create, ["user1", "password123"])
```

Everything in the square brackets will be passed as arguments to the action. So the
above will become:

```elixir
User.create("user1", "password123")
```

It might help to point out that when you define actions in your tree, you aren't
actually _calling_ them. Rather, you are describing how the bot should call them
when it gets to that action.

(In the case of the bots, it actually slips the `context` in as the first argument
when calling your action, so your action can use values from there too.)

> A word of caution - forgetting the square brackets is an easy mistake to make,
> especially if you only have one parameter or want to pass a list as your parameter.

```elixir
action(User, :update_name, "new name")
# ** (ArgumentError) argument error :erlang.apply(...

action(User, :update_name, ["new name"])
# ok
```

If you ever see an `:erlang.apply` error, you probably forgot to wrap your
arguments in brackets.

Similarly, if you actually want to pass a list as your argument, you need to "double
wrap" it:

```elixir
action(User, :set_favorite_foods, [["pizza", "ice cream", "broccoli"]])
```

To make this more confusing, elixir has a "neat trick" where you can write a keyword
list literal without the brackets:

```elixir
IO.inspect(a: 1, b: 2)
# This is only a single argument, not 2!
# It is the same as:
IO.inspect([a: 1, b: 2])
# which is actually shorthand for [{:a, 1}, {:b, 2}]
```

But if you leave out the brackets when using a keyword list as an argument to your
action, it won't work, so you need to be explicit like this:

```elixir
action(User, :create, [[use_random_name?: true, fail_if_already_exists?: false]])
```

Now on to designing your action's API.

## Relying on the `context`

As mentioned, every action is called with the bot's `context` (or internal state,
sometimes called a "blackboard" in Behavior Tree terminology). Your action can use
any value in the context, so you might not need anything else. But in some cases,
you need to pass in some kind of static configuration.

You can always add extra parameters to your action if the context isn't enough. The
format of the parameters depends on your case.

## Specifying additional parameters

If you need data for the action to use, you can pass that in however it makes sense,
often as a map:

```elixir
action(User, :create, [%{name: "user1", password: "password123"}])
```

## Flags vs. Maps/Keyword lists

What do you think this does?

```elixir
action(User, :create, [true])
```

What about this?

```elixir
action(User, :create, [false, true])
```

You can't tell without looking at the action. It also gets more confusing when you
have multiple flags with default values.

```elixir
def create(context, use_random_name? \\ false, fail_if_already_exists? \\ false) do
  ...
```

In general, instead of using flags, you should use either a map or keyword list.
Keyword lists are more idiomatic, but they don't prevent duplicate keys, and are
harder to pattern match against. Also be sure not to forget the brackets as discussed
above.

Regardless of which one you use, use `Map.get` or `Keyword.get` to access the actual
values.

## Maximum flexibility

Here is an example of how you can rely on optional parameters to make your action
work in different ways:

```elixir
def like_post(context, post_id \\ nil) do
  with id when is_binary(id) <-
         post_id || Map.get(context, :current_post, {:error, :no_post_present})
    {:ok, _} <- like_post(id) do
      :succeed
    else
      {:error, :no_post_present} ->
        Logger.error("No post to like")
        :fail

      {:error, e} ->
        Logger.error(inspect(e))
        :fail
    end
end
```

You can use this action in two ways. Either you can supply a post id to like
explicitly. Or you can use it without an argument as part of a tree that sets
`context.current_post` in some previous action.

This configuration makes this action useful in both load-testing and
integration-testing trees.
