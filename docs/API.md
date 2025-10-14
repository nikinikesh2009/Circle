# Circle PWA - API Documentation

## Base URL
```
Development: http://localhost:5000/api
Production: https://your-domain.replit.app/api
```

## Authentication
All API requests require authentication via session cookies, except for signup and login endpoints.

---

## 🔐 Authentication Endpoints

### POST /api/auth/signup
Create a new user account.

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "securepassword123",
  "name": "John Doe",
  "username": "johndoe"
}
```

**Response (200 OK):**
```json
{
  "id": "1",
  "email": "user@example.com",
  "name": "John Doe",
  "username": "johndoe",
  "avatar": null,
  "bio": null,
  "targets": [],
  "status": "online",
  "createdAt": "2025-10-14T12:00:00.000Z"
}
```

**Errors:**
- `400` - Missing required fields
- `409` - Email or username already exists

---

### POST /api/auth/login
Login to existing account.

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "securepassword123"
}
```

**Response (200 OK):**
```json
{
  "id": "1",
  "email": "user@example.com",
  "name": "John Doe",
  "username": "johndoe",
  "avatar": null,
  "bio": null,
  "targets": [],
  "status": "online",
  "createdAt": "2025-10-14T12:00:00.000Z"
}
```

**Errors:**
- `401` - Invalid email or password

---

### POST /api/auth/logout
Logout current user.

**Response (200 OK):**
```json
{
  "message": "Logged out successfully"
}
```

---

### GET /api/auth/me
Get current authenticated user.

**Response (200 OK):**
```json
{
  "id": "1",
  "email": "user@example.com",
  "name": "John Doe",
  "username": "johndoe",
  "avatar": null,
  "bio": "Software developer",
  "targets": ["Learn TypeScript", "Build PWA"],
  "status": "online",
  "createdAt": "2025-10-14T12:00:00.000Z"
}
```

**Errors:**
- `401` - Not authenticated

---

## 👥 User Endpoints

### GET /api/users/:id
Get user profile by ID.

**Response (200 OK):**
```json
{
  "id": "2",
  "name": "Jane Smith",
  "username": "janesmith",
  "avatar": "https://example.com/avatar.jpg",
  "bio": "Designer and developer",
  "targets": ["UI/UX Design", "React Native"],
  "status": "online",
  "createdAt": "2025-10-13T10:00:00.000Z"
}
```

**Errors:**
- `401` - Not authenticated
- `404` - User not found

---

### PATCH /api/user/profile
Update current user's profile.

**Request Body:**
```json
{
  "name": "John Updated",
  "bio": "Full-stack developer",
  "targets": ["TypeScript", "Node.js", "React"]
}
```

**Response (200 OK):**
```json
{
  "id": "1",
  "email": "user@example.com",
  "name": "John Updated",
  "username": "johndoe",
  "bio": "Full-stack developer",
  "targets": ["TypeScript", "Node.js", "React"],
  "status": "online"
}
```

**Errors:**
- `401` - Not authenticated
- `400` - Invalid input data

---

## ⭕ Circle Endpoints

### GET /api/circles
Get all circles (both official and user-created).

**Response (200 OK):**
```json
[
  {
    "id": "1",
    "name": "AI & Tech",
    "description": "Discuss AI and technology",
    "coverImage": "/images/ai-tech.jpg",
    "category": "Technology",
    "isPrivate": false,
    "isOfficial": true,
    "createdBy": "admin",
    "memberCount": 150,
    "createdAt": "2025-10-01T00:00:00.000Z"
  }
]
```

---

### GET /api/circles/official
Get official circles only.

**Response (200 OK):**
```json
[
  {
    "id": "1",
    "name": "AI & Tech",
    "description": "Discuss AI and technology",
    "isOfficial": true,
    "memberCount": 150
  }
]
```

---

### GET /api/circles/explore
Get user-created circles that current user hasn't joined.

**Response (200 OK):**
```json
[
  {
    "id": "10",
    "name": "Coffee Lovers",
    "description": "All about coffee",
    "isOfficial": false,
    "memberCount": 25,
    "createdBy": "user123"
  }
]
```

**Errors:**
- `401` - Not authenticated

---

### GET /api/circles/my
Get circles current user is a member of.

**Response (200 OK):**
```json
[
  {
    "id": "1",
    "name": "AI & Tech",
    "role": "member",
    "joinedAt": "2025-10-10T12:00:00.000Z"
  }
]
```

**Errors:**
- `401` - Not authenticated

---

