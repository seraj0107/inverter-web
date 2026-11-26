import { useSyncExternalStore } from "react";

const STORAGE_KEY = "sidebar-collapsed";
const listeners = new Set();

function readInitialValue() {
  try {
    return window.localStorage.getItem(STORAGE_KEY) === "true";
  } catch {
    return false;
  }
}

function writeValue(value) {
  try {
    window.localStorage.setItem(STORAGE_KEY, String(value));
    return true;
  } catch {
    return false;
  }
}

let collapsed = readInitialValue();

function subscribe(listener) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

function getSnapshot() {
  return collapsed;
}

function getServerSnapshot() {
  return false;
}

export function setSidebarCollapsed(value) {
  const next = typeof value === "function" ? value(collapsed) : Boolean(value);
  if (next === collapsed) return;

  collapsed = next;
  writeValue(next);
  listeners.forEach((listener) => listener());
}

export function toggleSidebarCollapsed() {
  setSidebarCollapsed((value) => !value);
}

export function useSidebarCollapsed() {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}
