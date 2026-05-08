export interface UserData {
  id?: string;
  role?: string;
  name?: string;
  email?: string;
  pictureUrl?: string;
  phone?: string;
  location?: string;
  emailNotificationsEnabled?: boolean;
  marketingUpdatesEnabled?: boolean;
  bookingRemindersEnabled?: boolean;
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
