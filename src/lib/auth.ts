import { redirect } from '@tanstack/react-router'

// Function to get cookie value by name
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

export const auth = {
  isAuthenticated: () => {
    // First check for shared cookie from treatmentgps.com
    const sharedToken = getCookie('access_token');
    if (sharedToken) {
      // Store in localStorage for current session as backup
      localStorage.setItem('access_token', sharedToken);
      return true;
    }
    
    // Fallback to localStorage
    return !!localStorage.getItem('access_token');
  },

  getToken: () => {
    // First check for shared cookie from treatmentgps.com
    const sharedToken = getCookie('access_token');
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
    setCookie('access_token', token, 7); // 7 days expiration
    localStorage.setItem('access_token', token);
  },

  getUser: () => {
    // Try to get user from shared cookie first
    const sharedUser = getCookie('user_details');
    if (sharedUser) {
      try {
        return JSON.parse(sharedUser);
      } catch {
        // If parsing fails, fallback to localStorage
      }
    }
    
    // Fallback to localStorage
    const user = localStorage.getItem('user_details');
    return user ? JSON.parse(user) : null;
  },

  setUser: (user: Record<string, unknown>) => {
    // Set both cookie (for subdomain sharing) and localStorage
    setCookie('user_details', JSON.stringify(user), 7); // 7 days expiration
    localStorage.setItem('user_details', JSON.stringify(user));
  },

  logout: () => {
    // Delete both cookie and localStorage
    deleteCookie('access_token');
    deleteCookie('user_details');
    localStorage.removeItem('access_token');
    localStorage.removeItem('user_details');
  },
}

interface AuthContext {
  auth: typeof auth
}

export const authGuard = ({ context, location }: { context: AuthContext; location: Location }) => {
  if (!context.auth.isAuthenticated()) {
    throw redirect({
      to: '/',
      search: {
        redirect: location.href,
      },
    })
  }
}