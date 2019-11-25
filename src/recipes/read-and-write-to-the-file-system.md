---
title: Read and write to the file system
level: advanced
---

Need to interact with the local file system? It's easy with Elixir, just use the
[File.*] module.

If you are trying to download a file, the best way to go is to stream it from a
remote URL to your file system directly, which can be quicker and avoids filling up
memory on your server. The simplest way to do so is with this Erlang snippet:

```elixir
# Note, this is Erlang, so it looks odd, but it runs fine, and it is built in
# Just note, in Erlang, you need to use single quoted strings
# Also you need these two lines
:inets.start()
:ssl.start()
# This path is relative to the current working directory (see File.cwd/0)
save_path = '/mypic.jpg'
image_url = 'http://exmple.com/img/pic1.jpg'
:httpc.request(
  :get,
  {image_url, []},
  [],
  body_format: :binary,
  stream: save_path
)
```

[file.*]: https://hexdocs.pm/elixir/File.html
