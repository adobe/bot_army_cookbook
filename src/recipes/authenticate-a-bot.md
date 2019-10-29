---
title: Authenticate a bot
level: intermediate
---

Bots can do many things. But much of the time, bots will need to be authenticated to
do anything meaningful.

A common question is "What is the relationship between bots and user accounts?" The
answer is that you can set it up how ever you want. You can have all bots use the
same account, or have a new account for every bot.

How is this done? Of course, it depends on how your services work, but here are some
possible approaches.

## Creating users at runtime

You can create users on the fly and use the same credentials to log in. This is
especially useful with integration style tests.

```elixir
# sets some constants to use in all tests (provide your own random string
# implementation)
@username random_string()
@password random_string()

# the referenced actions are simple API wrappers (not shown here)
pre(
  Node.sequence([
    action(Misc, :check_health)
    action(User, :create, [@username, @password])
  ])
)

parallel(
  "Test 1...",
  Node.sequence([
    # `log_in` should save the username and returned session token in the
    # context for subsequent actions to use
    action(User, :log_in, [@username, @password])
    # ...
  ])
)

parallel(
  "Test 2...",
  Node.sequence([
    action(User, :log_in, [@username, @password])
    # ...
  ])
)

post(
  Node.sequence([
    action(User, :delete, [@username, @password])
  ])
)
```

## Using a pool of existing users

You might not want to create users as part of your test, especially if you are load
testing and/or you use an external service to authenticate. In that case you can
create a pool of user accounts to draw from when logging in. You probably won't be
able to (or want to) make as many user accounts as bots you plan on running, which
means there will be some "sharing" of accounts. Think of it as having multiple users
working on multiple devices at the same time with the same account.

```elixir
# - In User Action -

# Step 1: create `num_accounts` accounts in format "bot_test_n@myservice.com"
# (They can all use the same password, or hash their name with a salt, etc)

# Step 2: select from this preexisting set of accounts

@num_accounts 500
@common_password "$up3r_$af3"

@doc """
Logs in with the provided username, or chooses a random one.

Stores the received token in the context.
"""
def log_in(
      context,
      username \\ "bot_test_#{:rand.uniform(@num_accounts)}@myservice.com"
    ) do
  Logger.debug(fn -> "Logging in as #{username}" end)

  # API wrapper not shown
  {:ok, token} = APIWrapper.log_in(username, @common_password)

  {:succeed, token: token, username: username}
end
```

## Authorizing actions after having logged in

Usually you receive some kind of session token after authenticating. You'll need to
hold on to this token in the `context` for subsequent actions to use when making
authenticated API calls.

One last thought - an alternative to having a pool of users is having a pool of
tokens to draw from. You would need some separate service that took care of logging
in and obtaining tokens and making them available, but it would let you avoid having
an authentication step in your tests.
