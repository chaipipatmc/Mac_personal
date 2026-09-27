# Project notes for Claude

## TypeSafe (Jev)

The TypeSafe plugin (`typesafe@typesafe-ai`) is enabled in `.claude/settings.json`.
When a feature in this project needs a typed AI judgment (routing, ranking,
classification, verification), use the `typesafe:typesafe-ai` skill and follow
the live docs at https://docs.typesafe.ai.

- The API key is read from the `TYPESAFE_API_KEY` environment variable. Never
  print it, ask for it in chat, or commit it.
- Keep calls server-side; never ship the key to the browser build of
  `nation-strategy-web`.
