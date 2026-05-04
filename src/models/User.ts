export interface User {
  id: number;
  username: string;
  displayName: string;
  email?: string | null;
  passwordHash?: string | null;
  roleId: number;
  roleName?: string | null;
  active: boolean;
  firstAccessPending?: boolean;
  lastLoginAt?: string | null;
  deletedAt?: string | null;
  createdAt?: string;
  updatedAt?: string;
}
