---
title: Do browser UI testing
level: advanced
---

Can the bots use a browser? Yes they can. It's pretty simple actually, you just need
to use [Hound], an Elixir browser automation library, in your actions. In that way,
it's not much different from using an HTTP library. In fact, you could create both an
HTTP adapter, and a Hound adapter with the same API for your actions to call, and
switch them out at runtime as needed. In other words, you can use the same bot trees
and actions to run both API level tests and browser UI tests!

Getting set up is super easy - I've created a [UI testing demo][demo] repository with
full instructions and examples that you can just clone and modify as needed. Be sure
to read the Hound docs.

UI testing is notoriously flakey. You can mitigate problems if you are disciplined.
Here are a few tips:

- Be mindful of what you use as selectors. `:text` is simple and closest to what the
  user will actually see, but if it changes (or you try to run your tests on a
  different internationalization language) your tests will break. `:class`es are a
  bad choice because they too can change, just like `:tag`s. `:id`s or `:name`s are
  better.
- Clear separation of layers goes a long way. Luckily, the bots are already set up
  in clear layers: the tree describes the test, the actions perform the work, and if
  you've set up an adapter as suggested, that has the implementation specific calls.
- Just like actions, being atomic is a very good practice in your adapter's API. For
  a complex page, creating a [page object] is very useful.
- The hard part about browser testing is that sometimes elements haven't loaded yet
  when you try to test for them. Hound has a built-in retry system for most actions
  that involve inspecting the DOM. But some actions, like checking the page's title
  do not have built-in retries, and you might sometimes need them. See the
  [retry_with_timeout] example in the demo repo's actions for a simple generic
  retry implementation.

Happy automating!

[hound]: https://hexdocs.pm/hound/readme.html
[demo]: https://git.corp.adobe.com/schomay/bot_army_ui_testing_demo
[page object]: https://github.com/samueljseay/page_object
[retry_with_timeout]: https://git.corp.adobe.com/schomay/bot_army_ui_testing_demo/blob/master/lib/actions/cookbook.ex#L117
