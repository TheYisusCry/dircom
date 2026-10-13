import type { ReactNode } from "react";

export function MainContainer({ children }: { children: ReactNode }) {
  return (
    <main
      id="contenido"
      className="mx-auto w-full max-w-[1240px] px-5 pb-14 sm:px-8 sm:pb-20"
    >
      {children}
    </main>
  );
}
