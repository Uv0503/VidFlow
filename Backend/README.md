# VidFlow Backend

Express and MongoDB API for the VidFlow application.

## Technology

- Node.js and Express
- MongoDB and Mongoose
- JWT authentication
- HTTP-only cookies and Bearer tokens
- Cloudinary media storage
- Multer file uploads

## Setup

Install dependencies:

```bash
npm install
```

Create or update `Backend/.env`:

```env
PORT=8000
MONGODB_URI=your-mongodb-connection-string
CORS_ORIGIN=http://localhost:5173
ACCESS_TOKEN_SECRET=your-access-token-secret
ACCESS_TOKEN_EXPIRY=1d
REFRESH_TOKEN_SECRET=your-refresh-token-secret
REFRESH_TOKEN_EXPIRY=10d
CLOUDINARY_CLOUD_NAME=your-cloud-name
CLOUDINARY_API_KEY=your-api-key
CLOUDINARY_API_SECRET=your-api-secret
NODE_ENV=development
```

Do not commit the real `.env` file.

## Commands

Start development mode:

```bash
npm run dev
```

Start without nodemon:

```bash
npm start
```

Run the syntax check:

```bash
npm test
```

The server runs on `http://localhost:8000` unless `PORT` specifies another port.

## API Prefix

All routes begin with:

```text
/api/v1
```

## Main Routes

### Users

- `POST /users/register`
- `POST /users/login`
- `POST /users/logout`
- `POST /users/refresh-token`
- `GET /users/current-user`
- `GET /users/c/:username`
- `GET /users/watch-history`
- `POST /users/change-current-password`
- `PATCH /users/update-account-details`
- `PATCH /users/update-user-avatar`
- `PATCH /users/update-user-coverImage`

### Videos

- `GET /videos`
- `GET /videos/trending`
- `GET /videos/:videoId`
- `GET /videos/:videoId/recommendations`
- `GET /videos/channel/:username`
- `GET /videos/me/uploads`
- `POST /videos/publish-video`
- `PATCH /videos/:videoId`
- `PATCH /videos/:videoId/publish`
- `DELETE /videos/:videoId`

Video categories are validated as one of: General, Education, Technology, Gaming, Music, Entertainment, Sports, News, Howto & Style, or Travel.

## Video discovery and metadata

- `GET /videos` accepts `page`, `limit`, `sortBy`, `sortType`, `query`, `category`, `tag`, and `userId` query parameters.
- Tags are trimmed, normalized to lowercase, deduplicated, and limited to 10 per video.

### Discovery scoring

- Trending score: `views + (likes * 3) + (comments * 2) + 20` when the video was published within the last 7 days. Ties use newest-first ordering.
- Recommendation score: `(same category * 4) + (matching tags * 3) + (same owner * 2) + (likes * 2) + (views * 0.5)`.
- Recommendations first consider videos sharing a category, tag, or owner; when there are not enough matches, remaining slots fall back to popular published videos sorted by views, likes, then newest-first.

### Comments

- `GET /comments/:videoId`
- `POST /comments/:videoId`
- `PATCH /comments/:commentId`
- `DELETE /comments/:commentId`

### Likes

- `POST /likes/videos/:videoId`
- `POST /likes/comments/:commentId`
- `POST /likes/tweets/:tweetId`
- `GET /likes/videos`

### Subscriptions

- `POST /subscriptions/:channelId`
- `GET /subscriptions/me/feed`
- `GET /subscriptions/:channelId/subscribers`
- `GET /subscriptions/user/:userId/channels`

### Playlists

- `POST /playlists`
- `GET /playlists/user/:userId`
- `GET /playlists/:playlistId`
- `POST /playlists/:playlistId/videos/:videoId`
- `DELETE /playlists/:playlistId/videos/:videoId`
- `PATCH /playlists/:playlistId`
- `DELETE /playlists/:playlistId`

### Tweets

- `GET /tweets`
- `POST /tweets`
- `PATCH /tweets/:tweetId`
- `DELETE /tweets/:tweetId`

## Authentication

Protected routes accept an access token from either:

- The HTTP-only `accessToken` cookie
- `Authorization: Bearer <accessToken>`

Refresh tokens are stored in an HTTP-only cookie and in the user record so they can be invalidated during logout.

## Uploads

- Avatar and thumbnail uploads accept supported image formats.
- Videos accept MP4, WebM, and MOV.
- The current maximum file size is 100 MB.
- Small videos use a normal Cloudinary upload.
- Videos larger than 20 MB use chunked Cloudinary uploads.
- Temporary local files are removed after Cloudinary processing.

## Current Behavior

- Public users can browse published videos, channels, and comments.
- Mutations require authentication.
- Video, comment, playlist, and tweet changes enforce ownership.
- A video receives at most one view from each authenticated user.
- Anonymous requests do not increment views.
- Users cannot subscribe to themselves.
- Subscription pairs and likes are protected by unique indexes.
- Deleting a video also removes related comments, likes, playlist references, and watch-history references.

## Rate limiting

- Authentication routes (registration, login, and refresh token): 5 requests per IP per 15 minutes.
- Video publishing: 10 requests per authenticated user (or IP when unauthenticated) per hour.
- Like, comment mutation, and subscription mutation routes: 60 requests per IP per minute.
- Rate-limited responses use status `429` and standard rate-limit response headers.

## Responses

Successful response:

```json
{
  "statusCode": 200,
  "data": {},
  "message": "Success",
  "success": true
}
```

Error response:

```json
{
  "success": false,
  "message": "Error message",
  "errors": []
}
```
