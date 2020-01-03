---
title: Wait for async results
level: advanced
---

Sometimes you need to wait for results. With Elixir and the bots, you have a few
ways of doing so, but different approaches have important consequences that you need
to be aware of.

## Concurrency at the Elixir level

Erlang, and hence Elixir was built for concurrency. Whenever you do an asynchronous
operation in Elixir, you have two options: stop what you are doing until the
operation completes, or run the operation in a separate Erlang process and continue
with what you were doing before. In the latter case, you have the opportunity to
check the result of the separate process at a later time if necessary.

The important thing to consider is which processes are OK or not OK to block while
waiting, and how you will get the results at a later time. Elixir/Erlang has a few
primitives to help with this, from a simple `recieve` that will block until the
desired response arrives, to `Task.await` that encapsulates the workflow a little
nicer, to `GenServer`s which set up a framework for a flexible "receive loop."

You learn more about [Elixir concurrency] and [GenServers] to fully understand these
concepts.

## Blocking vs.non-blocking at bot level

In the Bot Army, each individual bot is a separate process. More specifically, each
bot is a GenServer. Each action that it carries out is a potentially long-running
operation that must complete before it can move on to the next action. Furthermore,
the bot is only able to respond to anything else in between each action.

This isn't normally a problem, but if you are using a separate channel like
syncing over [websockets] or [long-polling], those updates will be blocked during the
time it takes an action to complete. Likewise, if handling a message from websockets
or long-polling takes a long time, the bot won't be able to move on to the next
action until it completes.

In some cases, this just serves to slow the bot down, which may not matter. But in
the worst case, you might get into a deadlock, like if your action blocks to wait for
the result of a websocket sync, which will never get processed, because the bot is
stuck in the action. So how do you handle asynchronous issues like this?

The basic idea is finish up the action as soon a possible, even if long-running
results have not returned, so that the bot can keep ticking, and have a plan to "come
back" to the unfinished results the next time around.

See [validating results] for an example of using `:continue` to break up a
potentially long waiting period into multiple shorter periods.

The [long-polling] recipe shows how to spawn a new process to do the slow
asynchronous work and send a message back to the bot to process later.

The [websockets] recipe shows a similar approach with more discussion.

In each of these examples, long-running operations get broken up or shunted off to
other processes to update the bot's state at a later time, and the behavior tree is
set up in a way for the bot to respond to new data in its state whenever it becomes
available, without having to block while the work happens.

If you are mindful of the issues and the approaches explored here, you should be able
to handle any async operation in your bots.

[elixir concurrency]: https://elixirschool.com/en/lessons/advanced/concurrency/
[genservers]: https://elixirschool.com/en/lessons/advanced/otp-concurrency/
[websockets]: ../use-websockets/
[long-polling]: ../use-long-polling/
[validating results]: ../repeat-actions/#limiting-retries
