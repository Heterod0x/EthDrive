"use client";

import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import React, { useMemo } from "react";

export function DirectoryPathBreadcrumb({
  selectedDirectoryPath,
  setSelectedDirectoryPath,
}: {
  selectedDirectoryPath: string;
  setSelectedDirectoryPath: (path: string) => void;
}) {
  const selectedDirectoryPathSegments = useMemo(() => {
    return selectedDirectoryPath.split("/").filter((segment) => segment);
  }, [selectedDirectoryPath]);

  return (
    <Breadcrumb>
      <BreadcrumbList>
        <BreadcrumbSeparator>/</BreadcrumbSeparator>
        {selectedDirectoryPathSegments.map((segment, i) => {
          const fullPath = selectedDirectoryPathSegments
            .slice(0, i + 1)
            .join("/");

          return (
            <React.Fragment key={`breadcrumb_${i}`}>
              {i > 0 && <BreadcrumbSeparator>/</BreadcrumbSeparator>}
              <BreadcrumbItem>
                {i < selectedDirectoryPathSegments.length - 1 ? (
                  <BreadcrumbLink
                    onClick={() => setSelectedDirectoryPath(fullPath)}
                    className="cursor-pointer"
                  >
                    {segment}
                  </BreadcrumbLink>
                ) : (
                  <BreadcrumbPage>{segment}</BreadcrumbPage>
                )}
              </BreadcrumbItem>
            </React.Fragment>
          );
        })}
      </BreadcrumbList>
    </Breadcrumb>
  );
}
