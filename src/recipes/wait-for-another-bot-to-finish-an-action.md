---
title: Wait for another bot to finish an action
level: advanced
---

When writing tests, you might try to have one bot wait for another bot to complete an
action. This can be useful for "multiple session" testing. Coordinating these two
concurrent processes can be challenging, but you have a few options.

## Switch users, not bots

Depending on what you are trying to test, the simplest approach is to have a single
bot that authenticates as the first user, takes some actions, then authenticates as
the second user and continues. This is very clear to understand and orchestrate, but
it does mean that the two sessions are happening serially instead of concurrently.
Nonetheless, it can be useful, not only for tests, but also to run some simple set
up.

A very similar approach is to run the setup in the "pre" tree of an integration test.
Just keep in mind that the pre tree is a separate bot, so the context will be lost
when the pre tree completes.

## Use a wait

If you want to have separate bots, you have to coordinate between them somehow. The
most naive way of doing so is to just have the second bot go idle for however many
seconds you think the first bot needs to finish its action.

This is not a great solution though. At best, you are introducing extra unnecessary
time into your tests if you guess too long of a pause. At worst, the first bot might
take longer than expected for some reason, and your pause will be too short, leading
to flaky tests.

## Set a flag in SharedData

A more reliable approach is to have the second bot go into a [retry loop], checking
for a flag set in `SharedData`. When the first bot finishes its action, it just
needs to set that flag.

## Rely on the system under test

Perhaps the best approach, when possible, is to check the state of the system under
test to tell if the first bot has finished its work. You would use a similar retry
loop with a query against the system, or if you have a second channel for [syncing],
you would check against the context for the required condition.

[retry loop]: ../repeat-actions/#limiting-retries
[syncing]: ../use-websockets/#adding-a-second-channel-to-the-bots
