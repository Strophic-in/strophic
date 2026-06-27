import { useState } from "react";

/**
 * A tiny React island used in Phase 0 to prove client hydration and that a
 * single React 19 copy is shared across the monorepo (no "Invalid hook call").
 */
export default function Counter({ start = 0 }: { start?: number }) {
  const [count, setCount] = useState(start);
  return (
    <button
      type="button"
      onClick={() => setCount((c) => c + 1)}
      className="rounded-xl bg-brand-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-brand-700"
    >
      Clicked {count} {count === 1 ? "time" : "times"}
    </button>
  );
}
