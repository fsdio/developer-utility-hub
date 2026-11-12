import { useEffect, useId, useRef, useState } from "react";
import { CATEGORY_LABELS, searchTools } from "@/registry/tools";
import { Kbd } from "@/components/common/Kbd";

export function ToolSearch() {
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const listId = useId();

  const results = searchTools(query).slice(0, 6);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null;
      const isTyping =
        target instanceof HTMLTextAreaElement ||
        (target instanceof HTMLInputElement && target.type !== "search");
      if ((event.metaKey || event.ctrlKey) && event.key.toLocaleLowerCase() === "k" && !isTyping) {
        event.preventDefault();
        inputRef.current?.focus();
        setOpen(true);
      }
      if (event.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  const onInputKeyDown = (event: React.KeyboardEvent<HTMLInputElement>): void => {
    if (event.key === "ArrowDown") {
      event.preventDefault();
      setActiveIndex((index) => Math.min(index + 1, Math.max(results.length - 1, 0)));
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      setActiveIndex((index) => Math.max(index - 1, 0));
    } else if (event.key === "Enter") {
      const target = results[activeIndex];
      if (target) {
        window.location.hash = target.route.slice(1);
        setOpen(false);
        setQuery("");
      }
    }
  };

  return (
    <div className="search">
      <label htmlFor={`${listId}-input`} className="sr-only">
        Cari tool
      </label>
      <input
        id={`${listId}-input`}
        ref={inputRef}
        type="search"
        role="combobox"
        aria-expanded={open}
        aria-controls={listId}
        aria-autocomplete="list"
        aria-activedescendant={open && results[activeIndex] ? `${listId}-${activeIndex}` : undefined}
        placeholder="Cari tool…"
        value={query}
        onChange={(event) => {
          setQuery(event.target.value);
          setOpen(true);
          setActiveIndex(0);
        }}
        onFocus={() => setOpen(true)}
        onBlur={() => setTimeout(() => setOpen(false), 120)}
        onKeyDown={onInputKeyDown}
      />
      <span className="search-hint" aria-hidden="true">
        <Kbd>Ctrl</Kbd>
        <Kbd>K</Kbd>
      </span>

      {open ? (
        <ul className="search-results" id={listId} role="listbox" aria-label="Hasil pencarian tool">
          {results.length === 0 ? (
            <li className="search-empty" role="option" aria-selected={false} aria-disabled="true">
              Tidak ada tool yang cocok.
            </li>
          ) : (
            results.map((tool, index) => (
              <li key={tool.id} role="option" aria-selected={index === activeIndex} id={`${listId}-${index}`}>
                <a
                  href={tool.route}
                  data-active={index === activeIndex}
                  onClick={() => {
                    setOpen(false);
                    setQuery("");
                  }}
                >
                  {tool.name}
                  <span className="search-meta">{CATEGORY_LABELS[tool.category]}</span>
                </a>
              </li>
            ))
          )}
        </ul>
      ) : null}
    </div>
  );
}
