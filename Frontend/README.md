
# VidFlow Frontend

See the root `README.md` for complete setup instructions and the current API contract.

```bash
npm install
copy .env.example .env
npm run dev
```

The frontend uses one Axios instance, stores the access token under `accessToken`, and supports cookie authentication with credentials.

## Features

- Search and filter published videos by category or tag.
- Browse Trending videos and context-aware recommendations on the watch page.
- Upload videos with a category and up to 10 comma-separated tags.
- Manage creator uploads, likes, subscriptions, playlists, comments, and watch history.
- Use responsive discovery, playback, upload, channel, and creator views.

## Local configuration

Set `VITE_API_BASE_URL` to the full API prefix (normally `http://localhost:8000/api/v1`).
