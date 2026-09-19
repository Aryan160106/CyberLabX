import { Shield } from "lucide-react";

export function Logo({ large = false }: { large?: boolean }) {
  return (
    <div className="flex items-center gap-2">
      <Shield className={large ? "size-8 text-brand" : "size-6 text-brand"} />
      <span className={large ? "text-2xl font-semibold tracking-tight" : "text-lg font-semibold tracking-tight"}>
        Cyber<span className="text-brand">LabX</span>
      </span>
    </div>
  );
}