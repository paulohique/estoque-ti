export function requirePermission(hasPermission: (code: string) => boolean, code: string) {
  if (!hasPermission(code)) {
    throw new Error("Forbidden");
  }
}
