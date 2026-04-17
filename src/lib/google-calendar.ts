type GoogleTokenResponse = {
  access_token: string;
  expires_in: number;
  refresh_token?: string;
  scope?: string;
  token_type: string;
};

type GoogleEvent = {
  id: string;
  status?: string;
  htmlLink?: string;
  summary?: string;
  description?: string;
  location?: string;
  start?: { dateTime?: string; date?: string; timeZone?: string };
  end?: { dateTime?: string; date?: string; timeZone?: string };
  attendees?: Array<{ email?: string; displayName?: string; responseStatus?: string }>;
  hangoutLink?: string;
  conferenceData?: {
    entryPoints?: Array<{ entryPointType?: string; uri?: string }>;
  };
  creator?: { email?: string; displayName?: string };
  organizer?: { email?: string; displayName?: string };
};

const GOOGLE_TOKEN_ENDPOINT = 'https://oauth2.googleapis.com/token';
const GOOGLE_CALENDAR_EVENTS_ENDPOINT = 'https://www.googleapis.com/calendar/v3/calendars/primary/events';
const GOOGLE_OAUTH_SCOPE = 'https://www.googleapis.com/auth/calendar.events';

function requireEnv(name: string) {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing env var: ${name}`);
  }
  return value;
}

export function getGoogleRedirectOrigin(fallbackOrigin: string) {
  return process.env.GOOGLE_CALENDAR_REDIRECT_ORIGIN || fallbackOrigin;
}

export function getGoogleRedirectUri(origin: string) {
  return new URL('/api/google/oauth/callback', getGoogleRedirectOrigin(origin)).toString();
}

export function getGoogleAuthUrl(origin: string, state: string) {
  const clientId = requireEnv('GOOGLE_CALENDAR_CLIENT_ID');
  const redirectUri = getGoogleRedirectUri(origin);

  const url = new URL('https://accounts.google.com/o/oauth2/v2/auth');
  url.searchParams.set('client_id', clientId);
  url.searchParams.set('redirect_uri', redirectUri);
  url.searchParams.set('response_type', 'code');
  url.searchParams.set('scope', GOOGLE_OAUTH_SCOPE);
  url.searchParams.set('access_type', 'offline');
  url.searchParams.set('prompt', 'consent');
  url.searchParams.set('state', state);

  return url.toString();
}

export async function exchangeCodeForTokens(code: string, origin: string) {
  const client_id = requireEnv('GOOGLE_CALENDAR_CLIENT_ID');
  const client_secret = requireEnv('GOOGLE_CALENDAR_CLIENT_SECRET');
  const redirect_uri = getGoogleRedirectUri(origin);

  const response = await fetch(GOOGLE_TOKEN_ENDPOINT, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({
      code,
      client_id,
      client_secret,
      redirect_uri,
      grant_type: 'authorization_code',
    }),
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Google token exchange failed: ${text}`);
  }

  return (await response.json()) as GoogleTokenResponse;
}

export async function refreshAccessToken(refreshToken: string) {
  const client_id = requireEnv('GOOGLE_CALENDAR_CLIENT_ID');
  const client_secret = requireEnv('GOOGLE_CALENDAR_CLIENT_SECRET');

  const response = await fetch(GOOGLE_TOKEN_ENDPOINT, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({
      refresh_token: refreshToken,
      client_id,
      client_secret,
      grant_type: 'refresh_token',
    }),
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Google refresh token failed: ${text}`);
  }

  return (await response.json()) as Pick<GoogleTokenResponse, 'access_token' | 'expires_in' | 'scope' | 'token_type'>;
}

export async function listPrimaryCalendarEvents(accessToken: string, timeMin: string) {
  const url = new URL(GOOGLE_CALENDAR_EVENTS_ENDPOINT);
  url.searchParams.set('singleEvents', 'true');
  url.searchParams.set('orderBy', 'startTime');
  url.searchParams.set('timeMin', timeMin);
  url.searchParams.set('maxResults', '50');
  url.searchParams.set('showDeleted', 'false');

  const response = await fetch(url.toString(), {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Google Calendar list events failed: ${text}`);
  }

  const data = await response.json() as { items?: GoogleEvent[] };
  return data.items || [];
}

export async function deleteCalendarEvent(accessToken: string, eventId: string) {
  const response = await fetch(`${GOOGLE_CALENDAR_EVENTS_ENDPOINT}/${encodeURIComponent(eventId)}`, {
    method: 'DELETE',
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (!response.ok && response.status !== 204) {
    const text = await response.text();
    throw new Error(`Google Calendar delete failed: ${text}`);
  }
}

export function extractMeetLink(event: GoogleEvent) {
  return (
    event.hangoutLink ||
    event.conferenceData?.entryPoints?.find((entry) => entry.uri)?.uri ||
    ''
  );
}

export function extractEventTiming(event: GoogleEvent) {
  const start = event.start?.dateTime || event.start?.date || '';
  const end = event.end?.dateTime || event.end?.date || '';
  return { start, end, timeZone: event.start?.timeZone || event.end?.timeZone || 'Europe/Vienna' };
}

export type { GoogleEvent, GoogleTokenResponse };
