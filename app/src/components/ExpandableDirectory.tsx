"use client";

import { ChevronDown, ChevronRight, Folder } from "lucide-react";
import React, { useState } from "react";

import { Directory } from "@/types/directory";

export function ExpandableDirectory({
  directory,
  onSelected,
  onFileDrop,
}: {
  directory: Directory;
  onSelected: (path: string) => void;
  onFileDrop: (directoryPath: string) => void;
}) {
  const [isExpanded, setIsExpanded] = useState(
    directory.isExpandedByDefault || false,
  );

  const handleExpandClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (directory.subdirectories.length > 0) {
      setIsExpanded(!isExpanded);
    }
  };

  const handleDirectoryClick = () => {
    onSelected(directory.path);
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    onFileDrop(directory.path);
  };

  return (
    <div>
      <div
        className="flex items-center py-1 cursor-pointer hover:bg-gray-100 rounded"
        onClick={handleDirectoryClick}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
        style={{ paddingLeft: `${directory.depth * 25}px` }}
      >
        {directory.subdirectories.length > 0 ? (
          <span onClick={handleExpandClick}>
            {isExpanded ? (
              <ChevronDown className="w-4 h-4 mr-1" />
            ) : (
              <ChevronRight className="w-4 h-4 mr-1" />
            )}
          </span>
        ) : (
          <span className="w-4 h-4 mr-1" />
        )}
        <Folder className="w-4 h-4 mr-2" />
        <span className="text-sm">{directory.name}</span>
      </div>
      {directory.subdirectories.length > 0 && isExpanded && (
        <div>
          {directory.subdirectories.map((subdirectory) => (
            <ExpandableDirectory
              key={subdirectory.path}
              directory={subdirectory}
              onSelected={onSelected}
              onFileDrop={onFileDrop}
            />
          ))}
        </div>
      )}
    </div>
  );
}
