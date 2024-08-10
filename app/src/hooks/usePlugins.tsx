"use client";

import React, {
  ReactNode,
  createContext,
  useContext,
  useEffect,
  useState,
} from "react";

// Define the shape of the plugins state
interface PluginsState {
  isAccountKitEnabled: boolean;
  isCrosschainGasSubsidiaryEnabled: boolean;
}

// Define the shape of the context value
interface PluginsContextValue {
  plugins: PluginsState;
  setPlugins: React.Dispatch<React.SetStateAction<PluginsState>>;
}

// Create the context with an undefined default value
const PluginsContext = createContext<PluginsContextValue | undefined>(
  undefined,
);

// Create the provider component
export const PluginsProvider: React.FC<{ children: ReactNode }> = ({
  children,
}) => {
  const [plugins, setPlugins] = useState<PluginsState>({
    isAccountKitEnabled: false, // default state
    isCrosschainGasSubsidiaryEnabled: false,
  });

  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    if (isMounted) {
      const savedPlugins = localStorage.getItem("pluginsState");
      if (savedPlugins) {
        setPlugins(JSON.parse(savedPlugins));
      }
    }
  }, [isMounted]);

  useEffect(() => {
    if (isMounted) {
      localStorage.setItem("pluginsState", JSON.stringify(plugins));
    }
  }, [plugins, isMounted]);

  // Render nothing on the server side (or during the initial client-side hydration)
  if (!isMounted) {
    return null;
  }

  return (
    <PluginsContext.Provider value={{ plugins, setPlugins }}>
      {children}
    </PluginsContext.Provider>
  );
};

// Custom hook to use the Plugins context
export const usePlugins = (): PluginsContextValue => {
  const context = useContext(PluginsContext);

  if (context === undefined) {
    throw new Error("usePlugins must be used within a PluginsProvider");
  }

  return context;
};
