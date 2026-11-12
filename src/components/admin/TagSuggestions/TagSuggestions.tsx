import styles from "@/components/admin/CaseStudyEditor/CaseStudyEditor.module.css";

export function TagSuggestions({ draft, existingTags, selectedTags, onSelect }: { draft: string; existingTags: string[]; selectedTags: string[]; onSelect: (tag: string) => void }) {
  const query = draft.trim().toLocaleLowerCase();
  if (query.length < 2 || /[,;\n|*·]/.test(query)) return null;
  const matches = existingTags.filter((tag) => tag.toLocaleLowerCase().includes(query) && !selectedTags.some((selected) => selected.toLocaleLowerCase() === tag.toLocaleLowerCase()))
    .sort((a, b) => Number(b.toLocaleLowerCase().startsWith(query)) - Number(a.toLocaleLowerCase().startsWith(query)) || a.localeCompare(b)).slice(0, 5);
  if (!matches.length) return null;
  return <div className={styles.tagSuggestions} role="group" aria-label="Suggested tags">
    <span>Suggestions:</span>
    {matches.map((tag) => <button key={tag} type="button" onClick={() => onSelect(tag)}>{tag}</button>)}
  </div>;
}
