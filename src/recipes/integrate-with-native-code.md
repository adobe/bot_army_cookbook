---
title: Integrate with native code
level: advanced
---

At some point you may need to use the bots to drive native code, like C++ for
example. This is not for the faint of heart, but it is possible.

Erlang has a few ways of communicating with native code. The most suitable option for
the bots is using "ports." You can see a thorough example of using [Erlang ports]. A
simplified example pertaining to the bots is below.

## Ports

The idea of a port is to spawn a native process from Elixir/Erlang in a way that can
monitor if the process goes down. You can also send binary data to and from the
process via stdio. This uses the [Elixir Ports] standard library.

Here is a sample action for the bots that starts up a port:

```elixir
@doc """
Launches the provided executable

In this case, the executable is in the standard `priv` directory.
This specifies 2 bytes to prepend to each message to indicate its length.
"""
def open_port(_context, executable_path) do
  path = Path.join(:code.priv_dir(:your_apps_name), executable_path)
  Port.open({:spawn, path}, [{:packet, 2}])
  {:succeed, port: port}
end
```

Once the port has been opened and the `port` is in the context, you can send messages
to it. Here is a helper that enumerates the contract API exposed by the external
library, and does the encoding and sending of the message for you. This example uses
[Msgpack] to encode the data, but you could encode it in any binary format or a JSON
string. Notice how the integer representation of the action is prepended to the
message.

```elixir
# "Enum" of the available actions the external code understands (identified as
# integers starting with 0).
# **You need to implement the same enum in the external code!**
@actions [
           :create,
           :get_post,
           :update_post
         ]
         |> Enum.with_index(0)
         |> Map.new()

@doc """
Sends a command through the port to the indicated action with the included args.

See @actions for valid action atoms.

Opts can include a `timeout` (defaults to 5000ms).
"""
def call_port(port, action, args, opts \\ []) when is_port(port) and is_atom(action) do
  timeout = Keyword.get(opts, :timeout, 5000)

  {:ok, data} = Msgpax.pack(args)

  action_index =
    Map.get(@actions, action) ||
      raise "Invalid action: #{inspect(action)}"

  Port.command(port, [<<action_index>> | data])

  receive do
    {^port, {:data, msg}} ->
      Msgpax.unpack(msg)
  after
    timeout ->
      {:error, :timeout}
  end
end
```

With this in place, you can make actions for each API you want to call. The actions
need to interpret the response:

```elixir
@doc """
Calls the "create" api with some values.
Note that the actual created state lives in the external library!
"""
def create(%{port: port}, %{name: _, age: _} = args) do
  case call_port(port, :create, args) do
    # NULL gets sent back, which gets converted to 0
    {:ok, 0} ->
      :succeed

    other ->
      Logger.error("Unexpected response, #{inspect(other)}")
      :fail
  end
end
```

When you are done, you can close the port with the following action. If the bots
crash, the external executable will only close if you [respond to the closed stdio
channel] correctly.

```elixir
def close_port(%{port: port}) do
  Port.close(port)

  receive do
    {:EXIT, ^port, :normal} ->
      :succeed

    other ->
      Logger.error("Failed to close port, #{inspect(other)}")
      {:error, other}
  after
    1000 ->
      Logger.error("Timed out trying to close port")
      {:error, :timeout}
  end
end
```

## The executable side

You will need to add a layer to the executable to receive and handle messages over
stdio properly. The details of this depend on the language of your executable. See
the [Erlang ports] link for examples in C.

The summary is to receive messages using the first 2 bytes to determine the length,
then to check the next byte to look up the action it corresponds to, then to decode
the rest of the message to get any arguments, then to call the correct action
appropriately, encode the response, and send it back over stdio.

[erlang ports]: http://erlang.org/doc/tutorial/c_port.html
[elixir ports]: https://hexdocs.pm/elixir/Port.html
[msgpack]: https://github.com/lexmag/msgpax
[respond to the closed stdio channel]: https://hexdocs.pm/elixir/Port.html#module-zombie-operating-system-processes
