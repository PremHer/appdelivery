import axios, { AxiosInstance, AxiosError } from 'axios';
import { API_CONFIG } from '../constants';
import { useAuthStore } from '../context/stores';

// Crear instancia de Axios
const api: AxiosInstance = axios.create({
    baseURL: API_CONFIG.BASE_URL,
    timeout: API_CONFIG.TIMEOUT,
    headers: {
        'Content-Type': 'application/json',
    },
});

// Interceptor para agregar token
api.interceptors.request.use(
    (config) => {
        const token = useAuthStore.getState().token;
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => Promise.reject(error)
);

// Interceptor para manejar errores
api.interceptors.response.use(
    (response) => response,
    (error: AxiosError) => {
        if (error.response?.status === 401) {
            // Token expirado, cerrar sesión
            useAuthStore.getState().logout();
        }
        return Promise.reject(error);
    }
);

export default api;
