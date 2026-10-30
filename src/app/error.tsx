"use client";
import { Button } from "@/components/ui/button";
export default function ErrorPage({ reset }: { reset: () => void }) {
  return (
    <main className="mx-auto max-w-lg px-5 py-16">
      <div className="panel space-y-5 p-8">
        <h1 className="text-xl font-bold">No pudimos cargar este espacio</h1>
        <p className="text-sm leading-6 text-muted">
          Reintenta en unos momentos. Si el problema continúa, contacta al
          administrador para revisar la conexión y la configuración.
        </p>
        <Button onClick={reset}>Reintentar</Button>
      </div>
    </main>
  );
}
