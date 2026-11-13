# Review triage log

Copy this table into your pull request description or a comment. One row per finding, from Copilot or from a human.

| # | Source (Copilot / human) | File:line | Finding | Verdict | Action | Gate it belongs in |
| --- | --- | --- | --- | --- | --- | --- |
| 1 |  |  |  | Valid-blocking / Valid-non-blocking / False positive / Unclear | Fixed / Replied / Instruction added | Review / CI test / CodeQL / Human |

## Turning false positives into standards

When a finding is wrong because Copilot does not know a team convention, write the convention down instead of dismissing the finding each time:

1. Add one sentence to `.github/copilot-instructions.md` (repository-wide) or a `.github/instructions/*.instructions.md` file (path-specific).
2. Include the change in the same pull request. Copilot reads instructions from the head branch, so re-requesting a review tests the new instruction immediately.
3. Keep instructions short and specific. Long instruction files raise review cost and dilute important rules.

