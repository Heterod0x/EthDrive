"use client";

import { ConnectButton } from "@rainbow-me/rainbowkit";
import { Plus, Settings } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useAccount } from "wagmi";

import { Button } from "@/components/ui/button";

export function Header({
  openCreateDirectoryDialog,
  openSettingsDialog,
}: {
  openCreateDirectoryDialog: () => void;
  openSettingsDialog: () => void;
}) {
  const { isConnected } = useAccount();

  return (
    <header className="flex items-center justify-between p-4 border-b">
      <Link href="/">
        <div className="flex items-center space-x-2">
          <Image src="/logo.png" alt="logo" width="32" height="32" />
          <h1 className="hidden lg:block text-2xl font-semibold">EthDrive</h1>
        </div>
      </Link>
      <div className="flex items-center space-x-2">
        {isConnected && (
          <Button onClick={openCreateDirectoryDialog}>
            <Plus className="mr-2 h-4 w-4" /> New
          </Button>
        )}
        <ConnectButton
          accountStatus="avatar"
          chainStatus="name"
          showBalance={false}
        />
        {isConnected && (
          <div className="cursor-pointer">
            <Settings className="h-6 w-6" onClick={openSettingsDialog} />
          </div>
        )}
      </div>
    </header>
  );
}
