import { browser } from "$app/environment";

export function getTimePreference() {
  if (!browser) return undefined;
  const setting = localStorage.getItem("timeFormat");
  if (setting === null) return undefined;
  return setting === "12h";
}

export function getDateFormatLocale() {
  if (!browser) return undefined;
  const setting = localStorage.getItem("dateFormat");
  return setting ?? undefined;
}