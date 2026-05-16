/**
 * googleAuth.ts — Google Identity Services (GSI) popup sign-in.
 * Requests profile and email scopes only (no Calendar).
 * Returns user profile info and access token for API calls.
 */

export interface GoogleProfile {
  email: string;
  name: string;
  picture: string;
  accessToken: string;
  expiresAt: number; // ms timestamp
  scope: string;
}

/** Dynamically loads the Google Identity Services script if not already present. */
const loadGsiScript = (): Promise<void> =>
  new Promise((resolve, reject) => {
    if (typeof window.google !== 'undefined') {
      resolve();
      return;
    }

    const existing = document.getElementById('gsi-script');
    if (existing) {
      existing.addEventListener('load', () => resolve());
      existing.addEventListener('error', () => reject(new Error('Failed to load Google Identity Services script.')));
      return;
    }

    const script = document.createElement('script');
    script.id = 'gsi-script';
    script.src = 'https://accounts.google.com/gsi/client';
    script.async = true;
    script.defer = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error('Failed to load Google Identity Services script.'));
    document.head.appendChild(script);
  });

/**
 * Initiates a Google OAuth popup to sign in and obtain a user profile + access token.
 * Only requests profile and email scopes (no Calendar access).
 *
 * @param clientId - The Google OAuth 2.0 client ID from VITE_GOOGLE_CLIENT_ID
 * @returns Resolved GoogleProfile on success
 * @throws Error if the user cancels or the sign-in fails
 */
export const signInWithGoogleDirect = (clientId: string): Promise<GoogleProfile> =>
  new Promise(async (resolve, reject) => {
    try {
      await loadGsiScript();
    } catch (err) {
      reject(err);
      return;
    }

    const SCOPES = [
      'openid',
      'https://www.googleapis.com/auth/userinfo.email',
      'https://www.googleapis.com/auth/userinfo.profile',
    ].join(' ');

    window.google.accounts.oauth2
      .initTokenClient({
        client_id: clientId,
        scope: SCOPES,
        callback: async (tokenResponse: GoogleTokenResponse) => {
          if (tokenResponse.error) {
            reject(new Error(tokenResponse.error_description ?? tokenResponse.error));
            return;
          }

          try {
            const profileRes = await fetch(
              'https://www.googleapis.com/oauth2/v3/userinfo',
              { headers: { Authorization: `Bearer ${tokenResponse.access_token}` } }
            );

            if (!profileRes.ok) {
              throw new Error(`Profile fetch failed: ${profileRes.status}`);
            }

            const profile = await profileRes.json() as {
              email?: string;
              name?: string;
              picture?: string;
            };

            resolve({
              email: profile.email ?? '',
              name: profile.name ?? '',
              picture: profile.picture ?? '',
              accessToken: tokenResponse.access_token,
              expiresAt: Date.now() + (tokenResponse.expires_in ?? 3600) * 1000,
              scope: tokenResponse.scope ?? SCOPES,
            });
          } catch (err) {
            reject(err instanceof Error ? err : new Error('Failed to fetch Google profile.'));
          }
        },
      })
      .requestAccessToken();
  });

// ── Type augmentation for the GSI global ──────────────────────────

interface GoogleTokenResponse {
  access_token: string;
  expires_in?: number;
  scope?: string;
  token_type?: string;
  error?: string;
  error_description?: string;
}

declare global {
  interface Window {
    google: {
      accounts: {
        oauth2: {
          initTokenClient(config: {
            client_id: string;
            scope: string;
            callback: (response: GoogleTokenResponse) => void;
          }): { requestAccessToken(): void };
        };
      };
    };
  }
}
