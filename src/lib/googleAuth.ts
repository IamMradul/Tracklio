export interface GoogleUserProfile {
  email: string;
  name?: string;
  picture?: string;
}

declare global {
  interface Window {
    google?: {
      accounts?: {
        oauth2?: {
          initTokenClient: (config: {
            client_id: string;
            scope: string;
            callback: (response: { access_token?: string; error?: string }) => void;
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

export const signInWithGoogleDirect = async (clientId: string): Promise<GoogleUserProfile> => {
  if (!clientId) {
    throw new Error('Google Client ID is not configured.');
  }

  await loadGoogleScript();

  const token = await new Promise<string>((resolve, reject) => {
    const tokenClient = window.google?.accounts?.oauth2?.initTokenClient({
      client_id: clientId,
      scope: 'openid email profile',
      callback: (response) => {
        if (!response.access_token) {
          reject(new Error(response.error || 'Failed to get Google access token.'));
          return;
        }

        resolve(response.access_token);
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

  const profileResponse = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!profileResponse.ok) {
    throw new Error('Could not fetch Google user profile.');
  }

  const profile = (await profileResponse.json()) as GoogleUserProfile;

  if (!profile.email) {
    throw new Error('Google account email is not available.');
  }

  return profile;
};
