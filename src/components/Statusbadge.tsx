import { CheckStatus } from "@prisma/client";
import { STATUS_STYLES } from "../constants/Status";

export default function StatusBadge({ status }: { status: CheckStatus }) {
  const style = STATUS_STYLES[status];
  return (
    <span
      className={`inline-flex items-center gap-1.5 font-mono text-xs ${style.text}`}
    >
      <span
        className="inline-block h-1.5 w-1.5 rounded-full"
        style={{ backgroundColor: style.dot }}
        aria-hidden
      />
      {style.label}
    </span>
  );
}
