// Where to go after login. Only known private routes are accepted, so a crafted
// `next` cannot send the user off-site (docs/security-notes.md).
const privateRoutes = ["/app", "/write"];

export function safeNext(next: string | null | undefined): string {
  if (!next) return "/app";
  const path = next.split(/[?#]/)[0];
  const known = privateRoutes.some(
    (r) => path === r || path.startsWith(`${r}/`),
  );
  return known && next.startsWith("/") && !next.startsWith("//")
    ? next
    : "/app";
}
