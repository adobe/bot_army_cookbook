---
title: Do mobile application UI testing
level: advanced
---

The bots can test your mobile applications by using [Appium], a standard tool similar
to [Selenium], used to test mobile applications via their built in accessibility
constructs. Both Appium and Selenium work as simple HTTP servers exposing the
standardized [WebDriver specification]. Appium adds additional endpoints for mobile
specific needs.

Using Appium is a simple as starting an Appium server (see their docs), then making
HTTP requests against that server using the WebDriver protocol. Appium has libraries
in many different languages to facilitate this process. Unfortunately, at this time,
it does not have a client library written for Elixir. You can _almost_ use one of the
web automation clients (like Hound), but that doesn't quite work. Making it support
Appium would not be a huge effort, so perhaps that will exist in the future. In the
meantime, making HTTP requests directly is a simple alternative.

In my experiments, I found that creating a minimal Appium HTTP wrapper using
[HTTPoison.Base] gets me 80% of the way towards a simple way of calling Appium.
Below is an example of such a wrapper:

```elixir
defmodule Drivers.AppiumAPI do
  @moduledoc """
  Wrapper for appium http api

  See http://appium.io/docs/en/commands/status/ (and other commands dropdown) and
  https://w3c.github.io/webdriver/
  """

  use HTTPoison.Base
  require Logger

  # This is the standard appium port and path prefix
  @base_url "http://localhost:4723/wd/hub"

  # These headers are required
  @default_headers [{"Content-Type", "application/json"}, {"charset", "UTF-8"}]

  @impl HTTPoison.Base
  def process_url(path), do: @base_url <> path

  @impl HTTPoison.Base
  def process_request_headers(headers), do: @default_headers ++ headers

  @impl HTTPoison.Base
  def process_request_options(options), do: [recv_timeout: 60_000] ++ options

  @impl HTTPoison.Base
  def process_response_body(body) do
    case Jason.decode(body) do
      {:ok, %{"status" => 0} = res} ->
        {:ok, res}

      {:ok, res} ->
        {:error, res}

      e ->
        e
    end
  end

  @doc """
  Use this for specific GET apis.  Make sure the path includes the session id if needed.
  """
  def do_get(path), do: get(path) |> handle_response

  @doc """
  Use this for specific POST apis.  Make sure the path includes the session id if needed.
  """
  def do_post(path, body, opts \\ []),
    do: post(path, Jason.encode!(body), [], opts) |> handle_response

  @doc """
  A helper to find an element
  """
  def find(session_id, {using, value}) do
    body = %{
      using: using,
      value: value
    }

    case do_post("/session/#{session_id}/element", body) do
      {:ok, %{"value" => %{"ELEMENT" => element_id}}} -> {:ok, element_id}
      {:ok, e} -> {:error, e}
      e -> e
    end
  end

  @doc """
  A helper to click an element (pass the selector to use)
  """
  def click(session_id, {using, value}) do
    with {:ok, element_id} <- find(session_id, {using, value}),
         {:ok, _} <- do_post("/session/#{session_id}/element/#{element_id}/click", %{}) do
      :ok
    else
      e ->
        Logger.error(inspect(e, pretty: true))
        e
    end
  end

  # TODO add other semantic api wrappers here...

  defp handle_response(response) do
    case response do
      {:ok, %HTTPoison.Response{status_code: 200, body: {:ok, value}}} ->
        {:ok, value}

      {:ok, %HTTPoison.Response{status_code: 200, body: body}} ->
        Logger.error(inspect(body, pretty: true))
        body

      {:ok, %HTTPoison.Response{status_code: _} = res} ->
        Logger.error(inspect(res, pretty: true))
        {:error, res}

      e ->
        Logger.error(inspect(e, pretty: true))
        e
    end
  end
end

```

You can call the wrapper from your actions like this:

```elixir
def start_session(_context) do
  app_path =
    "/full/path/to/the/app/file"

  # adjust these as needed based on your testing target
  # see http://appium.io/docs/en/about-appium/getting-started/index.html
  body = %{
    desiredCapabilities: %{
      app: app_path,
      automationName: "UiAutomator2",
      platformName: "Android",
      platformVersion: "10",
      deviceName: "Nexus 5X API 29 x86",
      appPackage: "com.yourorg.yourapp",
      appActivity: "com.yourorg.yourapp.youractivity"
      newCommandTimeout: 60 * 5
    }
  }

  IO.puts("\nUsing capabilities:" <> Jason.encode!(body))

  # The timeout needs to be really big because it takes forever to start up the
  # simulator
  case Drivers.AppiumAPI.do_post("/session", body) do
      {:ok, %{"sessionId" => id}} ->
        {:succeed, session_id: id}

    _ ->
      :fail
  end
end

def open_menu(%{session_id: session_id}) do
  menu_selector = {"xpath", "menuid"}

  case Drivers.AppiumAPI.click(session_id, menu_selector), do
    :ok ->
      :succeed

    _ ->
      :fail
  end
end

def validate_menu_text(%{session_id: session_id}, expected_text) do
  menu_selector = {"xpath", "menuid"}

  with {:ok, element_id} <- Drivers.AppiumAPI.find(session_id, menu_selector),
       {:ok, %{"value" => actual_text}} when actual_text == expected_text <-
         Drivers.AppiumAPI.do_post("/session/#{session_id}/element/#{element_id}/text", %{}) do
    :succeed
  else
    e ->
      Logger.error(inspect(e, pretty: true))
      :fail
  end
end
```

You can see the full Appium API by browsing the "Commands" menu drop-down on their
documentation linked above. Also be sure to get the session configuration correct,
otherwise you won't be able to start a session. Also, the Appium Desktop application
is a useful tool to visualy find the proper selectors for any element. Finally see
the tips for [browser UI testing].

To run your tests, make sure the Appium server is running, and either the actual
device or simulator you wish to test on is configured and ready according to their
documentation, then run your bot tests as normal.

[appium]: http://appium.io/docs/en/about-appium/intro/?lang=en
[selenium]: https://selenium.dev/
[webdriver specification]: https://w3c.github.io/webdriver/
[httpoison.base]: https://hexdocs.pm/httpoison/readme.html#wrapping-httpoison-base
[browser ui testing]: ../do-browser-ui-testing/
