export const APP_ROLES = ["underwriter", "manager"] as const;

export type AppRole = (typeof APP_ROLES)[number];

export const DEFAULT_APP_ROLE: AppRole = "underwriter";

export const APP_ROLE_LABELS: Record<AppRole, string> = {
  underwriter: "Underwriter",
  manager: "Manager",
};

export const APP_ROLE_STORAGE_KEY = "document-review:role";

export function isAppRole(value: unknown): value is AppRole {
  return typeof value === "string" && APP_ROLES.includes(value as AppRole);
}

export function getAppRoleLabel(role: AppRole) {
  return APP_ROLE_LABELS[role];
}
