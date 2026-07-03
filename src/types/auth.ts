export type AppRole = 'admin' | 'general' | 'region';

export interface UserProfile {
  id: string;
  email: string;
  username: string;
  role: AppRole;
  region: string | null;
  active: boolean;
}

export type AccessScope = 'region' | 'general_admin';

export interface AppAccessSession {
  scope: AccessScope;
  role: AppRole;
  region: string | null;
  accessKey: string;
  loggedAt: string;
}
