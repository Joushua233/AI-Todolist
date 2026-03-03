import { supabase } from './supabase';

const API_BASE_URL = '/api';

/**
 * Helper to fetch with auth token
 */
async function fetchWithAuth(endpoint: string, options: RequestInit = {}) {
    const { data: { session } } = await supabase.auth.getSession();

    const headers: HeadersInit = {
        'Content-Type': 'application/json',
        ...(options.headers || {})
    };

    if (session?.access_token) {
        headers['Authorization'] = `Bearer ${session.access_token}`;
    }

    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        ...options,
        headers
    });

    if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `Request failed with status ${response.status}`);
    }

    // Handle empty responses (like 204 No Content or simple success)
    const text = await response.text();
    return text ? JSON.parse(text) : null;
}

export const api = {
    // Tasks
    getTasks: () => fetchWithAuth('/tasks'),
    createTask: (data: any) => fetchWithAuth('/tasks', { method: 'POST', body: JSON.stringify(data) }),
    updateTask: (id: string, data: any) => fetchWithAuth(`/tasks/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
    deleteTask: (id: string) => fetchWithAuth(`/tasks/${id}`, { method: 'DELETE' }),

    // Agendas
    getAgendas: () => fetchWithAuth('/agendas'),
    createAgenda: (data: any) => fetchWithAuth('/agendas', { method: 'POST', body: JSON.stringify(data) }),
    updateAgenda: (id: string, data: any) => fetchWithAuth(`/agendas/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
    deleteAgenda: (id: string) => fetchWithAuth(`/agendas/${id}`, { method: 'DELETE' }),

    // Transcripts
    getTranscripts: () => fetchWithAuth('/transcripts'),
    createTranscript: (data: any) => fetchWithAuth('/transcripts', { method: 'POST', body: JSON.stringify(data) }),
    updateTranscript: (id: string, data: any) => fetchWithAuth(`/transcripts/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
    deleteTranscript: (id: string) => fetchWithAuth(`/transcripts/${id}`, { method: 'DELETE' }),
};
