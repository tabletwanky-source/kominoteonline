import { Profile, UserRole } from './database';

export interface User extends Profile {
  token?: string;
}

export interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  role: UserRole | null;
}

export interface LoginCredentials {
  email: string;
  password?: string;
}

export interface RegisterCredentials {
  full_name: string;
  email: string;
  password?: string;
  role?: UserRole;
}
