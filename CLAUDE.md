# CLAUDE.md

## Repo

- `nation-strategy-web/`: Vite + TypeScript web app (Nation strategy scenes, timeline, PDF export). See its `README.md` and `CHANGELOG.md`.

## TypeSafe Jev: use it for structured decisions

Jev (TypeSafe's System One model) is available in this environment. Use it whenever a task needs a **structured decision** rather than generated text:

- **Yes/no check** → `noul`. Examples: "Is this email urgent?" or "Does this document mention a deadline?"
- **Pick one of a fixed set** → `choice`. Examples: sort items into categories, route a request, pick the right scene or owner.
- **Rate on a rubric** → `score`. Examples: urgency, risk, quality, priority levels.
- **Many items, same question** (sorting a list of emails, tasks, passages or records) → batch all of the questions into one call.

Do **not** use Jev to write text, code, summaries or translations. Jev can't do those, so do them yourself as usual. When a decision is trivial or can be written as a plain code rule, skip Jev.

When you use Jev during a task, tell the user which questions you asked and show the probability or confidence that came back.

### Calling the API

The environment's proxy adds the API key to requests automatically. Don't set, ask for, print or commit a key.

```bash
curl -sS https://api.typesafe.ai/v1/systemone \
  -H 'Content-Type: application/json' \
  -d '{
    "state": "Help! My payouts have been failing for 3 days.",
    "model": "jev-latest",
    "questions": {
      "is_urgent":  { "type": "noul",   "instructions": "Does this convey urgency?" },
      "department": { "type": "choice", "instructions": "Which team should handle this?",
                      "criteria": { "billing": "Payments, refunds", "technical": "Bugs, outages", "sales": "Pricing, upgrades" } },
      "frustration":{ "type": "score",  "instructions": "How frustrated is the customer?",
                      "criteria": ["Calm", "Frustrated", "Very angry"] }
    }
  }'
```

- `state` can be a string, or a JSON object or array for structured data.
- Question ids are your own keys. Answers come back under the same keys.
- Answers:
  - `noul` → `{"noul": 0.95}`
  - `choice` → `{"choice", "probabilities", "confidence"}`
  - `score` → `{"score", "legend", "probabilities", "confidence"}`
- `choice.criteria` is a map of option to description (max 255 options). `score.criteria` is an ordered array of 2–10 levels.
- `GET https://api.typesafe.ai/v1/models` lists the available models (`jev-latest`, `jev-preview`).
- Full docs: https://docs.typesafe.ai/llms.txt and https://docs.typesafe.ai/api.md

### Rules

- **Code stays in control.** Jev returns probabilities. Your code or your own judgment applies thresholds and takes the action.
- **Use confidence as a gate.** When a result has low confidence, or a `noul` answer is near 0.5, don't act on it automatically. Flag the item for the user to review.
- **Keep the key server-side.** If you build Jev into an app, call it from a server or edge function. Never call it from browser code in `nation-strategy-web`, because that would expose the key.
