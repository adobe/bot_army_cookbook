---
title: Fetch data from an HTTP endpoint
---

When writing bots you will probably need to talk to a server over HTTP sooner or
later. Elixir/Erlang has several options to do so. Here is an example using a common
library set up.

## Making calls with [HTTPoison][1] and [Jason][2]

[HTTPoison][1] is a popular elixir HTTP library, and [Jason][2] is the standard
library for encoding and decoding JSON. You can add both to your bot project as
dependencies by adding them to the `deps` section of your `mix.ex` file:

```elixir
defp deps do
  [
    {:credo, "~> 1.1", only: [:dev, :test]},
    {:behavior_tree, "~> 0.3.0"},
    {:bot_army, path: "vendor/bot_army/"},
    {:httpoison, "~> 1.6"},
    {:jason, "~> 1.1"}
    # other deps...
  ]
end
```

Requests are straightforward, but read the HTTPoison documentation for full options.

A `GET` looks like:

```elixir
resp = HTTPoison.get!(url)
```

A `POST` is similar, but includes an encoded body and headers:

```elixir
headers = [{"Content-Type", "text/plain"}, {"charset", "utf-8"}]
body = %{field1: "value 1"} |> Jason.encode!()
resp = HTTPoison.post!(url, body, headers)
```

## Handling errors

Since requests can fail, you should handle errors. In Elixir you could use a [`case`
statement][3], but when you have a "chain" of operations that could error, [`with`
statements][4] are very useful. Each line indicates the operation and corresponding
expected result. Each result can be used on the lines beneath it, and in the body. If
any result does not match the expected result, it will jump to the `else` section,
where you can pattern match the actual value to respond appropriately.

In this example we "chain" together making a request and decoding the result. Note
how we use the non-throwing version of the functions (ie. `get` instead of `get!`).
Finally we pattern match on the error types that the libraries provide:

```elixir
with {:ok, %HTTPoison.Response{status_code: 200, body: body}} <- HTTPoison.get(url),
     {:ok, decoded} <- Jason.decode(body) do
  Logger.info(inspect(decoded, pretty: true))
  :succeed
else
  {:ok, %HTTPoison.Response{status_code: 404}} ->
    Logger.error("Not found :(")
    :fail

  {:error, %HTTPoison.Error{reason: reason}} ->
    Logger.error(inspect(reason))
    :fail

  {:error, %Jason.DecodeError{} = err} ->
    Logger.error(inspect(err))
    :fail
end
```

## Making an API wrapper

You may find it useful to create a separate file for the API that you are making
requests against, that encapsulates the details of each request. Not only is this
easier to call in your actions, but you could potentially "swap out" API wrappers
based on a runtime config, which can be a powerful technique.

HTTPoison has an option to help you [create an API wrapper][5] if you are interested.

[1]: https://hexdocs.pm/httpoison/HTTPoison.html
[2]: https://hexdocs.pm/jason/readme.html
[3]: https://elixirschool.com/en/lessons/basics/control-structures/#case
[4]: https://elixirschool.com/en/lessons/basics/control-structures/#with
[5]: https://hexdocs.pm/httpoison/readme.html#wrapping-httpoison-base
