export interface User {
  id: number;
  username: string;
  displayName: string;
  email?: string | null;
  passwordHash?: string | null;
  roleId: number;
  active: boolean;
  createdAt?: string;
  updatedAt?: string;
}
