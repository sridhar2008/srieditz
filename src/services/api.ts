import axios from 'axios';
import { auth } from '../lib/firebase';

export const api = axios.create({
  baseURL: '/api/v1',
  timeout: 30000,
});

api.interceptors.request.use(async (config) => {
  const currentUser = auth.currentUser;
  if (currentUser) {
    const token = await currentUser.getIdToken();
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (res) => res,
  (err) => {
    const message =
      err?.response?.data?.error ||
      err?.message ||
      'An unexpected network error occurred.';
    return Promise.reject(new Error(message));
  }
);

export async function uploadStudioFiles(
  files: File[],
  scope: string
): Promise<Array<{ url: string; originalName: string; size: number; mimeType: string }>> {
  const formData = new FormData();
  formData.append('scope', scope);
  files.forEach((file) => formData.append('files', file));

  const res = await api.post('/uploads', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return res.data.files || [];
}

export async function fetchAuthIdentity(): Promise<{
  uid: string;
  email: string | null;
  emailVerified: boolean;
  isAdmin: boolean;
}> {
  const res = await api.get('/auth/me');
  return res.data;
}

export async function getProtectedMediaUrl(url: string): Promise<string> {
  if (!url.startsWith('/api/v1/uploads/')) return url;
  const currentUser = auth.currentUser;
  if (!currentUser) return url;
  const token = await currentUser.getIdToken();
  const separator = url.includes('?') ? '&' : '?';
  return `${url}${separator}token=${encodeURIComponent(token)}`;
}
