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
import { useEffect, useState } from "react";
import { useAccount, useConnect } from "wagmi";
import { injected } from "wagmi/connectors";

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
  const { isConnected, address } = useAccount();
  const signerStatus = useSignerStatus();
  const { openAuthModal } = useAuthModal();
  const user = useUser();
  const { logout } = useLogout();
  const { plugins, setPlugins } = usePlugins();
  const { connect, error } = useConnect();

  const [hideConnectBtn, setHideConnectBtn] = useState(false); // use this to handle minipay mode
  const [copied, setCopied] = useState(false);

  // minipay integration start
  useEffect(() => {
    if (window.ethereum && window.ethereum.isMiniPay) {
      setHideConnectBtn(true);
      setPlugins({
        isAccountKitEnabled: false,
        isCrosschainGasSubsidiaryEnabled: false,
      });
      connect({ connector: injected() });
    }
  }, [connect]);

  useEffect(() => {
    if (error) {
      alert("Error: " + error.message);
    }
  }, [error]);

  const truncate = (str: string, n: number) => {
    return str.length > n ? str.substr(0, n - 1) + "..." : str;
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(address || "");
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  // minipay integration end

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
              {!hideConnectBtn && (
                <ConnectButton
                  chainStatus={"icon"}
                  accountStatus={"avatar"}
                  showBalance={false}
                />
              )}
              {hideConnectBtn && (
                <Button variant={"outline"} onClick={handleCopy}>
                  {copied ? "Copied!" : address ? truncate(address, 10) : ""}
                </Button>
              )}
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
                  <Button variant={"secondary"} onClick={() => logout()}>
                    Log out
                  </Button>
                </>
              ) : (
                <Button onClick={openAuthModal}>Login</Button>
              )}
            </>
          )}
        </>
        {!hideConnectBtn && (
          <div className="cursor-pointer">
            <Settings className="h-6 w-6" onClick={openSettingsDialog} />
          </div>
        )}
      </div>
    </header>
  );
}
