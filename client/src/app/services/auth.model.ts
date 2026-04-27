export interface UserData {
  id?: string;
  role?: string;
  name?: string;
  email?: string;
  pictureUrl?: string;
}

export interface AuthResponse {
  success: boolean;
  message: string;
  token: string;
  data: UserData;
}

export interface LoginPayload {
  email: string;
  password: string;
}

export interface RegisterPayload {
  name: string;
  email: string;
  password: string;
  pictureUrl?: string;
}
