// Each private page brings its own chrome: the dashboard a header, the editor
// none until asked for.
export default function AppLayout({ children }: LayoutProps<"/">) {
  return <>{children}</>;
}
