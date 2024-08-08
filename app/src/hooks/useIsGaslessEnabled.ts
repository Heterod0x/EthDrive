"use client";

import { useCallback, useEffect, useState } from "react"

const KEY = "GASLESS_ENABLED";

export const useIsGasslessEnabled = () => {
    const [enabled, setEnabled] = useState(false);

    useEffect(() => {
        const rawValue = localStorage.getItem(KEY);
        setEnabled(rawValue === "true");
    }, []);

    const change = useCallback((newValue: boolean) => {
        localStorage.setItem(KEY, newValue.toString());
        setEnabled(newValue);
    }, []);

    return [enabled, change] as const;
}