import { redirect } from '@tanstack/react-router'

const TOKEN_COOKIE = 'access-token'
const LEGACY_TOKEN_COOKIE = 'access_token'
const LEGACY_AUTH_COOKIE = 'auth_token'

// Function to get cookie value by name (only for non-HttpOnly cookies)
function getCookie(name: string): string | null {
  if (typeof document === 'undefined') return null;
  
  const nameEQ = name + "=";
  const ca = document.cookie.split(';');
  for(let i = 0; i < ca.length; i++) {
    let c = ca[i];
    while (c.charAt(0) === ' ') c = c.substring(1, c.length);
    if (c.indexOf(nameEQ) === 0) return c.substring(nameEQ.length, c.length);
  }
  return null;
}

// Function to set cookie
function setCookie(name: string, value: string, days?: number): void {
  if (typeof document === 'undefined') return;
  
  let expires = "";
  if (days) {
    const date = new Date();
    date.setTime(date.getTime() + (days * 24 * 60 * 60 * 1000));
    expires = "; expires=" + date.toUTCString();
  }
  // Set cookie for .treatmentgps.com domain to share across subdomains
  document.cookie = name + "=" + (value || "") + expires + "; path=/; domain=.treatmentgps.com; secure; SameSite=Lax";
}

// Function to delete cookie
function deleteCookie(name: string): void {
  if (typeof document === 'undefined') return;
  
  document.cookie = name + "=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; domain=.treatmentgps.com;";
}

// Verify authentication through backend API call
async function verifyAuthFromBackend(): Promise<Record<string, unknown> | null> {
  const query = `
    query Me {
      me {
        _id
        email
        firstName
        lastName
        role
        organization {
          idOrg: _id
          name
        }
      }
    }
  `;

  try {
    const response = await fetch('https://api-stag.treatmentgps.com/graphql', {
      method: 'POST',
      credentials: 'include', // This ensures HttpOnly cookies are sent
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        query,
      }),
    });

    if (response.ok) {
      const { data, errors } = await response.json();
      if (data?.me && !errors) {
        return data.me;
      }
    }
  } catch (error) {
    console.error('Auth verification failed:', error);
  }
  return null;
}

export const auth = {
  isAuthenticated: async () => {
    // First try to verify with backend API using HttpOnly cookies
    const user = await verifyAuthFromBackend();
    if (user) {
      // Store user data for future use
      localStorage.setItem('user_details', JSON.stringify(user));
      localStorage.setItem('access_token', 'verified'); // Indicate we're authenticated
      return true;
    }
    
    // Fallback to existing localStorage check for non-HttpOnly tokens
    return !!localStorage.getItem('access_token');
  },

  getToken: async () => {
    // First try backend verification which will work with HttpOnly cookies
    const user = await verifyAuthFromBackend();
    if (user) {
      return 'verified'; // Indicate backend verification succeeded
    }
    
    // Fallback: check for shared cookie from treatmentgps.com (for non-HttpOnly cookies)
    const sharedToken = getCookie(TOKEN_COOKIE) || getCookie(LEGACY_TOKEN_COOKIE) || getCookie(LEGACY_AUTH_COOKIE);
    if (sharedToken) {
      // Store in localStorage for current session as backup
      localStorage.setItem('access_token', sharedToken);
      return sharedToken;
    }
    
    // Fallback to localStorage
    return localStorage.getItem('access_token');
  },

  setToken: (token: string) => {
    // Set both cookie (for subdomain sharing) and localStorage
    setCookie(TOKEN_COOKIE, token, 7); // 7 days expiration
    deleteCookie(LEGACY_TOKEN_COOKIE)
    deleteCookie(LEGACY_AUTH_COOKIE)
    localStorage.setItem('access_token', token);
  },

  getUser: async () => {
    // First try backend verification
    const user = await verifyAuthFromBackend();
    if (user) {
      // Store in localStorage for consistency
      localStorage.setItem('user_details', JSON.stringify(user));
      return user;
    }
    
    // Try to get user from localStorage
    const storedUser = localStorage.getItem('user_details');
    if (storedUser) {
      try {
        return JSON.parse(storedUser);
      } catch {
        return null;
      }
    }
    
    return null;
  },

  setUser: (user: Record<string, unknown>) => {
    // Set both cookie (for subdomain sharing) and localStorage
    setCookie('user_details', JSON.stringify(user), 7); // 7 days expiration
    localStorage.setItem('user_details', JSON.stringify(user));
  },

  logout: () => {
    // Delete both cookie and localStorage
    deleteCookie(TOKEN_COOKIE);
    deleteCookie(LEGACY_TOKEN_COOKIE)
    deleteCookie(LEGACY_AUTH_COOKIE);
    deleteCookie('user_details');
    localStorage.removeItem('access_token');
    localStorage.removeItem('user_details');
  },
}

interface AuthContext {
  auth: typeof auth
}

export const authGuard = async ({ context, location }: { context: AuthContext; location: Location }) => {
  const isAuthenticated = await context.auth.isAuthenticated();
  if (!isAuthenticated) {
    throw redirect({
      to: '/',
      search: {
        redirect: location.href,
      },
    })
  }
}