import { api } from "@/lib/api";

export default async function Home() {
  const health = await (await api.health.$get()).json();

  return (
    <main className="flex flex-1 flex-col items-center justify-center gap-4 p-8">
      <h1 className="text-3xl font-semibold tracking-tight">
        Rich text editor
      </h1>
      <p className="text-muted-foreground">Backend: {health.status}</p>
    </main>
  );
}
