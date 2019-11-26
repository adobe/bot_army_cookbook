---
title: Use websockets
level: advanced
---

One great thing about the bots is that you can extend them to act as a full client to
your server. If your clients sync over websockets, then your bots need to sync over
websockets too. While this does involve some more advanced programming and
maintenance, it is very doable. An added benefit to treating your bots as a first
client is that they can act as a [canary release] test without exposing real users to
possible bugs.

## Adding a second "channel" to the bots

The tricky thing about websockets (like [long-polling]) is that they are asynchronous
(meaning that messages can arrive at any point in your flow of execution) and
long-running (meaning messages continue to arrive throughout the lifetime of the
bot). This is problematic because if the bots are actively waiting for websocket
messages to come in, they can't do anything else in the mean time. How can you get
the bots to do two things at once?

The answer to concurrency issues like this in Erlang is almost always to add another
[process]. The idea is that each bot can have a "companion" process that takes care
of listening for websocket messages, and when one does arrive, it sends a message to
the bot, which the bot can handle in between performing actions.

A way to think about it is to consider the sequence of actions that the bot
continually runs through as one channel of control flow, and the stream of messages
that arrive from websockets as a secondary channel that gets merged in.

## Extending the bot

In order to handle this second channel, and to set up a websocket client in the first
place, you will need to customize the bot. [`BotArmy.Bot`] gives you a way to do
this.

First, you have to set up a websocket client like [websockex]. This library handles
the low-level work of managing a websocket connection. It does this all in a new
process, connected to the bot. You can instruct it how to handle incoming messages
and use it to send outgoing ones. In this case, incoming messges will be forwarded to
the bot. Each bot will have its own connected websockex process that it communicates
with.

Second you need to instruct the bot how to handle the forwarded incoming websocket
messages. Each bot is a [`GenServer`], so you use the normal [`handle_call`]
functionality.

Here is a full, annotated example:

```elixir
# In MyActions.ex

# Make sure to call this once when your bot starts
def set_up_websocket(_context) do
  {:ok, websockex_pid} = MyWebSocket.start_link(self())
  {:succeed, websockex_pid: websockex_pid}
end

# Here is how you send a websocket message in your actions
def send_websocket_message(%{websockex_pid: websockex_pid}) do
  msg = "hello world"

  case WebSockex.send_frame(websockex_pid, msg) do
    :ok ->
      :succeed

    {:error, reason} ->
      Logger.error(inspect(reason))
      :fail
  end
end

# In MyWebSocket.ex

defmodule MyWebSocket do
  @moduledoc """
  A separate process that manages websocket messaging.

  Each bot has its own WebSocket process.
  """
  use WebSockex

  @url "ws://example.com"

  @doc """
  Start a new websocket process.

  Pass it the `pid` of the bot so it can forward messages to it.
  Note that these processes are linked, so if one crashes, the other will die too.
  """
  def start_link(bot_pid) when is_pid(bot_pid) do
    # The bot_pid is the only thing stored in this process's state, but you could
    # store more if you want to.  It will be available in each handle_frame function.
    WebSockex.start_link(@url, __MODULE__, bot_pid)
  end

  # Frames will be one of these https://hexdocs.pm/websockex/WebSockex.html#t:frame/0
  # In this case we ignore the various heartbeat messages
  def handle_frame({:text, msg}, bot_pid) do
    # This will block until the bot handles this message and replies `:ok`.  Any
    # other reply will crash both processes.
    :ok = MyBot.handle_websocket_message(bot_pid, msg)

    # You can respond as in https://hexdocs.pm/websockex/WebSockex.html#c:handle_frame/2
    # In this case we just return successfully.
    {:ok, bot_pid}
  end

  # Heartbeat messages fall through here
  def handle_frame(_other, bot_pid), do: {:ok, bot_pid}
end

# In MyBot.ex
# Be sure to specify `--bot MyBot` when running the tests, see
# https://git.corp.adobe.com/pages/BotTestingFramework/bot_army/Mix.Tasks.Bots.LoadTest.html#content

defmodule MyBot do
  @moduledoc """
  Extended `BotArmy.Bot` to handle websockets.

  See https://git.corp.adobe.com/pages/BotTestingFramework/bot_army/BotArmy.Bot.html#module-extending-the-bot
  """

  # You need this line to get all of the base `Bot` functionality
  use BotArmy.Bot

  @doc """
  A handy helper to call when websocket messages arrive.
  """
  def handle_websocket_message(bot_pid, msg),
    do: GenServer.call(bot_pid, {:websocket_message, msg})

  @doc """
  This handler matches the formated :websocket_message tuple from `handle_websocket_message`.
  """
  @impl GenServer
  def handle_call({:websocket_message, msg}, _from, context) do
    # Note that `context` is the same state of the bot used in the actions.

    # update the context however you need
    new_context = do_syncing(context, msg)

    # we use `call` (instead of `cast`) and return `:ok` just to acknowledge the
    # message was received.
    {:reply, :ok, new_context}
  end
end
```

Whenever dealing with concurrency, be sure to consider race conditions. For example,
if the bot leaves a websocket "topic" in an action, but a message for that topic
already landed during the same time period, then you would want to ignore that
message. You can check for this problem by tracking topics you care about in the
`context`, then comparing them against the received message. (Topics are a convention
to classify messages, like `"my_topic:my_message"`).

One final point to keep in mind is that since the bot only checks for new messages in
between actions, if an action ever [blocks] or takes a long time to run, you will be
delayed in handling any received websocket messages.

[canary release]: https://martinfowler.com/bliki/CanaryRelease.html
[long-polling]: ../use-long-polling/
[process]: https://elixir-lang.org/getting-started/processes.html
[`botarmy.bot`]: https://git.corp.adobe.com/pages/BotTestingFramework/bot_army/BotArmy.Bot.html#module-extending-the-bot
[websockex]: https://hexdocs.pm/websockex/readme.html
[`genserver`]: https://hexdocs.pm/elixir/GenServer.html
[`handle_call`]: https://hexdocs.pm/elixir/GenServer.html#c:handle_call/3
[blocks]: ../wait-for-async-results/
