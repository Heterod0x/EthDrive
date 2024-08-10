"use client";

import React from "react";

import { ScrollArea } from "./ui/scroll-area";

export function Sidebar({
  children,
  isOpen,
}: {
  children: React.ReactNode;
  isOpen: boolean;
  toggleSidebar: () => void;
}) {
  return (
    <>
      <div
        className={`fixed top-0 left-0 h-full z-10 transition-transform transform duration-500 ${
          isOpen ? "translate-x-0" : "-translate-x-full"
        } md:relative md:translate-x-0 md:w-80 border-r bg-white md:bg-transparent`}
      >
        <ScrollArea className="h-full p-4 space-y-4">{children}</ScrollArea>
      </div>
    </>
  );
}