### POST /api/circles
Create a new circle.

**Request Body:**
```json
{
  "name": "Book Club",
  "description": "Monthly book discussions",
  "category": "Hobbies",
  "isPrivate": false
}
```

**Response (201 Created):**
```json
{
  "id": "15",
  "name": "Book Club",
  "description": "Monthly book discussions",
  "category": "Hobbies",
  "isPrivate": false,
  "isOfficial": false,
  "createdBy": "1",
  "memberCount": 1
}
```

**Errors:**
- `401` - Not authenticated
- `400` - Invalid input data

---

### POST /api/circles/:id/join
Join a circle.

**Response (200 OK):**
```json
{
  "message": "Joined circle successfully"
}
```

**Errors:**
- `401` - Not authenticated
- `404` - Circle not found
- `409` - Already a member

---

### POST /api/circles/:id/leave
Leave a circle.

**Response (200 OK):**
```json
{
  "message": "Left circle successfully"
}
```

**Errors:**
- `401` - Not authenticated
- `404` - Circle not found
- `400` - Not a member

---

## 💬 Message Endpoints

### GET /api/circles/:id/messages
Get messages from a circle.

**Query Parameters:**
- `limit` (optional): Number of messages (default: 50)
- `before` (optional): Get messages before this timestamp

**Response (200 OK):**
```json
[
  {
    "id": "100",
    "content": "Hello everyone!",
    "userId": "1",
    "userName": "John Doe",
    "userAvatar": null,
    "isEdited": false,
    "isDeleted": false,
    "createdAt": "2025-10-14T12:00:00.000Z"
  }
]
```

**Errors:**
- `401` - Not authenticated
- `403` - Not a member of this circle

---

### PATCH /api/messages/:id
Edit a message.

**Request Body:**
```json
{
  "content": "Updated message content"
}
```

**Response (200 OK):**
```json
{
  "id": "100",
  "content": "Updated message content",
  "isEdited": true
}
```

**Errors:**
- `401` - Not authenticated
- `403` - Not the message owner
- `404` - Message not found

---

### DELETE /api/messages/:id
Delete a message (soft delete).

**Response (200 OK):**
```json
{
  "message": "Message deleted successfully"
}
```

**Errors:**
- `401` - Not authenticated
- `403` - Not the message owner
- `404` - Message not found

---

### GET /api/messages/:id/reactions
Get reactions for a message.

**Response (200 OK):**
```json
[
  {
    "emoji": "👍",
    "count": 5,
    "userReacted": true
  },
  {
    "emoji": "❤️",
    "count": 3,
    "userReacted": false
  }
]
```

---

### POST /api/messages/:id/reactions
Add a reaction to a message.

**Request Body:**
```json
{
  "emoji": "👍"
}
```

**Response (200 OK):**
```json
{
  "message": "Reaction added successfully"
}
```

**Errors:**
- `401` - Not authenticated
- `409` - Already reacted with this emoji

---

### DELETE /api/messages/:id/reactions/:emoji
Remove a reaction from a message.

**Response (200 OK):**
```json
{
  "message": "Reaction removed successfully"
}
```

**Errors:**
- `401` - Not authenticated
- `404` - Reaction not found

---

## 💌 Direct Message Endpoints

### POST /api/dm/conversations
Create or get conversation with another user.

**Request Body:**
```json
{
  "otherUserId": "2"
}
```

**Response (200 OK):**
```json
{
  "id": "conv-1",
  "otherUser": {
    "id": "2",
    "name": "Jane Smith",
    "username": "janesmith",
    "avatar": null
  },
  "createdAt": "2025-10-14T12:00:00.000Z"
}
```

**Errors:**
- `401` - Not authenticated
- `400` - Cannot message yourself
- `404` - Other user not found

---

### GET /api/dm/conversations
Get all conversations for current user.

**Response (200 OK):**
```json
[
  {
    "id": "conv-1",
    "otherUser": {
      "id": "2",
      "name": "Jane Smith",
      "username": "janesmith",
      "avatar": null
    },
    "lastMessage": "Hey, how are you?",
    "lastMessageAt": "2025-10-14T12:30:00.000Z"
  }
]
```

**Errors:**
- `401` - Not authenticated

---

### POST /api/dm/conversations/:id/messages
Send a direct message.

**Request Body:**
```json
{
  "content": "Hello! How are you doing?"
}
```

**Response (201 Created):**
```json
{
  "id": "dm-msg-1",
  "conversationId": "conv-1",
  "senderId": "1",
  "content": "Hello! How are you doing?",
  "createdAt": "2025-10-14T12:35:00.000Z"
}
```

