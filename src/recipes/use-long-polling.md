---
title: Use long-polling
level: advanced
---

If your system uses long-polling, then your bots will have to long-poll too, to
create an accurate test. You have two ways of doing this.

## Blocking

The simplest way to long-poll is to repeatedly make HTTP requests (with an
appropriately long timeout). You could do this in a recursive loop, or as a
[repeating action]. For example:

```elixir
# infinite loop long-poll action
def long_poll(context) do
  _response = HTTPoison.get!(@long_poll_url, @headers, timeout: 300)
  # recur
  long_poll(context)
end
```

While this effectively represents long-polling, it presents a problem - the bot can't
do anything else. The bot is either waiting for a response, or starting a new
request. The bot will never get a chance to perform any other actions.

This probably isn't what you want, though it can be useful for performance metrics.
For example, [split up] your bots to have half busy long-polling, and the other half
making writes. This won't be an accurate load on your system, but it can give you
useful metrics.

## Non-blocking

For a more accurate representation, where bots can both long-poll _and_ do their
normal routine at the same time, you need to set up a concurrent asynchronous
long-polling mechanic.

The way to do this in Elixir is to create another Erlang process, which is simple and
light-weight. The idea is to kick off the recursive long-poll in a [separate
process]. Each time it gets a response, it needs to update the bot, then poll again.
Because the bot's process isn't tied up waiting for a response, it can do other
things.

The part that I glossed over is how the long-polling process "updates" the bot. Each
bot is actually a [`GenServer`], so the long-polling process can [`call`] it with
update messages. The bot will process the message in between actions, giving you a
chance to update the context.

In order to handle the incoming message, you need to extend your bot with a custom
[`BotArmy.Bot`]. Depending on how you set it up, you can also include logic to switch
between different feeds, as well as conditionally stop a specific feed. Here's an
example:

```elixir
# In MyActions.ex

@doc """
Action to kick off a long-polling process for the active feed.

Only call this action once to initialize the process.  If the active feed changes,
you should call this again with the new feed id.

Make sure to handle the update messages in a custom `BotArmy.Bot`.
"""
def start_long_polling(%{active_feed_id: feed_id}) when is_binary(feed_id) do
  bot_pid = self()
  long_poll_url = @url_base <> "/feeds/#{feed_id}"
  headers = []

  # This starts a new process, and does not block the bot.  Since it is linked to the
  # bot, if either process crashes, the other one will too.  In this case, if the
  # long-poll request errors, the bot will die.
  spawn_link(fn ->
    # wrap the long-polling steps in a function so it can recur
    do_long_poll = fn ->
      # Make the long-poll, blocking until it returns
      %{body: body, status_code: 200} = HTTPoison.get!(long_poll_url, headers, timeout: 300)

      # Send the response to the bot, blocking until the bot handles it and replies.
      # The message is a tuple that we need to create a `handle_call` for in our custom
      # bot.  In this case, the bot's reply is a boolean for if we should poll again.
      continue_polling? =
        GenServer.call(bot_pid, {:long_poll_response, feed_id, Jason.parse!(body)})

      if continue_polling? do
        # recur
        do_long_poll()
      else
        # exiting with `:normal` will quit the polling process without quitting the bot
        exit(:normal)
      end
    end

    # kick off the initial long-poll
    do_long_poll()
  end)
end

# In MyBot.ex
# Be sure to specify `--bot MyBot` when running the tests, see
# https://git.corp.adobe.com/pages/BotTestingFramework/bot_army/Mix.Tasks.Bots.IntegrationTest.html#content

defmodule MyBot do
  @moduledoc """
  Extended `BotArmy.Bot` to handle long-polling updates.

  See https://git.corp.adobe.com/pages/BotTestingFramework/bot_army/BotArmy.Bot.html#module-extending-the-bot
  """

  # You need this line to get all of the base `Bot` functionality
  use BotArmy.Bot

  @doc """
  This matches the message sent from a long-polling process.  It receives the
  response from the poll and replies with a boolean whether the long-polling should
  continue or not, based on if the active feed changed since the long-poll started.
  """
  @impl GenServer
  def handle_call({:long_poll_response, feed_id, response}, _from, context) do
    # Note that `context` is the same state of the bot used in the actions.

    # Make sure the response is for a feed that we still care about
    if feed_id == context.active_feed_id do
      # update the context however you need to based on the long-poll response
      new_context = Map.put(context, :feed_data, response)
      {:reply, true, new_context}
    else
      # The active feed changed, so we ignore the obsolete response and reply not to
      # continue polling.
      {:reply, false, context}
    end
  end
end
```

[repeating action]: ../repeat-actions/
[split up]: ../use-different-trees-for-different-bots/
[`task`]: https://hexdocs.pm/elixir/Task.html
[separate process]: https://elixir-lang.org/getting-started/processes.html
[`genserver`]: https://hexdocs.pm/elixir/GenServer.html
[`call`]: https://hexdocs.pm/elixir/GenServer.html#call/3
[`botarmy.bot`]: https://git.corp.adobe.com/pages/BotTestingFramework/bot_army/BotArmy.Bot.html#module-extending-the-bot
