import { useAuth } from "../auth";

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-line bg-card p-4">
      <p className="text-xs text-dim">{label}</p>
      <p className="mt-1 font-mono text-2xl font-semibold">{value}</p>
    </div>
  );
}

export default function Dashboard() {
  const { user } = useAuth();
  if (!user) return null;

  return (
    <div>
      <h1 className="text-2xl font-semibold">Welcome, {user.display_name}</h1>
      <p className="mt-1 text-dim">Your labs, missions and progress will show up here.</p>

      <div className="mt-6 grid gap-4 sm:grid-cols-3">
        <StatCard label="Total XP" value={user.xp.toLocaleString()} />
        <StatCard label="Completed labs" value="—" />
        <StatCard label="Active labs" value="—" />
      </div>

      <div className="mt-6 rounded-lg border border-line bg-card p-5">
        <p className="font-mono text-xs text-dim">// next up</p>
        <p className="mt-2 text-sm">
          Launching labs moves here in Sprint 8.6, once labs are tied to your account.
        </p>
      </div>
    </div>
  );
}