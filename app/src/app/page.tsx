"use client";

import React, { useState, useCallback } from "react";
import {
  Folder,
  FileIcon,
  ChevronRight,
  ChevronDown,
  Plus,
  User,
  X,
  DollarSign,
  Image,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface File {
  id: string;
  name: string;
  type: "ERC20" | "ERC721";
  supply?: number;
  balance?: number;
  image?: string;
}

interface Directory {
  id: string;
  name: string;
  owner: string;
  children: Directory[];
  files?: File[];
}

const initialDirectories: Directory = {
  id: "root",
  name: "Root",
  owner: "admin.eth",
  children: [
    {
      id: "1",
      name: "Base",
      owner: "consome.eth",
      children: [
        {
          id: "1-1",
          name: "User",
          owner: "consome.eth",
          children: [
            {
              id: "1-1-1",
              name: "consome",
              owner: "consome.eth",
              children: [],
              files: [
                {
                  id: "1",
                  name: "ETH.erc20",
                  type: "ERC20",
                  supply: 1000000,
                  balance: 500000,
                },
                {
                  id: "2",
                  name: "CryptoKitties.erc721",
                  type: "ERC721",
                  image: "cryptokitties.jpg",
                },
              ],
            },
          ],
        },
      ],
    },
    { id: "2", name: "Optimism", owner: "op.eth", children: [] },
    { id: "3", name: "Arbitrum", owner: "arb.eth", children: [] },
  ],
};

interface DirectoryTreeProps {
  directory: Directory;
  selectedDir: string;
  onSelect: (id: string) => void;
  onDrop: (items: (File | Directory)[], targetId: string) => void;
}

const DirectoryTree: React.FC<DirectoryTreeProps> = ({
  directory,
  selectedDir,
  onSelect,
  onDrop,
}) => {
  const [isExpanded, setIsExpanded] = useState(directory.id === "root");

  const handleToggle = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsExpanded(!isExpanded);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const data = JSON.parse(e.dataTransfer.getData("text/plain"));
    onDrop(data, directory.id);
  };

  return (
    <div onDragOver={handleDragOver} onDrop={handleDrop}>
      <div
        onClick={() => onSelect(directory.id)}
        className={`flex items-center cursor-pointer p-1 rounded ${
          selectedDir === directory.id ? "bg-blue-100" : ""
        }`}
      >
        {directory.children && directory.children.length > 0 && (
          <div onClick={handleToggle}>
            {isExpanded ? (
              <ChevronDown className="h-4 w-4 mr-1" />
            ) : (
              <ChevronRight className="h-4 w-4 mr-1" />
            )}
          </div>
        )}
        <Folder className="h-4 w-4 mr-2" />
        <span>{directory.name}</span>
      </div>
      {isExpanded &&
        directory.children &&
        directory.children.map((child) => (
          <div key={child.id} className="ml-4">
            <DirectoryTree
              directory={child}
              selectedDir={selectedDir}
              onSelect={onSelect}
              onDrop={onDrop}
            />
          </div>
        ))}
    </div>
  );
};

interface FileDetailsProps {
  file: File | null;
  onClose: () => void;
}

const FileDetails: React.FC<FileDetailsProps> = ({ file, onClose }) => {
  if (!file) return null;
  return (
    <div className="p-4 border-l relative">
      <button onClick={onClose} className="absolute top-2 right-2">
        <X className="h-4 w-4" />
      </button>
      <h3 className="text-xl font-semibold mb-4">{file.name}</h3>
      {file.type === "ERC20" && (
        <>
          <p>Type: ERC20 Token</p>
          <p>Supply: {file.supply}</p>
          <p>Balance: {file.balance}</p>
        </>
      )}
      {file.type === "ERC721" && (
        <>
          <p>Type: ERC721 NFT</p>
          <img
            src={`/api/placeholder/200/200?text=${file.image}`}
            alt={file.name}
            className="my-2 rounded"
          />
        </>
      )}
    </div>
  );
};

