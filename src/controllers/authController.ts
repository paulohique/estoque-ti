import { login, sanitizeUser } from "../services/authService";

export async function loginController(input: { username: string; password: string }) {
  const result = await login(input.username, input.password);
  if (!result) {
    return { ok: false, error: "Invalid credentials" };
  }

  return {
    ok: true,
    user: sanitizeUser(result.user),
    permissions: result.permissions,
  };
}
