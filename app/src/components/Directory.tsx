"use client";

import { Directory as DirectoryType } from "@/types/directory";
import { ChevronDown, ChevronRight, Folder } from "lucide-react";
import { useState } from "react";

export function Directory({
  directory,
  onSelect,
}: {
  directory: DirectoryType;
  onSelect?: (id: string) => void;
}) {
  const [isExpanded, setIsExpanded] = useState(true);

  const handleClick = () => {
    if (directory.subdirectories.length > 0) {
      setIsExpanded(!isExpanded);
    }
    if (onSelect) {
      onSelect(directory.id);
    }
  };

  return (
    <div style={{ paddingLeft: `${directory.depth * 16}px` }}>
      <div
        className="flex items-center py-1 cursor-pointer hover:bg-gray-100 rounded"
        onClick={handleClick}
      >
        {directory.subdirectories.length > 0 &&
          (isExpanded ? (
            <ChevronDown className="w-4 h-4 mr-1" />
          ) : (
            <ChevronRight className="w-4 h-4 mr-1" />
          ))}
        <Folder className="w-4 h-4 mr-2" />
        <span className="text-sm">{directory.name}</span>
      </div>
      {directory.subdirectories.length > 0 && isExpanded && (
        <div>
          {directory.subdirectories.map((subdirectory) => (
            <Directory
              key={subdirectory.id}
              directory={subdirectory}
              onSelect={onSelect}
            />
          ))}
        </div>
      )}
    </div>
  );
}
