---
title: "Why Bots?"
---

We have many testing tools available to choose from.  Why use the "bot army?"

The bot army was built for one purpose - to simulate _real_ users.

Many testing tools provide either a way to describe static sequences of actions or a 
way to blindly hammer an API.  This is not how real users will use your app or 
service.  Real users choose what to do based on where they have already been.  Real users 
respond to the data they have available.  Real uses have different personalities that 
affect what they do. 

Bots simulate real users by using the same AI technology that powers 
non-player-characters in video games.  Specifically, they use [Behavior 
Trees](../why-behavior-trees).  The benefit of using behavior trees is that they are 
powerful and flexible enough to describe "organic," reactive behavior, yet fairly 
simple to write.  They are especially good at allowing you to build up complex 
behavior by nesting smaller, simpler trees.


### Bots are:

- Stateful - Each bot has its own "memory" of what it has done and seen.
- Flexible - Each bot follows its behavior tree "template."
- Organic -  Each bot reacts to its context, based on what is available now, and what 
 it has already done.
- Independent - Each bot lives in its own (Elixir) process, allowing bots to run 
 concurrently with full encapsulation.


### Bot use cases:

- Automate tests
- Test performance under _realistic_ load
- Test/discover edge conditions
- Perform generic tasks
