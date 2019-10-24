---
title: Control the number of actions per second
---

When load testing, obviously the goal is to generate lots and lots of traffic. You
might be wondering how bots relate to traffic. Also, you might want to control the
amount of actions per second (where "action" refers to any event that puts load on
your system under test).

Two factors control the rate of actions:

- The number of bots you have running at the same time
- The frequency each bot performs a relevant action

How you balance these two factors affects the type of load you will generate. You
might want your bots to emulate users as realistically as possible. Users don't
perform multiple actions per second like the bots can, so you might need to slow the
bots down to be more realistic.

Alternatively, you might want to pound your system as hard as possible, so you will
try to make the bots go as fast as possible. You could also have a hybrid approach
(some fast bots, some "normal" speed bots).

## Slowing the bots down

Generally, you'll need to put the breaks on the bots. The recommended way to do so
is to use the [`BotArmy.Actions.wait`][1] action in your tree. You can supply the
time to wait (in _seconds_). There is also a version that waits for a random time
between two bounds.

[1]: https://git.corp.adobe.com/pages/manticore/bot_army/BotArmy.Actions.html#wait/2
