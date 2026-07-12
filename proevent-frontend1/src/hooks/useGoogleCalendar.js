// ============================================================
// HOOK: useGoogleCalendar
// PROYECTO: UAPA-PROEVENT
// DESCRIPCIÓN: Hook reutilizable para interactuar con el servicio
//              de integración de Google Calendar desde cualquier
//              componente React del sistema.
// ============================================================

import { useState, useCallback } from 'react';

const API_BASE = process.env.REACT_APP_API_URL || 'http://localhost:8080';

export const useGoogleCalendar = () => {
  const [loading, setLoading] = useState(false);
  const [authorized, setAuthorized] = useState(null); // null = desconocido, true/false = verificado

  /**
   * Verifica si el sistema ya está autorizado con Google Calendar.
   */
  const checkAuthStatus = useCallback(async () => {
    try {
      const res = await fetch(`${API_BASE}/google-calendar/auth-status`);
      const data = await res.json();
      setAuthorized(data.authorized);
      return data.authorized;
    } catch {
      setAuthorized(false);
      return false;
    }
  }, []);

  /**
   * Inicia el flujo OAuth abriendo una ventana emergente de autorización de Google.
   * Devuelve una Promise que se resuelve cuando el usuario completa la autorización.
   */
  const authorize = useCallback(async () => {
    try {
      const res = await fetch(`${API_BASE}/google-calendar/auth-url`);
      const data = await res.json();
      if (!data.url) throw new Error('No se pudo obtener la URL de autorización');

      // Abrir ventana emergente de autorización
      const popup = window.open(data.url, 'Google Auth', 'width=600,height=650,scrollbars=yes');

      // Escuchar cuando la ventana se cierra para actualizar el estado
      return new Promise((resolve) => {
        const checkClosed = setInterval(async () => {
          if (popup && popup.closed) {
            clearInterval(checkClosed);
            const isAuth = await checkAuthStatus();
            resolve(isAuth);
          }
        }, 500);
      });
    } catch (error) {
      console.error('[useGoogleCalendar] Error al autorizar:', error);
      return false;
    }
  }, [checkAuthStatus]);

  /**
   * Exporta un evento al Google Calendar.
   * Si no está autorizado, inicia el flujo OAuth automáticamente.
   * @param {number|string} eventoId - ID del evento en UAPA-PROEVENT
   * @returns {Object} { success, accion, googleEventId, mensaje }
   */
  const exportarEvento = useCallback(async (eventoId) => {
    setLoading(true);
    try {
      // Verificar autorización
      const isAuth = await checkAuthStatus();
      if (!isAuth) {
        const authorized = await authorize();
        if (!authorized) {
          return { success: false, mensaje: 'Autorización cancelada por el usuario' };
        }
      }

      // Exportar el evento
      const res = await fetch(`${API_BASE}/google-calendar/exportar/${eventoId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.mensaje || data.error || 'Error al exportar');
      return data;
    } catch (error) {
      console.error('[useGoogleCalendar] Error al exportar:', error);
      return { success: false, mensaje: error.message };
    } finally {
      setLoading(false);
    }
  }, [checkAuthStatus, authorize]);

  /**
   * Elimina un evento de Google Calendar.
   * @param {number|string} eventoId - ID del evento en UAPA-PROEVENT
   */
  const eliminarDeGoogleCalendar = useCallback(async (eventoId) => {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/google-calendar/eliminar/${eventoId}`, {
        method: 'DELETE',
      });
      const data = await res.json();
      return data;
    } catch (error) {
      console.error('[useGoogleCalendar] Error al eliminar:', error);
      return { success: false, mensaje: error.message };
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    loading,
    authorized,
    checkAuthStatus,
    authorize,
    exportarEvento,
    eliminarDeGoogleCalendar,
  };
};
