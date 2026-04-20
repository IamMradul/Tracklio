export interface GoogleUserProfile {
  email: string;
  name?: string;
  picture?: string;
}

export interface GoogleTokenResult {
  accessToken: string;
  expiresAt: number;
  scope: string;
}

declare global {
  interface Window {
    google?: {
      accounts?: {
        oauth2?: {
          initTokenClient: (config: {
            client_id: string;
            scope: string;
              callback: (response: { access_token?: string; expires_in?: number; scope?: string; error?: string }) => void;
            error_callback?: (error: { type?: string }) => void;
          }) => {
            requestAccessToken: (options?: { prompt?: string }) => void;
          };
        };
      };
    };
  }
}

const GOOGLE_SCRIPT_URL = 'https://accounts.google.com/gsi/client';
const GOOGLE_SIGNIN_SCOPE = [
  'openid',
  'email',
  'profile',
  'https://www.googleapis.com/auth/calendar.events',
  'https://www.googleapis.com/auth/calendar.readonly',
].join(' ');

const loadGoogleScript = async (): Promise<void> => {
  if (window.google?.accounts?.oauth2) {
    return;
  }

  await new Promise<void>((resolve, reject) => {
    const existing = document.querySelector<HTMLScriptElement>(`script[src="${GOOGLE_SCRIPT_URL}"]`);
    if (existing) {
      existing.addEventListener('load', () => resolve(), { once: true });
      existing.addEventListener('error', () => reject(new Error('Failed to load Google script.')), { once: true });
      return;
    }

    const script = document.createElement('script');
    script.src = GOOGLE_SCRIPT_URL;
    script.async = true;
    script.defer = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error('Failed to load Google script.'));
    document.head.appendChild(script);
  });
};

export const requestGoogleAccessToken = async (clientId: string, scope: string): Promise<GoogleTokenResult> => {
  if (!clientId) {
    throw new Error('Google Client ID is not configured.');
  }

  await loadGoogleScript();

  const token = await new Promise<GoogleTokenResult>((resolve, reject) => {
    const tokenClient = window.google?.accounts?.oauth2?.initTokenClient({
      client_id: clientId,
      scope,
      callback: (response) => {
        if (!response.access_token) {
          reject(new Error(response.error || 'Failed to get Google access token.'));
          return;
        }

        resolve({
          accessToken: response.access_token,
          expiresAt: Date.now() + ((response.expires_in ?? 3600) * 1000),
          scope: response.scope || scope,
        });
      },
      error_callback: () => {
        reject(new Error('Google sign-in was cancelled or failed.'));
      },
    });

    if (!tokenClient) {
      reject(new Error('Google OAuth client could not be initialized.'));
      return;
    }

    tokenClient.requestAccessToken({ prompt: 'consent' });
  });

  return token;
};

export const signInWithGoogleDirect = async (clientId: string): Promise<GoogleUserProfile & GoogleTokenResult> => {
  if (!clientId) {
    throw new Error('Google Client ID is not configured.');
  }

  const token = await requestGoogleAccessToken(clientId, GOOGLE_SIGNIN_SCOPE);

  const profileResponse = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
    headers: {
      Authorization: `Bearer ${token.accessToken}`,
    },
  });

  if (!profileResponse.ok) {
    throw new Error('Could not fetch Google user profile.');
  }

  const profile = (await profileResponse.json()) as GoogleUserProfile;

  if (!profile.email) {
    throw new Error('Google account email is not available.');
  }

  return {
    ...profile,
    accessToken: token.accessToken,
    expiresAt: token.expiresAt,
    scope: token.scope,
  };
};
