---
title: Use random values
draft: true
---

    - in trees
    - as default function params
    - beware of compile time random values that don't change
    - succeed-rate
    - seeding random for repeatability
        - careful of external dependencies (num pools in context)

          iex(1)> :rand.seed(:exsplus, {1, 2, 3})
          iex(2)> Enum.map(1..5, fn _ -> :rand.uniform(10) end)
          [4, 3, 8, 1, 6]
          iex(3)> :rand.seed(:exsplus, {1, 2, 3})
          iex(4)> Enum.map(1..5, fn _ -> :rand.uniform(10) end)
          [4, 3, 8, 1, 6]

