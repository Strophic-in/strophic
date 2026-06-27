import { Button } from "@strophic/ui";

export default function HomePage() {
  return (
    <main className="mx-auto flex min-h-screen max-w-2xl flex-col items-center justify-center gap-6 p-8 text-center">
      <span className="rounded-full border border-ink-200 px-3 py-1 text-xs font-medium uppercase tracking-widest text-ink-500">
        Phase 0 · Foundations
      </span>
      <h1 className="text-3xl font-semibold tracking-tight">Strophic Admin</h1>
      <p className="text-ink-600">
        The foundation is in place. The dashboard (auth, CRM, CMS, media, settings) arrives in Phase 4.
      </p>
      <Button>Get started</Button>
    </main>
  );
}
