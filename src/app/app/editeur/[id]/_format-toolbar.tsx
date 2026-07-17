"use client";

import { cn } from "@/lib/utils";

type Cmd =
  | { cmd: "bold" | "italic" | "underline"; label: string }
  | { cmd: "formatBlock"; value: "H1" | "H2" | "H3" | "P"; label: string }
  | { cmd: "insertUnorderedList" | "insertOrderedList"; label: string };

const GROUPS: Cmd[][] = [
  [
    { cmd: "formatBlock", value: "P", label: "Texte" },
    { cmd: "formatBlock", value: "H1", label: "Titre 1" },
    { cmd: "formatBlock", value: "H2", label: "Titre 2" },
    { cmd: "formatBlock", value: "H3", label: "Titre 3" },
  ],
  [
    { cmd: "bold", label: "Gras" },
    { cmd: "italic", label: "Italique" },
    { cmd: "underline", label: "Souligné" },
  ],
  [
    { cmd: "insertUnorderedList", label: "Liste à puces" },
    { cmd: "insertOrderedList", label: "Liste numérotée" },
  ],
];

const ICON: Record<string, string> = {
  bold: "G",
  italic: "I",
  underline: "S",
  insertUnorderedList: "•",
  insertOrderedList: "1.",
};

export function FormatToolbar({
  activeFormats,
  onCommand,
}: {
  activeFormats: Set<string>;
  onCommand: (cmd: string, value?: string) => void;
}) {
  return (
    <div className="flex flex-wrap items-center gap-2 border-b border-[var(--color-line)] pb-2 mb-4">
      {GROUPS.map((group, i) => (
        <div key={i} className="flex items-center gap-0.5">
          {group.map((item) => {
            const key = item.cmd === "formatBlock" ? item.value : item.cmd;
            const active = activeFormats.has(key);
            const label = item.cmd === "formatBlock" ? item.label : item.label;
            return (
              <button
                key={key}
                type="button"
                title={label}
                onMouseDown={(e) => {
                  e.preventDefault();
                  onCommand(item.cmd, item.cmd === "formatBlock" ? item.value : undefined);
                }}
                className={cn(
                  "min-w-[28px] h-7 px-2 rounded text-xs font-medium transition-colors",
                  active ? "bg-[var(--color-cream)] text-[var(--color-burgundy)]" : "text-[var(--color-ink-soft)] hover:bg-[var(--color-line-soft)]",
                  item.cmd === "bold" && "font-bold",
                  item.cmd === "italic" && "italic",
                  item.cmd === "underline" && "underline",
                )}
              >
                {item.cmd === "formatBlock" ? item.value : ICON[item.cmd]}
              </button>
            );
          })}
          {i < GROUPS.length - 1 && <span className="w-px h-4 bg-[var(--color-line)] mx-1" />}
        </div>
      ))}
    </div>
  );
}
