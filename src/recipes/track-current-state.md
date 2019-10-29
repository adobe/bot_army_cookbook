---
title: Track current state
level: basic
---

Each bot has a `context` or current state (also called a "blackboard" in Behavior
Trees parlance). This context is available as the first parameter to every action,
and actions can return data they want to merge into the context.

You can use this state how ever you want, and it is the only way to pass data between
actions. The only caveat is to make sure that any data you expect to find in the
context will actually be there from a previous action. You can keep your actions
atomic by separating operations across actions and passing data forward in each step.
For example:

```elixir
def tree do
  Node.sequence([
    # sets `context.token` for other actions to use to authenticate
    action(User, :log_in),
    # sets `context.albums` list
    action(Albums, :fetch),
    # chooses an album from `context.albums` and sets `context.current_album`
    action(Albums, :select, [[random: true]]),
    # updates the album with the id from `context.current_album`
    action(Albums, :update_name, ["new name"])
  ])
end
```

This works well, but it does mean you have to know what is in your context, which
adds cognitive load, and isn't very visible. It also means your actions should deal
with missing information appropriately. Perhaps this means failing or erroring, or
perhaps your actions have a fallback value to use. Make sure to use
`Map.get(context, :my_key, my_fallback)` if you want to avoid unexpected "key not
found" errors. You could also pattern match, like this:

```elixir
# In Actions.Albums
def select(%{albums: albums} = context, opts) when is_list(albums), do: ...
def select(_), do: :fail
```