const GoogleDriveUI: React.FC = () => {
  const [directories, setDirectories] = useState<Directory>(initialDirectories);
  const [selectedDirId, setSelectedDirId] = useState<string>("root");
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [isMoveModalOpen, setIsMoveModalOpen] = useState<boolean>(false);
  const [modalType, setModalType] = useState<string>("");
  const [newItemName, setNewItemName] = useState<string>("");
  const [newTokenSupply, setNewTokenSupply] = useState<string>("");
  const [newNFTImage, setNewNFTImage] = useState<string>("");
  const [itemsToMove, setItemsToMove] = useState<(File | Directory)[]>([]);
  const [moveTargetId, setMoveTargetId] = useState<string | null>(null);

  const findDirectory = (
    dir: Directory,
    id: string,
    path: string[] = []
  ): { dir: Directory; path: string[] } | null => {
    if (dir.id === id) return { dir, path: [...path, dir.name] };
    if (dir.children) {
      for (let child of dir.children) {
        const result = findDirectory(child, id, [...path, dir.name]);
        if (result) return result;
      }
    }
    return null;
  };

  const result = findDirectory(directories, selectedDirId);
  const selectedDirectory = result?.dir;
  const selectedPath = result?.path || [];

  const handleSelect = (id: string) => {
    setSelectedDirId(id);
    setSelectedFiles([]);
  };

  const handleCreateItem = () => {
    if (newItemName && selectedDirId) {
      const updateDirectories = (dir: Directory): Directory => {
        if (dir.id === selectedDirId) {
          let newItem: Directory | File;
          switch (modalType) {
            case "directory":
              newItem = {
                id: Date.now().toString(),
                name: newItemName,
                owner: "current.eth",
                children: [],
                files: [],
              };
              return {
                ...dir,
                children: [...(dir.children || []), newItem as Directory],
              };
            case "token":
              newItem = {
                id: Date.now().toString(),
                name: `${newItemName}.erc20`,
                type: "ERC20",
                supply: parseInt(newTokenSupply),
                balance: 0,
              };
              return { ...dir, files: [...(dir.files || []), newItem] };
            case "nft":
              newItem = {
                id: Date.now().toString(),
                name: `${newItemName}.erc721`,
                type: "ERC721",
                image: newNFTImage,
              };
              return { ...dir, files: [...(dir.files || []), newItem] };
            default:
              return dir;
          }
        }
        if (dir.children) {
          return { ...dir, children: dir.children.map(updateDirectories) };
        }
        return dir;
      };

      setDirectories(updateDirectories(directories));
      setNewItemName("");
      setNewTokenSupply("");
      setNewNFTImage("");
      setIsModalOpen(false);
    }
  };

  const handleDrop = (items: (File | Directory)[], targetId: string) => {
    setItemsToMove(items);
    setMoveTargetId(targetId);
    setIsMoveModalOpen(true);
  };

  const handleMove = () => {
    const moveItems = (dir: Directory): Directory => {
      if (dir.id === moveTargetId) {
        const newFiles = [...(dir.files || [])];
        const newChildren = [...(dir.children || [])];
        itemsToMove.forEach((item) => {
          if ("type" in item) {
            newFiles.push(item as File);
          } else {
            newChildren.push(item as Directory);
          }
        });
        return { ...dir, files: newFiles, children: newChildren };
      }
      if (dir.children) {
        return { ...dir, children: dir.children.map(moveItems) };
      }
      return dir;
    };

    const removeItems = (dir: Directory): Directory => {
      const newFiles = (dir.files || []).filter(
        (file) =>
          !itemsToMove.some((item) => "id" in item && item.id === file.id)
      );
      const newChildren = (dir.children || [])
        .filter(
          (child) =>
            !itemsToMove.some((item) => "id" in item && item.id === child.id)
        )
        .map(removeItems);
      return { ...dir, files: newFiles, children: newChildren };
    };

    setDirectories(moveItems(removeItems(directories)));
    setItemsToMove([]);
    setMoveTargetId(null);
    setIsMoveModalOpen(false);
  };

  const handleFileSelection = useCallback(
    (file: File, event: React.MouseEvent) => {
      if (event.shiftKey) {
        setSelectedFiles((prev) => {
          const index = prev.findIndex((f) => f.id === file.id);
          if (index === -1) {
            return [...prev, file];
          } else {
            return prev.filter((_, i) => i !== index);
          }
        });
      } else {
        setSelectedFiles([file]);
      }
    },
    []
  );

  return (
    <div className="flex flex-col h-screen bg-white">
      <header className="flex items-center justify-between p-4 border-b">
        <h1 className="text-2xl font-semibold">Drive</h1>
        <div className="flex items-center space-x-4">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button>
                <Plus className="mr-2 h-4 w-4" /> New
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuItem
                onClick={() => {
                  setModalType("directory");
                  setIsModalOpen(true);
                }}
              >
                New Directory
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => {
                  setModalType("token");
                  setIsModalOpen(true);
                }}
              >
                New Token
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => {
                  setModalType("nft");
                  setIsModalOpen(true);
                }}
              >
                New NFT
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          <User className="h-8 w-8" />
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">
        <aside className="w-64 p-4 border-r overflow-y-auto">
          <DirectoryTree
            directory={directories}
            selectedDir={selectedDirId}
            onSelect={handleSelect}
            onDrop={handleDrop}
          />
        </aside>

        <main className="flex-1 p-4 overflow-y-auto">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold">
              /{selectedPath?.join("/")}
            </h2>
            <p className="text-sm text-gray-500">
              Permission: {selectedDirectory?.owner || "N/A"}
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {selectedDirectory?.children?.map((subDir) => (
              <div
                key={subDir.id}
                onClick={(e) => handleSelect(subDir.id)}
                draggable
                onDragStart={(e) =>
                  e.dataTransfer.setData(
                    "text/plain",
                    JSON.stringify([{ ...subDir, type: "directory" }])
                  )
                }
                onDragOver={(e) => e.preventDefault()}
                onDrop={(e) => {
                  e.preventDefault();
                  const data = JSON.parse(e.dataTransfer.getData("text/plain"));
                  handleDrop(data, subDir.id);
                }}
                className={`flex items-center p-2 border rounded cursor-pointer ${
                  selectedFiles.some((f) => f.id === subDir.id)
                    ? "bg-blue-100"
                    : ""
                }`}
              >
                <Folder className="h-6 w-6 mr-2" />
                <span>{subDir.name}</span>
              </div>
            ))}
            {selectedDirectory?.files?.map((file) => (
              <div
                key={file.id}
                onClick={(e) => handleFileSelection(file, e)}
                draggable
                onDragStart={(e) =>
                  e.dataTransfer.setData(
                    "text/plain",
                    JSON.stringify([{ ...file, type: "file" }])
                  )
                }
                className={`flex items-center p-2 border rounded cursor-pointer ${
                  selectedFiles.some((f) => f.id === file.id)
                    ? "bg-blue-100"
                    : ""
                }`}
              >
                {file.type === "ERC20" ? (
                  <DollarSign className="h-6 w-6 mr-2" />
                ) : file.type === "ERC721" ? (
                  <Image className="h-6 w-6 mr-2" />
                ) : (
                  <FileIcon className="h-6 w-6 mr-2" />
                )}
                <span>{file.name}</span>
              </div>
            ))}
          </div>
        </main>

        {selectedFiles.length === 1 && (
          <FileDetails
            file={selectedFiles[0]}
            onClose={() => setSelectedFiles([])}
          />
        )}
      </div>

      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add New {modalType}</DialogTitle>
          </DialogHeader>
          <Input
            placeholder={`Enter ${modalType} name`}
            value={newItemName}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
              setNewItemName(e.target.value)
            }
          />
          {modalType === "token" && (
            <Input
              type="number"
              placeholder="Enter token supply"
              value={newTokenSupply}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                setNewTokenSupply(e.target.value)
              }
            />
          )}
          {modalType === "nft" && (
            <Input
              placeholder="Enter image file name"
              value={newNFTImage}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                setNewNFTImage(e.target.value)
              }
            />
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsModalOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreateItem}>Create</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isMoveModalOpen} onOpenChange={setIsMoveModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Move Items</DialogTitle>
          </DialogHeader>
          <p>Are you sure you want to move the selected items?</p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsMoveModalOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleMove}>Move</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default GoogleDriveUI;
