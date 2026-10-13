import { createServerFn } from "@tanstack/react-start";

export type Track = {
  title: string;
  artist: string;
  album: string;
  art: string;
  url: string;
  playing: boolean;
  // only known while playing
  progressMs?: number;
  durationMs: number;
};

// a refresh token for your own account lives in env, so visitors never touch Spotify auth.
// needs the user-read-currently-playing and user-read-recently-played scopes
async function accessToken() {
  const id = process.env.SPOTIFY_CLIENT_ID;
  const secret = process.env.SPOTIFY_CLIENT_SECRET;
  const refresh = process.env.SPOTIFY_REFRESH_TOKEN;
  if (!id || !secret || !refresh) return null;

  const res = await fetch("https://accounts.spotify.com/api/token", {
    method: "POST",
    headers: {
      Authorization: `Basic ${Buffer.from(`${id}:${secret}`).toString("base64")}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({
      grant_type: "refresh_token",
      refresh_token: refresh,
    }),
  });
  if (!res.ok) return null;
  return ((await res.json()) as { access_token: string }).access_token;
}

// biome-ignore lint/suspicious/noExplicitAny: spotify's track object
function toTrack(item: any, playing: boolean, progressMs?: number): Track {
  return {
    title: item.name,
    artist: item.artists.map((a: { name: string }) => a.name).join(", "),
    album: item.album.name,
    // largest first, the notch shows it big
    art: item.album.images[0]?.url ?? "",
    url: item.external_urls.spotify,
    playing,
    progressMs,
    durationMs: item.duration_ms,
  };
}

// what's playing now, else the last thing played, else null
export const getTrack = createServerFn({ method: "GET" }).handler(
  async (): Promise<Track | null> => {
    const token = await accessToken();
    if (!token) return null;
    const headers = { Authorization: `Bearer ${token}` };

    const now = await fetch(
      "https://api.spotify.com/v1/me/player/currently-playing",
      { headers },
    );
    // 204 means nothing is playing
    if (now.status === 200) {
      const data = await now.json();
      if (data.item?.type === "track") {
        return toTrack(data.item, data.is_playing, data.progress_ms);
      }
    }

    const recent = await fetch(
      "https://api.spotify.com/v1/me/player/recently-played?limit=1",
      { headers },
    );
    if (!recent.ok) return null;
    const item = (await recent.json()).items?.[0]?.track;
    return item ? toTrack(item, false) : null;
  },
);
