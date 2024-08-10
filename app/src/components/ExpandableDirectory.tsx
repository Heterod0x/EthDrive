"use client";

import "@rainbow-me/rainbowkit";
import { ChevronDown, ChevronRight, Folder } from "lucide-react";
import Image from "next/image";
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

  const paddingLeft = directory.depth * 25;
  const nameMaxWidth = 175 - paddingLeft;

  return (
    <div>
      <div
        className="flex items-center py-2 cursor-pointer hover:bg-gray-100 rounded"
        onClick={handleDirectoryClick}
        onDragOver={handleDragOver}
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
        {directory.depth == 0 && (
          <Image
            src="/logo.png"
            alt="logo"
            width="16"
            height="16"
            className="mr-2"
          />
        )}
        {directory.depth == 1 && (
          <>
            {directory.path == "root/tenderly-virtual-testnet" && (
              <Image
                src="/logo-tenderly.svg"
                alt="logo-tenderly"
                width="16"
                height="16"
                className="mr-2"
              />
            )}
            {directory.path == "root/sepolia" && (
              <Image
                src="/logo-ethereum.svg"
                alt="logo-ethereum"
                width="16"
                height="16"
                className="mr-2"
              />
            )}
            {directory.path == "root/optimism-sepolia" && (
              <Image
                src="/logo-optimism.svg"
                alt="logo-optimism"
                width="16"
                height="16"
                className="mr-2"
              />
            )}
            {directory.path == "root/base-sepolia" && (
              <Image
                src="/logo-base.svg"
                alt="logo-base"
                width="16"
                height="16"
                className="mr-2"
              />
            )}
          </>
        )}
        {directory.depth >= 2 && <Folder className="w-4 h-4 mr-2" />}
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
