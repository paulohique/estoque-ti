import type { User } from "../models/User";

export async function getUserById(_id: number): Promise<User | null> {
  // Implementar com MySQL.
  return null;
}

export async function getUserByUsername(_username: string): Promise<User | null> {
  // Implementar com MySQL.
  return null;
}

export async function createUser(_user: User): Promise<User> {
  // Implementar com MySQL.
  return _user;
}
