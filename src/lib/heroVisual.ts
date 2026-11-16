export function saveHeroVisualCode(live: string, submitted: string, publish: boolean) {
  const code = submitted.slice(0, 100000);
  return publish ? { live: code, draft: null } : { live, draft: code };
}

export function displayedHeroVisualCode(live: string, draft: string | null, preview: boolean) {
  return preview ? draft ?? live : live;
}
