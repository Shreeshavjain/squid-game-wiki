import React from 'react';

/**
 * Renders lightweight inline markup used in the data files:
 *   *bold*   → <strong>
 *   `code`   → <code>
 */
export function RichText({
  text,
  boldClassName = 'font-semibold text-zinc-100',
}: {
  text: string;
  boldClassName?: string;
}) {
  return (
    <>
      {text.split(/(\*[^*]+\*|`[^`]+`)/).map((part, i) => {
        if (part.startsWith('*') && part.endsWith('*') && part.length > 2) {
          return (
            <strong key={i} className={boldClassName}>
              {part.slice(1, -1)}
            </strong>
          );
        }
        if (part.startsWith('`') && part.endsWith('`') && part.length > 2) {
          return (
            <code key={i} className="font-mono text-[0.92em] text-zinc-100">
              {part.slice(1, -1)}
            </code>
          );
        }
        return part;
      })}
    </>
  );
}
