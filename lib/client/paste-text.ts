import type { ClipboardEvent } from "react";

function htmlClipboardToPlain(html: string): string {
  if (typeof document === "undefined") return "";

  const root = document.createElement("div");
  root.innerHTML = html;

  root.querySelectorAll("br").forEach((node) => {
    node.replaceWith("\n");
  });

  for (const block of root.querySelectorAll("p, div, li, h1, h2, h3, h4, h5, h6, tr")) {
    block.append("\n");
  }

  return (root.textContent ?? "")
    .replace(/\u00a0/g, " ")
    .replace(/\r\n?/g, "\n")
    .replace(/[ \t]+\n/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trimEnd();
}

export function pastedPlainText(event: ClipboardEvent): string {
  const html = event.clipboardData.getData("text/html");
  if (html.trim()) return htmlClipboardToPlain(html);
  return event.clipboardData.getData("text/plain").replace(/\r\n?/g, "\n");
}

export function applyPastedTextToTextarea(
  event: ClipboardEvent<HTMLTextAreaElement>,
  currentValue: string,
  onValueChange: (value: string) => void,
  maxLength?: number,
) {
  event.preventDefault();

  const textarea = event.currentTarget;
  const text = pastedPlainText(event);
  const start = textarea.selectionStart ?? currentValue.length;
  const end = textarea.selectionEnd ?? currentValue.length;

  let value = currentValue.slice(0, start) + text + currentValue.slice(end);
  if (maxLength != null && value.length > maxLength) {
    value = value.slice(0, maxLength);
  }

  const cursor = Math.min(start + text.length, value.length);
  onValueChange(value);

  requestAnimationFrame(() => {
    textarea.focus();
    textarea.setSelectionRange(cursor, cursor);
  });
}
