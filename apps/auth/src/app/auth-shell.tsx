import Link from "next/link";
import { Suspense } from "react";

export function AuthShell({
  title,
  description,
  children,
}: Readonly<{
  title: string;
  description: string;
  children: React.ReactNode;
}>) {
  return (
    <main className="flex min-h-screen items-center justify-center px-4 py-12">
      <section className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
        <Link className="text-sm font-semibold text-slate-500" href="/login">
          Jayant Goyal Account
        </Link>
        <h1 className="mt-8 text-3xl font-semibold tracking-tight text-slate-950">
          {title}
        </h1>
        <p className="mt-2 text-sm leading-6 text-slate-600">{description}</p>
        <div className="mt-8">
          <Suspense
            fallback={<p className="text-sm text-slate-500">Loading…</p>}
          >
            {children}
          </Suspense>
        </div>
      </section>
    </main>
  );
}
