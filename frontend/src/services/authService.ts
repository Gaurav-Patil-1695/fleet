import apiClient from './apiClient';
import type { LoginRequest, TokenResponse, RefreshRequest } from '../types/auth';
import type { User } from '../types/auth';

export async function login(body: LoginRequest): Promise<TokenResponse> {
  const response = await apiClient.post<TokenResponse>('/auth/login', body);
  return response.data;
}

export async function refreshToken(body: RefreshRequest): Promise<TokenResponse> {
  const response = await apiClient.post<TokenResponse>('/auth/refresh', body);
  return response.data;
}

export async function logout(): Promise<void> {
  await apiClient.post('/auth/logout');
}

export async function getCurrentUser(): Promise<User> {
  const response = await apiClient.get<User>('/auth/me');
  return response.data;
}
