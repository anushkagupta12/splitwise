# Splitwise-Lite — Backend

Express + Node.js backend for the collaborative expense ledger. In-memory storage
(no database) — state resets when the server restarts.

## Folder structure

```
backend/
├── package.json
├── src/
│   ├── server.js                 # entrypoint — boots the HTTP server
│   ├── app.js                    # Express app assembly (separate from server.js so it's testable)
│   ├── routes/
│   │   ├── groupRoutes.js        # /api/groups, /api/groups/:groupId, /api/groups/:groupId/settlement
│   │   └── expenseRoutes.js      # /api/groups/:groupId/expenses (nested, mergeParams)
│   ├── controllers/
│   │   ├── groupController.js    # HTTP layer: parses req, calls service, shapes res
│   │   └── expenseController.js
│   ├── services/
│   │   ├── groupService.js       # group business logic (sits between controller and model)
│   │   ├── expenseService.js     # expense business logic, composes settlementService
│   │   └── settlementService.js  # CORE ALGORITHM: proportional split + debt minimization
│   ├── models/
│   │   ├── groupModel.js         # in-memory Map<groupId, Group>
│   │   └── expenseModel.js       # in-memory Map<groupId, Expense[]>
│   ├── middleware/
│   │   ├── errorHandler.js       # centralized error -> HTTP response shaping
│   │   └── notFoundHandler.js    # 404 for unmatched routes
│   └── utils/
│       └── validators.js         # payload validation (100% split check lives here)
└── tests/
    ├── settlementService.test.js # unit tests for the debt-minimization algorithm
    └── api.test.js                # integration tests against the live Express app
```

**Layer responsibilities** (why it's split this way):
- **routes** — only URL → controller wiring, no logic.
- **controllers** — HTTP concerns only (status codes, req/res shape). No business rules.
- **services** — all business logic. Framework-agnostic; could be reused outside Express.
- **models** — the in-memory "database." Swap this layer for Mongoose models later without touching services.
- **settlementService.js is pure functions** — no Express, no Map access — so it's unit-testable in total isolation.

## Setup

```bash
cd backend
npm install
npm start          # production-style start, http://localhost:4000
npm run dev         # nodemon, auto-restarts on file changes
npm test            # runs the Jest + Supertest suite
```

## API reference

Base URL: `http://localhost:4000/api`

### Groups

| Method | Path | Body | Description |
|---|---|---|---|
| POST | `/groups` | `{ name, members: string[] }` | Create a group (≥2 members) |
| GET | `/groups` | — | List all groups |
| GET | `/groups/:groupId` | — | Get one group |
| DELETE | `/groups/:groupId` | — | Delete a group and its expenses |

### Expenses (nested under a group)

| Method | Path | Body | Description |
|---|---|---|---|
| POST | `/groups/:groupId/expenses` | `{ description, amount, payer, splits }` | Add an expense |
| GET | `/groups/:groupId/expenses` | — | List expenses for a group |
| DELETE | `/groups/:groupId/expenses/:expenseId` | — | Remove an expense |

`splits` is an object mapping every group member to a percentage, e.g.
`{ "Amit": 50, "Rahul": 25, "Sneha": 25 }`. **Must total exactly 100%** (±0.05
tolerance for float rounding) or the request is rejected with `400`.

### Settlement (derived, read-only)

| Method | Path | Description |
|---|---|---|
| GET | `/groups/:groupId/settlement` | Minimized settlement for the whole group |

Example response:
```json
{
  "groupId": "01ba83e4-...",
  "members": ["Amit", "Rahul", "Sneha"],
  "expenseCount": 2,
  "netBalances": { "Amit": 150, "Rahul": -45, "Sneha": -105 },
  "settlements": [
    { "from": "Sneha", "to": "Amit", "amount": 105 },
    { "from": "Rahul", "to": "Amit", "amount": 45 }
  ],
  "sentences": [
    "Sneha owes Amit $105.00",
    "Rahul owes Amit $45.00"
  ]
}
```

`sentences` is exactly what the frontend's "Net Balances" board should render —
including `"X owes nobody (Even)"` for anyone with a zero balance.

## How the debt minimization works

Instead of tracking every pairwise IOU and netting overlaps one pair at a time,
`minimizeDebts()` in `settlementService.js`:

1. Folds every expense into one **net balance per person** (what they paid in,
   minus what they owe out, across the whole group).
2. Splits people into debtors (negative balance) and creditors (positive balance).
3. Greedily matches the largest debtor against the largest creditor, repeatedly,
   until everyone reaches zero.

This guarantees at most `members.length - 1` settlement transactions — the
mathematical minimum — rather than however many pairwise debts happen to exist.

## Example error responses

```json
// 400 — splits don't add up to 100%
{ "error": "Invalid expense payload.", "details": ["splits must total exactly 100% (got 120.00%)."] }

// 404 — group not found
{ "error": "Group \"xyz\" was not found." }
```
