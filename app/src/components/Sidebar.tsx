"use client";

import { X } from "lucide-react";
import React from "react";

export function Sidebar({
  children,
  isOpen,
  toggleSidebar,
}: {
  children: React.ReactNode;
  isOpen: boolean;
  toggleSidebar: () => void;
}) {
  return (
    <>
      <div
        className={`fixed top-0 left-0 h-full z-5 transition-transform transform duration-500 ${
          isOpen ? "translate-x-0" : "-translate-x-full"
        } md:relative md:translate-x-0 md:w-80 border-r`}
      >
        <div className="h-full p-4 space-y-4">{children}</div>
      </div>
    </>
  );
}
