export type EvidenceCandidate = { type: "case-study" | "article"; href: string };

/** Select without replacement, giving every item of a given type equal probability. */
export function selectEvidence<T extends EvidenceCandidate>(items: T[], random: () => number = Math.random): T[] {
  const unique = Array.from(new Map(items.map((item) => [`${item.type}:${item.href}`, item])).values());
  const shuffle = (values: T[]) => {
    const result = [...values];
    for (let index = result.length - 1; index > 0; index--) {
      const other = Math.floor(random() * (index + 1));
      [result[index], result[other]] = [result[other], result[index]];
    }
    return result;
  };
  const cases = shuffle(unique.filter((item) => item.type === "case-study"));
  const articles = shuffle(unique.filter((item) => item.type === "article"));
  if (!cases.length || !articles.length) return shuffle(unique).slice(0, 3);
  return shuffle([cases[0], articles[0], ...shuffle([...cases.slice(1), ...articles.slice(1)]).slice(0, 1)]);
}