**Errors:**
- `401` - Not authenticated
- `403` - Not a participant in this conversation

---

### GET /api/dm/conversations/:id/messages
Get messages from a conversation.

**Query Parameters:**
- `limit` (optional): Number of messages (default: 50)

**Response (200 OK):**
```json
[
  {
    "id": "dm-msg-1",
    "conversationId": "conv-1",
    "senderId": "1",
    "senderName": "John Doe",
    "content": "Hello! How are you doing?",
    "createdAt": "2025-10-14T12:35:00.000Z"
  }
]
```

**Errors:**
- `401` - Not authenticated
- `403` - Not a participant in this conversation

---

## 🔔 Notification Endpoints

### GET /api/notifications
Get all notifications for current user.

**Response (200 OK):**
```json
[
  {
    "id": "notif-1",
    "userId": "1",
    "type": "mention",
    "title": "New mention",
    "message": "John Doe mentioned you in AI & Tech",
    "link": "/chat/1",
    "read": false,
    "createdAt": "2025-10-14T12:00:00.000Z"
  }
]
```

**Errors:**
- `401` - Not authenticated

---

### GET /api/notifications/unread/count
Get count of unread notifications.

**Response (200 OK):**
```json
{
  "count": 5
}
```

---

### PATCH /api/notifications/:id/read
Mark notification as read.

**Response (200 OK):**
```json
{
  "message": "Notification marked as read"
}
```

**Errors:**
- `401` - Not authenticated
- `404` - Notification not found

---

### POST /api/notifications/read-all
Mark all notifications as read.

**Response (200 OK):**
```json
{
  "message": "All notifications marked as read"
}
```

**Errors:**
- `401` - Not authenticated

---

## 🔌 WebSocket Events

### Connection
```javascript
const ws = new WebSocket('ws://localhost:5000');
```

### Client → Server Events

#### Join Circle
```json
{
  "type": "join_circle",
  "circleId": "1"
}
```

#### Leave Circle
```json
{
  "type": "leave_circle",
  "circleId": "1"
}
```

#### Send Message
```json
{
  "type": "message",
  "circleId": "1",
  "content": "Hello everyone!"
}
```

#### Join DM Conversation
```json
{
  "type": "join_dm",
  "conversationId": "conv-1"
}
```

#### Send DM
```json
{
  "type": "dm",
  "conversationId": "conv-1",
  "content": "Hey there!"
}
```

### Server → Client Events

#### New Message
```json
{
  "type": "message",
  "circleId": "1",
  "message": {
    "id": "100",
    "content": "Hello everyone!",
    "userId": "2",
    "userName": "Jane Smith",
    "userAvatar": null,
    "createdAt": "2025-10-14T12:00:00.000Z"
  }
}
```

#### Message Edited
```json
{
  "type": "message_edited",
  "circleId": "1",
  "messageId": "100",
  "content": "Updated message",
  "isEdited": true
}
```

#### Message Deleted
```json
{
  "type": "message_deleted",
  "circleId": "1",
  "messageId": "100"
}
```

#### Reaction Added
```json
{
  "type": "reaction_added",
  "circleId": "1",
  "messageId": "100",
  "emoji": "👍",
  "userId": "2"
}
```

#### New Notification
```json
{
  "type": "notification",
  "notification": {
    "id": "notif-1",
    "type": "mention",
    "title": "New mention",
    "message": "Someone mentioned you",
    "link": "/chat/1",
    "read": false
  }
}
```

#### New DM
```json
{
  "type": "dm",
  "conversationId": "conv-1",
  "message": {
    "id": "dm-msg-1",
    "senderId": "2",
    "senderName": "Jane Smith",
    "content": "Hey there!",
    "createdAt": "2025-10-14T12:00:00.000Z"
  }
}
```

---

## Error Response Format

All errors follow this format:

```json
{
  "error": "Error message description"
}
```

**Common Status Codes:**
- `200` - Success
- `201` - Created
- `400` - Bad Request (invalid input)
- `401` - Unauthorized (not authenticated)
- `403` - Forbidden (authenticated but no permission)
- `404` - Not Found
- `409` - Conflict (duplicate/already exists)
- `500` - Internal Server Error

---

## Rate Limiting

Currently no rate limiting is implemented. Consider adding rate limiting for production:
- Authentication endpoints: 5 requests per minute
- Message endpoints: 30 requests per minute
- Other endpoints: 60 requests per minute
