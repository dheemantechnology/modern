// Utility to make HTTP requests to the custom Node.js backend

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api';

export const apiClient = {
  async get(endpoint: string) {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
    });
    if (!response.ok) {
        let msg = 'Request failed';
        try { const err = await response.json(); msg = err.error || msg; } catch(e){}
        throw new Error(msg);
    }
    return response.json();
  },

  async post(endpoint: string, body: any) {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
      credentials: 'include',
    });
    if (!response.ok) {
        let msg = 'Request failed';
        try { const err = await response.json(); msg = err.error || msg; } catch(e){}
        throw new Error(msg);
    }
    return response.json();
  },

  async put(endpoint: string, body: any) {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
      credentials: 'include',
    });
    if (!response.ok) {
        let msg = 'Request failed';
        try { const err = await response.json(); msg = err.error || msg; } catch(e){}
        throw new Error(msg);
    }
    return response.json();
  },

  async delete(endpoint: string) {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      method: 'DELETE',
      credentials: 'include',
    });
    if (!response.ok) {
        let msg = 'Request failed';
        try { const err = await response.json(); msg = err.error || msg; } catch(e){}
        throw new Error(msg);
    }
    return response.json();
  },
};
