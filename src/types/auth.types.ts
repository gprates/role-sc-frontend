export interface UserPublic {
  _id: string;
  nome: string;
  email: string;
  createdAt: string;
}

export interface LoginBody {
  email: string;
  senha: string;
}

export interface LoginResponse {
  success: true;
  token: string;
  user: UserPublic;
}

export interface RegisterBody {
  nome: string;
  email: string;
  senha: string;
}

export interface RegisterResponse {
  success: true;
  message: string;
}

export interface MeResponse {
  success: true;
  user: UserPublic;
}

export interface ApiErrorBody {
  success: false;
  message: string;
}
