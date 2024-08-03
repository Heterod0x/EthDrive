"use client";

import { Directory as DirectoryType } from "@/types/directory";
import { ChevronDown, ChevronRight, Folder } from "lucide-react";
import { useState } from "react";

interface DirectoryProps {
  directory: DirectoryType;
  onSelected: (directory: DirectoryType) => void;
}

export function Directory({ directory, onSelected }: DirectoryProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  const handleExpandClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (directory.subdirectories.length > 0) {
      setIsExpanded(!isExpanded);
    }
  };

  const handleDirectoryClick = () => {
    onSelected(directory);
  };

  return (
    <div style={{ paddingLeft: `${directory.depth * 16}px` }}>
      <div
        className="flex items-center py-1 cursor-pointer hover:bg-gray-100 rounded"
        onClick={handleDirectoryClick}
      >
        {directory.subdirectories.length > 0 && (
          <span onClick={handleExpandClick}>
            {isExpanded ? (
              <ChevronDown className="w-4 h-4 mr-1" />
            ) : (
              <ChevronRight className="w-4 h-4 mr-1" />
            )}
          </span>
        )}
        <Folder className="w-4 h-4 mr-2" />
        <span className="text-sm">{directory.name}</span>
      </div>
      {directory.subdirectories.length > 0 && isExpanded && (
        <div>
          {directory.subdirectories.map((subdirectory) => (
            <Directory
              key={subdirectory.path}
              directory={subdirectory}
              onSelected={onSelected}
            />
          ))}
        </div>
      )}
    </div>
  );
}
