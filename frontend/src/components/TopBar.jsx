import { Receipt, LogOut } from "lucide-react";

export default function TopBar({ group, onEndGroup }) {
  return (
    <div className="mb-6 flex items-center justify-between">
      <div className="flex items-center gap-2.5">
        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-owed-soft">
          <Receipt className="h-4.5 w-4.5 text-owed" strokeWidth={1.75} />
        </div>
        <div>
          <h1 className="font-mono text-base font-semibold leading-tight text-ink">{group.name}</h1>
          <p className="text-xs leading-tight text-ink-soft">{group.members.join(", ")}</p>
        </div>
      </div>
      <button
        onClick={onEndGroup}
        className="inline-flex items-center gap-1.5 rounded-lg border border-paper-edge px-3 py-1.5 text-xs font-medium text-ink-soft transition hover:border-owed hover:text-owed"
      >
        <LogOut className="h-3.5 w-3.5" strokeWidth={1.75} />
        End tab
      </button>
    </div>
  );
}
