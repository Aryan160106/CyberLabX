export default function ComingSoon({ title, sprint }: { title: string; sprint: string }) {
  return (
    <div>
      <h1 className="text-2xl font-semibold">{title}</h1>
      <p className="mt-2 font-mono text-sm text-dim">// coming in {sprint}</p>
    </div>
  );
}