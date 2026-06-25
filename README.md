# Splitwise-Lite

A collaborative group expense ledger: log shared bills, split them by
percentage slider, and see a minimized list of who owes whom.

```
splitwise-lite/
├── backend/    Express + Node.js REST API, in-memory storage
└── frontend/   React 19 + Vite + Tailwind CSS v4
```

## Run both together

Open two terminals.

**Terminal 1 — backend** (http://localhost:4000)
```bash
cd backend
npm install
npm start
```

**Terminal 2 — frontend** (http://localhost:5173)
```bash
cd frontend
npm install
npm run dev
```

Open `http://localhost:5173` in a browser. The frontend talks to the backend
via the URL in `frontend/.env` (`VITE_API_BASE_URL`), defaulting to
`http://localhost:4000/api`.

## What's inside

- **backend/README.md** — full API reference, folder structure, and an
  explanation of the debt-minimization algorithm.
- **frontend** — see the architecture notes below.

### Frontend architecture

```
frontend/src/
├── api/             # axios client + typed functions per resource (groups, expenses)
├── hooks/
│   └── useGroup.js  # owns all group/expense/settlement state, talks to api/
├── components/
│   ├── GroupSetup.jsx       # name the group, add members, "Start the tab"
│   ├── BillForm.jsx         # description, amount, payer, percentage sliders
│   ├── PercentSlider.jsx    # single slider row
│   ├── SettlementBoard.jsx  # the receipt-style "Net Balances" card
│   ├── ExpenseLedger.jsx    # list of logged expenses, deletable
│   └── TopBar.jsx           # group name + "End tab"
├── lib/
│   └── format.js   # money formatting, color-per-person, even-split helper
├── App.jsx          # wires everything together, owns loading/error states
└── index.css        # Tailwind v4 theme tokens (@theme block) + signature "torn-edge" utility
```

The active group's id is kept in `localStorage`, so refreshing the page
restores the same tab instead of starting over (as long as the backend is
still running and hasn't restarted, since storage is in-memory).

### How the percentage sliders enforce 100%

Dragging one person's slider proportionally rescales the *other* sliders to
absorb the difference — so the total is mathematically pinned at 100% at all
times. There's no invalid intermediate state to block; the submit button is
disabled only as a safety net against floating-point rounding dust.

### Design notes

The settlement board is styled like a torn receipt — `font-mono` for names
and amounts, a dashed divider between settlements and "even" people, and a
masked torn edge at the bottom of the card. Each person gets a fixed color
(amit/rahul/sneha + a neutral fallback) defined as CSS custom properties in
`index.css`'s `@theme` block, so it's consistent across the slider dots,
settlement sentences, and ledger entries.

## Notes on persistence

Both the backend's in-memory store and the frontend's localStorage pointer
are dev-only conveniences. If you restart the backend, all groups/expenses
are gone — the frontend will detect the missing group on next load and drop
back to the setup screen automatically.
