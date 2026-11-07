export type Theme = "clouds" | "atc";
export const brandAssets: Record<Theme, string> = {
  clouds: "/streamline-mark.png",
  atc: "/streamline-mark-atc.png",
};
export function readTheme(storage: Pick<Storage, "getItem">): Theme {
  try {
    return storage.getItem("streamline-theme") === "atc" ? "atc" : "clouds";
  } catch {
    return "clouds";
  }
}
export function persistTheme(storage: Pick<Storage, "setItem">, theme: Theme) {
  try {
    storage.setItem("streamline-theme", theme);
  } catch {
    /* Session-only preference. */
  }
}
