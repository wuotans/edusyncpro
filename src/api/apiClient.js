const API_URL = (import.meta.env.VITE_API_URL || '/api').replace(/\/$/, '');
const TOKEN_KEY = 'edusync_access_token';

const getToken = () => localStorage.getItem(TOKEN_KEY);

const setToken = (token) => {
  if (token) localStorage.setItem(TOKEN_KEY, token);
  else localStorage.removeItem(TOKEN_KEY);
};

async function request(path, options = {}) {
  const headers = new Headers(options.headers || {});
  const token = getToken();

  if (options.body && !(options.body instanceof FormData)) {
    headers.set('Content-Type', 'application/json');
  }
  if (token) headers.set('Authorization', `Bearer ${token}`);

  const response = await fetch(`${API_URL}${path}`, {
    ...options,
    headers,
    body:
      options.body && !(options.body instanceof FormData) && typeof options.body !== 'string'
        ? JSON.stringify(options.body)
        : options.body,
  });

  if (response.status === 204) return null;

  const contentType = response.headers.get('content-type') || '';
  const data = contentType.includes('application/json')
    ? await response.json()
    : await response.text();

  if (!response.ok) {
    const error = new Error(data?.message || data?.error || 'Erro na API');
    error.status = response.status;
    error.data = data;
    throw error;
  }

  return data;
}

const entityPath = (name) => `/entities/${name}`;

const encodeFilters = (filters = {}) => {
  const params = new URLSearchParams();
  Object.entries(filters).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') params.set(key, value);
  });
  const query = params.toString();
  return query ? `?${query}` : '';
};

const createEntityClient = (name) => ({
  list: () => request(entityPath(name)),
  filter: (filters) => request(`${entityPath(name)}${encodeFilters(filters)}`),
  get: (id) => request(`${entityPath(name)}/${id}`),
  create: (data) => request(entityPath(name), { method: 'POST', body: data }),
  bulkCreate: (items) => request(`${entityPath(name)}/bulk`, { method: 'POST', body: items }),
  update: (id, data) => request(`${entityPath(name)}/${id}`, { method: 'PUT', body: data }),
  delete: (id) => request(`${entityPath(name)}/${id}`, { method: 'DELETE' }),
});

export const api = {
  auth: {
    me: () => request('/auth/me'),
    loginViaEmailPassword: async (email, password) => {
      const result = await request('/auth/login', { method: 'POST', body: { email, password } });
      if (result?.access_token) setToken(result.access_token);
      return result;
    },
    register: (payload) => request('/auth/register', { method: 'POST', body: payload }),
    verifyOtp: async (payload) => {
      const result = await request('/auth/verify-otp', { method: 'POST', body: payload });
      if (result?.access_token) setToken(result.access_token);
      return result;
    },
    resendOtp: (email) => request('/auth/resend-otp', { method: 'POST', body: { email } }),
    resetPasswordRequest: (email) => request('/auth/forgot-password', { method: 'POST', body: { email } }),
    resetPassword: ({ resetToken, newPassword }) => request('/auth/reset-password', {
      method: 'POST',
      body: { token: resetToken, password: newPassword },
    }),
    loginWithProvider: (provider, redirect = '/') => {
      window.location.href = `${API_URL}/auth/oauth/${provider}?redirect=${encodeURIComponent(redirect)}`;
    },
    setToken,
    logout: (redirectTo) => {
      setToken(null);
      if (redirectTo) window.location.href = redirectTo;
    },
    redirectToLogin: (redirectTo = window.location.href) => {
      window.location.href = `/login?redirect=${encodeURIComponent(redirectTo)}`;
    },
  },
  users: {
    inviteUser: (email, role, schoolId = null) => request('/users/invite', {
      method: 'POST',
      body: { email, role, school_id: schoolId },
    }),
  },
  entities: {
    Activity: createEntityClient('activities'),
    Grade: createEntityClient('grades'),
    LessonPlan: createEntityClient('lesson-plans'),
    Observation: createEntityClient('observations'),
    School: createEntityClient('schools'),
    SchoolClass: createEntityClient('classes'),
    Student: createEntityClient('students'),
    Subject: createEntityClient('subjects'),
    TeacherAssignment: createEntityClient('teacher-assignments'),
    User: createEntityClient('users'),
  },
};
