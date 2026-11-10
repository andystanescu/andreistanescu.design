export function NavigationIcon({ page }: { page: string }) {
  const name = page.replace(/^\//, "").split("/")[0];
  const paths: Record<string, React.ReactNode> = {
    work: <><rect x="3" y="5" width="18" height="14" rx="2" /><path d="M8 5V3h8v2M3 10h18" /></>,
    insights: <><path d="M4 5h16v14H4zM8 9h8M8 13h8M8 17h5" /></>,
    about: <><circle cx="12" cy="8" r="4" /><path d="M4 21c0-4 3-6 8-6s8 2 8 6" /></>,
    services: <><path d="m12 3 9 5-9 5-9-5 9-5ZM3 12l9 5 9-5M3 16l9 5 9-5" /></>,
  };
  return <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{paths[name] ?? <><circle cx="12" cy="12" r="8" /><path d="M12 8v8M8 12h8" /></>}</svg>;
}
