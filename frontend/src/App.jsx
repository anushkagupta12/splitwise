import { useGroup } from "./hooks/useGroup";
import GroupSetup from "./components/GroupSetup";
import BillForm from "./components/BillForm";
import SettlementBoard from "./components/SettlementBoard";
import ExpenseLedger from "./components/ExpenseLedger";
import TopBar from "./components/TopBar";

function ConnectionError({ message }) {
  return (
    <div className="mx-auto max-w-md rounded-xl border border-owed/30 bg-owed-soft px-5 py-4 text-sm text-owed">
      <p className="font-medium">Couldn't reach the server.</p>
      <p className="mt-1 text-owed/80">{message}</p>
      <p className="mt-2 text-xs text-owed/70">
        Make sure the backend is running on <code className="font-mono">localhost:4000</code>.
      </p>
    </div>
  );
}

export default function App() {
  const {
    group,
    expenses,
    settlement,
    loading,
    error,
    setError,
    startGroup,
    submitExpense,
    removeExpense,
    endGroup,
  } = useGroup();

  async function handleCreate(name, members) {
    await startGroup(name, members);
  }

  async function handleSubmitExpense(payload) {
    await submitExpense(payload);
  }

  async function handleDelete(expenseId) {
    try {
      await removeExpense(expenseId);
    } catch (err) {
      setError(err.message);
    }
  }

  async function handleEndGroup() {
    if (!window.confirm(`End the tab for "${group.name}"? This deletes all its expenses.`)) return;
    try {
      await endGroup();
    } catch (err) {
      setError(err.message);
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-paper">
        <p className="font-mono text-sm text-ink-soft">Loading...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-paper px-4 py-10 sm:px-6">
      <div className="mx-auto max-w-5xl">
        {!group ? (
          <GroupSetup onCreate={handleCreate} />
        ) : (
          <>
            <TopBar group={group} onEndGroup={handleEndGroup} />

            {error && (
              <div className="mb-4">
                <ConnectionError message={error} />
              </div>
            )}

            <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
              <div>
                <BillForm members={group.members} onSubmit={handleSubmitExpense} />
              </div>

              <div>
                <SettlementBoard settlement={settlement} members={group.members} />
                <ExpenseLedger expenses={expenses} members={group.members} onDelete={handleDelete} />
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
