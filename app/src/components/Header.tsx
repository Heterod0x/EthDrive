"use client";

import Link from "next/link";
import Image from "next/image";
import { useAccount } from "wagmi";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { ConnectButton } from "@rainbow-me/rainbowkit";

export function Header({
  openCreateDirectoryDialog,
}: {
  openCreateDirectoryDialog: () => void;
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
      <div className="flex items-center space-x-4">
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
      </div>
    </header>
  );
}
