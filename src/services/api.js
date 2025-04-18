const BASE_URL = '/evaluation-service';

const AUTH_CONFIG = {
  clientId: '1cb41f3d-96be-45b7-8975-bd95819e6318',
  clientSecret: 'NjsGEkXUGGVtSHdP'
};

let authToken = null;

const getAuthToken = async () => {
  try {
    if (authToken) return authToken;

    const response = await fetch(`${BASE_URL}/auth/token`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify(AUTH_CONFIG)
    });

    if (!response.ok) {
      throw new Error(`Auth failed: ${response.status}`);
    }

    const data = await response.json();
    authToken = data.access_token;
    return authToken;
  } catch (error) {
    console.error('Authentication error:', error);
    throw error;
  }
};

const makeAuthenticatedRequest = async (endpoint, options = {}) => {
  try {
    const token = await getAuthToken();
    const response = await fetch(`${BASE_URL}${endpoint}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'Authorization': `Bearer ${token}`,
        ...options.headers
      }
    });

    if (!response.ok) {
      // If token expired, try to get a new one and retry once
      if (response.status === 401) {
        authToken = null;
        const newToken = await getAuthToken();
        const retryResponse = await fetch(`${BASE_URL}${endpoint}`, {
          ...options,
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
            'Authorization': `Bearer ${newToken}`,
            ...options.headers
          }
        });
        if (!retryResponse.ok) {
          throw new Error(`API call failed after token refresh: ${retryResponse.status}`);
        }
        return retryResponse.json();
      }
      throw new Error(`API call failed: ${response.status}`);
    }

    return response.json();
  } catch (error) {
    console.error('API request failed:', error);
    throw error;
  }
};

export const fetchUsers = async () => {
  try {
    const users = await makeAuthenticatedRequest('/users');
    return users;
  } catch (error) {
    console.error('Error fetching users:', error);
    return [];
  }
};

export const fetchUserPosts = async (userId) => {
  try {
    const posts = await makeAuthenticatedRequest(`/users/${userId}/posts`);
    return posts;
  } catch (error) {
    console.error('Error fetching user posts:', error);
    return [];
  }
};

export const fetchPostComments = async (postId) => {
  try {
    const comments = await makeAuthenticatedRequest(`/posts/${postId}/comments`);
    return comments;
  } catch (error) {
    console.error('Error fetching post comments:', error);
    return [];
  }
}; 