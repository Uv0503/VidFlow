# VidFlow

A full-stack video sharing platform built with React, Node.js, Express, MongoDB, JWT authentication, Cloudinary uploads, likes, comments, playlists, subscriptions, and a modern responsive UI.

## Highlights

- Search published videos and filter them by category or tag.
- Browse an engagement-ranked Trending page and in-context video recommendations.
- Create videos with validated categories and up to 10 normalized tags.
- Use creator uploads, liked videos, watch history, subscriptions, playlists, and comments.
- Protect authentication, upload, and interaction endpoints with targeted rate limits.
- Use responsive React views for discovery, upload, playback, and creator management.

## Local setup

### Backend

```bash
cd Backend
npm install
copy .env.example .env
npm run dev
```

Set the MongoDB, JWT, Cloudinary, and CORS values in `Backend/.env`. The API defaults to `http://localhost:8000`.

### Frontend

```bash
cd Frontend
npm install
copy .env.example .env
npm run dev
```

The Vite app defaults to `http://localhost:5173`. Set `VITE_API_BASE_URL` to the complete API prefix, normally `http://localhost:8000/api/v1`. The included Vite proxy also supports `/api/v1` during local development.

## Commands

Backend:

- `npm run dev`: start with nodemon
- `npm start`: start with Node
- `npm test`: run the backend syntax check

Frontend:

- `npm run dev`: start Vite
- `npm run build`: create a production build
- `npm run preview`: preview the build

## API summary

- Users: `/api/v1/users/register`, `/login`, `/logout`, `/refresh-token`, `/current-user`, `/c/:username`
- Videos: `GET /api/v1/videos`, `GET /videos/:videoId`, `GET /videos/channel/:username`, `GET /videos/me/uploads`
- Discovery: `GET /videos/trending`, `GET /videos/:videoId/recommendations`
- Video publishing: `POST /videos/publish-video`
- Video ownership: `PATCH/DELETE /api/v1/videos/:videoId`, `PATCH /videos/:videoId/publish`
- Comments: `GET/POST /api/v1/comments/:videoId`, `PATCH/DELETE /comments/:commentId`
- Likes: `POST /api/v1/likes/videos/:videoId`, `GET /likes/videos`
- Subscriptions: `POST /api/v1/subscriptions/:channelId`
- Playlists: `/api/v1/playlists`
- Tweets: `/api/v1/tweets`

Successful responses use `{ success, statusCode, data, message }`. Errors use `{ success: false, message, errors }`.

## Assumptions

- Public users can browse published videos, channels, and comments.
- Authentication supports both HTTP-only cookies and `Authorization: Bearer <accessToken>`.
- Local cookies are non-secure with `SameSite=Lax`; production cookies are secure.
- Video uploads accept MP4, WebM, or MOV and are limited to 100 MB by the current Multer configuration.
- Video categories are validated as one of: General, Education, Technology, Gaming, Music, Entertainment, Sports, News, Howto & Style, or Travel.
- Existing databases created with the old Like schema may require the old indexes to be dropped before Mongoose creates the new partial unique indexes.
