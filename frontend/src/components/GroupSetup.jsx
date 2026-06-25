import { useState } from "react";
import { Plus, X, Receipt } from "lucide-react";

const DEFAULT_MEMBERS = ["Amit", "Rahul", "Sneha"];

export default function GroupSetup({ onCreate }) {
  const [name, setName] = useState("Roomies");
  const [members, setMembers] = useState(DEFAULT_MEMBERS);
  const [draftMember, setDraftMember] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  function addMember() {
    const trimmed = draftMember.trim();
    if (!trimmed) return;
    if (members.includes(trimmed)) {
      setError(`${trimmed} is already in the group.`);
      return;
    }
    setMembers([...members, trimmed]);
    setDraftMember("");
    setError("");
  }

  function removeMember(person) {
    setMembers(members.filter((m) => m !== person));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!name.trim()) {
      setError("Give the group a name.");
      return;
    }
    if (members.length < 2) {
      setError("Add at least 2 people to split bills between.");
      return;
    }
    setSubmitting(true);
    setError("");
    try {
      await onCreate(name.trim(), members);
    } catch (err) {
      setError(err.message || "Couldn't create the group.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="mx-auto max-w-md">
      <div className="mb-8 text-center">
        <div className="mb-3 inline-flex h-12 w-12 items-center justify-center rounded-full bg-owed-soft">
          <Receipt className="h-6 w-6 text-owed" strokeWidth={1.75} />
        </div>
        <h1 className="font-mono text-2xl font-semibold tracking-tight text-ink">Splitwise-Lite</h1>
        <p className="mt-1 text-sm text-ink-soft">Start a tab for your group, then log bills as they come in.</p>
      </div>

      <form
        onSubmit={handleSubmit}
        className="rounded-2xl border border-paper-edge bg-white/60 p-6 shadow-sm backdrop-blur-sm"
      >
        <label className="mb-1.5 block text-sm font-medium text-ink-soft">Group name</label>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Goa Trip, Flat 3B..."
          className="mb-5 w-full rounded-lg border border-paper-edge bg-white px-3.5 py-2.5 text-sm text-ink outline-none ring-owed/20 transition focus:border-owed focus:ring-4"
        />

        <label className="mb-1.5 block text-sm font-medium text-ink-soft">People in the group</label>
        <div className="mb-3 flex flex-wrap gap-2">
          {members.map((person) => (
            <span
              key={person}
              className="inline-flex items-center gap-1.5 rounded-full border border-paper-edge bg-paper px-3 py-1.5 text-sm font-medium text-ink"
            >
              {person}
              <button
                type="button"
                onClick={() => removeMember(person)}
                className="rounded-full p-0.5 text-ink-soft transition hover:bg-owed-soft hover:text-owed"
                aria-label={`Remove ${person}`}
              >
                <X className="h-3.5 w-3.5" strokeWidth={2} />
              </button>
            </span>
          ))}
        </div>

        <div className="mb-5 flex gap-2">
          <input
            type="text"
            value={draftMember}
            onChange={(e) => setDraftMember(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                addMember();
              }
            }}
            placeholder="Add a person"
            className="flex-1 rounded-lg border border-paper-edge bg-white px-3.5 py-2.5 text-sm text-ink outline-none ring-owed/20 transition focus:border-owed focus:ring-4"
          />
          <button
            type="button"
            onClick={addMember}
            className="flex items-center justify-center rounded-lg border border-paper-edge bg-white px-3.5 text-ink-soft transition hover:border-settled hover:text-settled"
            aria-label="Add person"
          >
            <Plus className="h-4 w-4" strokeWidth={2} />
          </button>
        </div>

        {error && <p className="mb-4 text-sm text-owed">{error}</p>}

        <button
          type="submit"
          disabled={submitting}
          className="w-full rounded-lg bg-ink py-2.5 text-sm font-medium text-paper transition hover:bg-ink/90 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {submitting ? "Starting tab..." : "Start the tab"}
        </button>
      </form>
    </div>
  );
}
