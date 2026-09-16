"use client";

import {
  APP_ROLE_STORAGE_KEY,
  DEFAULT_APP_ROLE,
  getAppRoleLabel,
  isAppRole,
  type AppRole,
} from "@/lib/roles";
import { useCallback, useEffect, useState, useSyncExternalStore } from "react";

const listeners = new Set<() => void>();

function emit() {
  for (const listener of listeners) listener();
}

function readRole(): AppRole {
  if (typeof window === "undefined") return DEFAULT_APP_ROLE;
  try {
    const stored = window.localStorage.getItem(APP_ROLE_STORAGE_KEY);
    if (isAppRole(stored)) return stored;
  } catch {
    // Ignore storage failures in private mode.
  }
  return DEFAULT_APP_ROLE;
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

function getSnapshot() {
  return readRole();
}

function getServerSnapshot() {
  return DEFAULT_APP_ROLE;
}

export function useAppRole() {
  const role = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setHydrated(true);
  }, []);

  const setRole = useCallback((next: AppRole) => {
    try {
      window.localStorage.setItem(APP_ROLE_STORAGE_KEY, next);
    } catch {
      // Ignore storage failures in private mode.
    }
    emit();
  }, []);

  return {
    role,
    roleLabel: getAppRoleLabel(role),
    setRole,
    hydrated,
  };
}
