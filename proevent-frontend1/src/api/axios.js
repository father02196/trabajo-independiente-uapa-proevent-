import axios from 'axios';

// Instancia base de Axios
const axiosInstance = axios.create({
  baseURL: 'http://localhost:8080', // Backend URL
  withCredentials: true // Permite enviar y recibir HttpOnly Cookies (Access y Refresh)
});

// Variables para manejar concurrencia en la renovación de tokens (Race Condition)
let isRefreshing = false;
let refreshSubscribers = [];

const onRefreshed = () => {
  refreshSubscribers.forEach(cb => cb());
  refreshSubscribers = [];
};

const onRefreshFailed = () => {
  refreshSubscribers.forEach(cb => cb(new Error('Refresh failed')));
  refreshSubscribers = [];
};

// Interceptor de Respuestas
axiosInstance.interceptors.response.use(
  (response) => {
    return response;
  },
  async (error) => {
    const originalRequest = error.config;

    if (
      error.response?.status === 401 && 
      !originalRequest._retry && 
      !originalRequest.url.includes('/login') &&
      !originalRequest.url.includes('/api/auth/refresh') &&
      !originalRequest.url.includes('/solicitar-restablecimiento')
    ) {
      originalRequest._retry = true; 

      if (!isRefreshing) {
        isRefreshing = true;
        try {
          await axios.post('http://localhost:8080/api/auth/refresh', {}, { withCredentials: true });
          isRefreshing = false;
          onRefreshed();
          return axiosInstance(originalRequest);
        } catch (refreshError) {
          isRefreshing = false;
          onRefreshFailed();
          window.dispatchEvent(new Event('auth:logout'));
          return Promise.reject(error); // Reject with original error, not the refresh error
        }
      } else {
        // Encolar la petición si ya se está renovando el token
        return new Promise((resolve, reject) => {
          refreshSubscribers.push((err) => {
            if (err) return reject(error); // Rechazar con el error 401 original si falla
            resolve(axiosInstance(originalRequest));
          });
        });
      }
    }
    return Promise.reject(error);
  }
);

// MOCK FETCH: Sobrescribir window.fetch para que use Axios internamente.
// Esto permite que todos los componentes existentes que usan fetch() se 
// beneficien del interceptor de Axios (y de las cookies) sin modificar 40 archivos.
const originalFetch = window.fetch;
window.fetch = async (resource, options = {}) => {
  // Si no es una URL de nuestra API o es un FormData (subida de archivos), usamos el fetch original
  // con credentials='include' para que envíe las cookies.
  if (typeof resource !== 'string' || !resource.includes('localhost:8080')) {
     return originalFetch(resource, options);
  }
  
  if (options.body instanceof FormData) {
     options.credentials = 'include';
     const fetchRes = await originalFetch(resource, options);
     if (fetchRes.status === 401) {
       // Lógica simple de refresh para FormData
       try {
         const ref = await originalFetch('http://localhost:8080/api/auth/refresh', { method: 'POST', credentials: 'include' });
         if (ref.ok) return originalFetch(resource, options);
       } catch (e) {
         window.dispatchEvent(new Event('auth:logout'));
       }
     }
     return fetchRes;
  }

  try {
    let parsedBody = undefined;
    if (options.body && typeof options.body === 'string') {
      try {
        parsedBody = JSON.parse(options.body);
      } catch (e) {
        parsedBody = options.body;
      }
    }

    const axiosConfig = {
      url: resource,
      method: options.method || 'GET',
      data: parsedBody,
      headers: options.headers || {},
    };

    const res = await axiosInstance(axiosConfig);
    
    // Simular el objeto Response de fetch
    return {
      ok: res.status >= 200 && res.status < 300,
      status: res.status,
      json: async () => res.data,
      text: async () => JSON.stringify(res.data)
    };

  } catch (err) {
    if (err.response) {
      return {
        ok: false,
        status: err.response.status,
        json: async () => err.response.data,
        text: async () => JSON.stringify(err.response.data)
      };
    }
    // Error de red
    throw err;
  }
};

export default axiosInstance;
