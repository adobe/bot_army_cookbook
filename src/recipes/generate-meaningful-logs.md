---
title: Generate meaningful logs
level: basic
---

Your bots are busy, and you need a way to keep an eye on what they are doing without
being overwhelmed.

## Built in logs

The bot army already logs lots of useful information, such as every action that
happens, tied to the bot id, plus the duration and outcome. The logs look like this:

```
12:10:51.330 bot_id=1 action=MyBots.Actions.User.create outcome=succeed duration=213 [info]
```

You can include your own custom data in each of these logs by calling
`Logger.metadata(custom: " pool_id=#{pool_id}")` for example (the key must be
`custom` and the value must start with a space).

These logs are written to `/bot_run.log`. You can send them to a log aggregator like
splunk where you can do all kinds of analysis, or inspect them locally (see some tips
to [make that easier][lnav tips]).

## Additional logging

Of course you can also add custom logs in your actions. I recommend using
`Logger.debug(...)`. This way, your custom logs are at a different level than all the
`info` and up logs that the bot army makes, which makes it easier to separate them
out if desired. See [Logger] for more details. As always, be careful about exposing
sensitive information. `Logger` is also better than `IO.inspect` or `IO.puts`,
because you have more control over its behavior. Using
`inspect(unknown_value, pretty: true)` in your logs is useful, as is string
interpolation (`"User name: #{user_name}"`).

You can also use [`BotArmy.Actions.log`][log action] in your tree to log static
information.

## Which logs matter?

Ultimately, the bot logs may be useful for debugging or for seeing timing including
latency, but your server logs are probably more useful. If you include a `session_id`
in your bot logs and your server, you can connect the logs in your aggregator for a
complete picture.

[lnav tips]: https://hexdocs.pm/bot_army/1.0.0/readme.html#logging
[custom logging]: https://hexdocs.pm/bot_army/1.0.0/BotArmy.Bot.html#c:log_action_outcome/3
[logger]: https://hexdocs.pm/logger/Logger.html#content
[log action]: https://hexdocs.pm/bot_army/1.0.0/BotArmy.Actions.html#log/2
