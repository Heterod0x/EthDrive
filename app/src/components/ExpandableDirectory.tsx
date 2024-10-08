import { ChevronDown, ChevronRight, Folder } from "lucide-react";
import Image from "next/image";
import React, { useRef, useState } from "react";

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
  const expandTimeoutRef = useRef<NodeJS.Timeout | null>(null);

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
    if (!isExpanded && directory.subdirectories.length > 0) {
      if (expandTimeoutRef.current === null) {
        expandTimeoutRef.current = setTimeout(() => {
          setIsExpanded(true);
        }, 1000); // Expand after 1 second of hovering
      }
    }
  };

  const handleDragLeave = () => {
    if (expandTimeoutRef.current) {
      clearTimeout(expandTimeoutRef.current);
      expandTimeoutRef.current = null;
    }
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    if (expandTimeoutRef.current) {
      clearTimeout(expandTimeoutRef.current);
      expandTimeoutRef.current = null;
    }
    onFileDrop(directory.path);
  };

  const paddingLeft = directory.depth * 25;
  const nameMaxWidth = 175 - paddingLeft;

  return (
    <div>
      <div
        className="flex items-center py-2 cursor-pointer hover:bg-gray-100 rounded"
        onClick={handleDirectoryClick}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        style={{ paddingLeft: `${paddingLeft}px` }}
      >
        {directory.subdirectories.length > 0 ? (
          <span onClick={handleExpandClick}>
            {isExpanded ? (
              <ChevronDown className="w-4 h-4 mr-2" />
            ) : (
              <ChevronRight className="w-4 h-4 mr-2" />
            )}
          </span>
        ) : (
          <span className="w-4 h-4 mr-2" />
        )}
        {directory.depth === 0 && (
          <Image
            src="/logo.png"
            alt="logo"
            width={16}
            height={16}
            className="mr-3"
          />
        )}
        {directory.depth === 1 && (
          <Image
            src={`/logo-${directory.path.split("/")[1]}.svg`}
            alt={`logo-${directory.path.split("/")[1]}`}
            width={16}
            height={16}
            className="mr-3"
          />
        )}
        {directory.depth >= 2 && <Folder className="w-4 h-4 mr-3" />}
        <span
          className="text-base font-medium truncate"
          style={{ maxWidth: `${nameMaxWidth}px` }}
        >
          {directory.name}
        </span>
      </div>
      {directory.subdirectories.length > 0 && isExpanded && (
        <div>
          {directory.subdirectories
            .filter((dir) => dir.name)
            .map((subdirectory) => (
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
