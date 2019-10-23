---
title: Track current state
draft: true
---

    - ex: current user, pools, current pool
    - careful to maintain proper sync
    - all actions need to understand the internal state and deal with missing data (example of `like_post(context, post \\ nil)` that falls back to `context.selected_post`
