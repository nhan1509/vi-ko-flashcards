"use client";

import { usePathname } from "next/navigation";
import { Nav } from "@/components/Nav";
import { PwaRegister } from "@/components/PwaRegister";

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const hideNav = pathname === "/login";
  const isStudy = pathname.startsWith("/study");

  return (
    <>
      <PwaRegister />
      {!hideNav && <Nav pathname={pathname} />}
      <main
        className={`mx-auto w-full max-w-5xl flex-1 px-4 ${
          isStudy
            ? "py-4 pb-[calc(5.5rem+env(safe-area-inset-bottom))] md:py-8 md:pb-8"
            : "py-6 pb-[calc(5.5rem+env(safe-area-inset-bottom))] md:py-8 md:pb-8"
        }`}
      >
        {children}
      </main>
    </>
  );
}
