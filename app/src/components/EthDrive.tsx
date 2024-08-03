"use client";

import React, { useState, useEffect } from "react";
import { Plus, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";

import { useWriteContract } from "wagmi";

import { ethDriveAbi } from "@/lib/ethdrive/abi";
import { buildRecursiveDirectoryQuery } from "@/lib/ethdrive/query";

import { gql, useQuery } from "@apollo/client";

const MAX_DEPTH = 5;

interface Directory {
  id: string;
  tokenId: string;
  tokenBountAccount: string;
  holder: string;
  subdirectories: Directory[];
  depth: number;
}

export function EthDrive({ path }: { path: string }) {
  const { writeContract } = useWriteContract();

  const { data } = useQuery(gql(buildRecursiveDirectoryQuery(MAX_DEPTH)));
  const [directories, setDirectories] = useState<Directory[]>([]);
  const [directoryName, setDirectoryName] = useState("");

  const [isCreateDirectoryModalOpen, setIsCreateDirectoryModalOpen] =
    useState(false);

  useEffect(() => {}, [data]);

  return (
    <div className="flex flex-col h-screen bg-white">
      <header className="flex items-center justify-between p-4 border-b">
        <h1 className="text-2xl font-semibold">Drive</h1>
        <div className="flex items-center space-x-4">
          <Button
            onClick={() => {
              setIsCreateDirectoryModalOpen(true);
            }}
          >
            <Plus className="mr-2 h-4 w-4" /> New
          </Button>
          <User className="h-8 w-8" />
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">
        <aside className="w-64 p-4 border-r overflow-y-auto"></aside>

        <div className="flex-1 p-4 overflow-y-auto">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold">
              {/* /{selectedPath?.join("/")} */}
            </h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"></div>
        </div>
      </div>

      <Dialog
        open={isCreateDirectoryModalOpen}
        onOpenChange={setIsCreateDirectoryModalOpen}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create Directory</DialogTitle>
          </DialogHeader>
          <Input
            placeholder={`Enter directory name`}
            value={directoryName}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
              setDirectoryName(e.target.value)
            }
          />
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setIsCreateDirectoryModalOpen(false);
              }}
            >
              Cancel
            </Button>
            <Button
              onClick={() => {
                writeContract({
                  abi: ethDriveAbi,
                  address: "0x889F47AA12e02C1FC8a3f313Ac8f5e8BbCD9EAa5",
                  functionName: "createDirectory",
                  args: [directoryName],
                });
              }}
            >
              Create
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
