"use client";

import { Copy } from "lucide-react";

export function CopyToClipboard({ text }: { text: string }) {
  return (
    <div
      onClick={() => {
        navigator.clipboard.writeText(text);
      }}
      className="ml-2"
    >
      <Copy className="h-4 w-4 cursor-pointer text-muted-foreground" />
    </div>
  );
}
