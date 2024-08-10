"use client";

import {
  useAuthModal,
  useLogout,
  useSignerStatus,
  useUser,
} from "@account-kit/react";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import { Plus, Settings } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useAccount } from "wagmi";

import { Button } from "@/components/ui/button";
import { usePlugins } from "@/hooks/usePlugins";

export function Header({
  isDirectorySelected,
  openCreateDirectoryDialog,
  openSettingsDialog,
}: {
  isDirectorySelected: boolean;
  openCreateDirectoryDialog: () => void;
  openSettingsDialog?: () => void;
}) {
  const { isConnected } = useAccount();
  const signerStatus = useSignerStatus();
  const { openAuthModal } = useAuthModal();
  const user = useUser();
  const { logout } = useLogout();
  const { plugins } = usePlugins();

  return (
    <header className="flex items-center justify-between p-4 border-b">
      <Link href="/">
        <div className="flex items-center space-x-2">
          <Image src="/logo.png" alt="logo" width="16" height="16" />
          <h1 className="hidden lg:block text-2xl font-semibold">EthDrive</h1>
        </div>
      </Link>
      <div className="flex items-center space-x-2">
        <>
          {!plugins.isAccountKitEnabled && (
            <>
              {isConnected && isDirectorySelected && (
                <Button onClick={openCreateDirectoryDialog}>
                  <Plus className="mr-2 h-4 w-4" /> New
                </Button>
              )}
              <ConnectButton
                chainStatus={"icon"}
                accountStatus={"avatar"}
                showBalance={false}
              />
            </>
          )}
          {plugins.isAccountKitEnabled && (
            <>
              {signerStatus.isInitializing ? (
                <button className="btn btn-secondary" disabled>
                  Loading...
                </button>
              ) : user ? (
                <>
                  {isDirectorySelected && (
                    <Button onClick={openCreateDirectoryDialog}>
                      <Plus className="mr-2 h-4 w-4" /> New
                    </Button>
                  )}
                  <button className="btn btn-primary" onClick={() => logout()}>
                    Log out
                  </button>
                </>
              ) : (
                <button className="btn btn-primary" onClick={openAuthModal}>
                  Login
                </button>
              )}
            </>
          )}
        </>
        <div className="cursor-pointer">
          <Settings className="h-6 w-6" onClick={openSettingsDialog} />
        </div>
      </div>
    </header>
  );
}
