---
title: Handle errors
level: basic
---

Errors are the raison d'etre for testing. The question is how you deal with them when
they come up.

## Where errors can arise

Errors are either anticipated or unexpected. Unexpected errors usually mean a bug in
the tests (most likely the actions). These types of errors usually crash the bot with
a thrown error logged to the console. Common errors include pattern matching errors
or incorrect function calls (Elixir is not statically typed, but the compiler does
catch many problems, and adding a linter to your editor is very helpful). If you get
an unexpected error, you have to fix it in your tests and try again.

Sometimes you'll get an unexpected error when one of your API calls returns data in a
different shape than you expected. You need to be sure to anticipate these kind of
errors when you make any API call that may return an unknown value. Luckily, Elixir
has many great ways of doing so (see below).

Lastly, you might consider a response that doesn't match your expectations to be an
error. These are the only errors that are not bugs in your tests, but potential bugs
in your system under test (unless your testing assertions are incorrect).

## How to catch errors

Elixir has a convention of treating errors as first-class values. Most Elixir
functions that might return unknown values will actually return an ok/error tuple.
These look like either `{:ok, "my value"}` or `{:error, "Error reason..."}`. Pattern
matching makes it easy to tell if you got a value you expected or not, and recover
without crashing. This is easier to work with than code that throws errors (because
thrown errors can be caught at higher scopes, which can be difficult to follow).
Many libraries have "bang version" of all of their functions (like `HTTPoison.get!`)
that will throw an error. I advise avoiding those.

A common way to check for errors is with a `case` statement:

```elixir
case do_something_that_might_error(args) do
  {:ok, value} -> # do something with value
  {:error, reason} -> # respond to error somehow
end
```

What if you need to perform multiple steps that depend on the intermediate results,
where each step might error? You can use [`with`][with] for that:

```elixir
with {:ok, result_a} <- might_not_work1(args),
     {:ok, result_b} <- might_not_work2(result_a),
     {:ok, result_c} <- might_not_work3(result_b) do
  # everything worked, do something useful
  # all 3 results are in scope
  ...
else
  # you can pattern match against any errors here
  {:error, :error_reason1} ->
    # handle error_reason1
    ...
  e ->
    # general error catch all
    Logger.error("Something didn't work! " <> inspect(error))
    ...
end
```

## How to respond to errors

The simplest response to an error is to crash the bot. This happens automatically
when an error is thrown. You can also crash the bot from an action by returning
`{:error, "Error reason..."}`. Or you can do so from the tree with
[`BotArmy.Actions.error`][error action].

Crashing a bot isn't always the best option. One main benefit of behavior trees is
the ability to respond to feedback and try a different action. For this reason, you
should almost always return `:fail` instead of `{:error, reason}` in your actions.
This way you can reuse the action in cases where you don't want to crash the bot.
You can always put the above error action after it in a `Node.select`.

One counter-example might be to crash the bot if you get any `500` HTTP status
responses. That way you can easily tell that something is bad if you get a lot of
dead bots in your logs.

Note that in the load test runner, when a bot dies, a new one gets started up in its
place. In the integration test runner, the test will fail if a bot dies (the test
will also fail if the entire tree `:fail`s).

[error action]: https://git.corp.adobe.com/pages/BotTestingFramework/bot_army/BotArmy.Actions.html#error/2
[with]: https://hexdocs.pm/elixir/Kernel.SpecialForms.html#with/1
