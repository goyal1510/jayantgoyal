import type { ReactNode } from "react";
import Image from "next/image";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";

import { PERSON_BRAND } from "@jayantgoyal/web-brand";
import { ThemeMenu } from "@jayantgoyal/web-ui/theme-menu";

export function AuthWelcomeShell({ children }: { children: ReactNode }) {
  return (
    <main className="min-h-svh bg-[#0f1012] text-[#f5f1e9]">
      <div className="grid min-h-svh lg:grid-cols-[minmax(0,1.12fr)_minmax(420px,0.88fr)]">
        <section className="relative isolate min-h-[430px] overflow-hidden bg-[#111214] sm:min-h-[500px] lg:min-h-0">
          <Image
            src="/assets/auth-welcome-art.png"
            alt=""
            fill
            priority
            sizes="(min-width: 1024px) 58vw, 100vw"
            className="absolute inset-0 size-full object-cover object-[68%_50%] opacity-90"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-[#0d0e10]/80 via-[#0d0e10]/10 to-[#0d0e10]/95" />
          <div className="absolute inset-0 bg-gradient-to-r from-[#0d0e10]/70 via-transparent to-transparent" />

          <div className="relative z-10 flex min-h-[430px] flex-col p-6 sm:min-h-[500px] sm:p-9 lg:min-h-full lg:p-12">
            <header className="flex items-center justify-between gap-4">
              <Link
                href={PERSON_BRAND.canonicalUrl}
                className="group inline-flex items-center gap-2 font-serif text-xl tracking-[-0.03em]"
              >
                {PERSON_BRAND.displayName}
                <ArrowUpRight className="size-3.5 opacity-60 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
              </Link>
              <span className="size-8" aria-hidden="true" />
            </header>
          </div>
        </section>

        <section className="flex min-h-[620px] flex-col bg-[#f4efe6] text-[#1a1a1c] dark:bg-[#191a1d] dark:text-[#f5f1e9]">
          <header className="flex justify-end px-6 py-6 sm:px-10 sm:py-8 lg:px-12">
            <ThemeMenu />
          </header>

          <div className="flex flex-1 items-center justify-center px-6 py-10 sm:px-10 lg:px-12">
            <div className="w-full max-w-[390px]">{children}</div>
          </div>
        </section>
      </div>
    </main>
  );
}
