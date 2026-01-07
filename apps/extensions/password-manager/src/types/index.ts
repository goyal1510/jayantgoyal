// Type definitions for password manager

export interface PasswordEntry {
  id: string;
  website: string;
  username: string;
  password: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface PasswordManagerState {
  passwords: PasswordEntry[];
  masterPassword?: string;
}
