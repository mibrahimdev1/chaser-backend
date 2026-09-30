# Group Invitation API Documentation

## Request and Response Bodies

### 1. Send Invitation to Group

**Endpoint:** `POST /groups/:groupId/invite/:userId`

**Request:**
- **URL Parameters:**
  - `groupId` (string, required): MongoDB ObjectId of the group
  - `userId` (string, required): MongoDB ObjectId of the user to invite
- **Headers:**
  - `Authorization: Bearer <token>` (required)
- **Request Body:** None

**Response:**
```json
{
  "invitation": {
    "id": "60d0fe4f5311236168a109ca",
    "group": {
      "id": "60d0fe4f5311236168a109cb",
      "name": "Developers Group",
      "description": "A group for developers to share knowledge",
      "profilePicture": "https://example.com/group.jpg"
    },
    "inviter": {
      "id": "60d0fe4f5311236168a109cc",
      "firstName": "John",
      "lastName": "Doe",
      "displayName": "John Doe",
      "email": "john@example.com",
      "profilePicture": "https://example.com/john.jpg"
    },
    "invitee": {
      "id": "60d0fe4f5311236168a109cd",
      "firstName": "Jane",
      "lastName": "Smith",
      "displayName": "Jane Smith",
      "email": "jane@example.com",
      "profilePicture": "https://example.com/jane.jpg"
    },
    "status": "pending",
    "createdAt": "2023-07-01T12:00:00.000Z",
    "updatedAt": "2023-07-01T12:00:00.000Z"
  }
}
```

**Status Codes:**
- `201 Created` - Invitation sent successfully
- `400 Bad Request` - User already member, invitation already pending, etc.
- `401 Unauthorized` - Missing or invalid token
- `403 Forbidden` - No permission to invite (not a member/admin or members can't invite)
- `404 Not Found` - Group or user not found

---

### 2. Accept Invitation

**Endpoint:** `POST /invitations/:invitationId/accept`

**Request:**
- **URL Parameters:**
  - `invitationId` (string, required): MongoDB ObjectId of the invitation
- **Headers:**
  - `Authorization: Bearer <token>` (required)
- **Request Body:** None

**Response:**
```json
{
  "invitation": {
    "id": "60d0fe4f5311236168a109ca",
    "group": {
      "id": "60d0fe4f5311236168a109cb",
      "name": "Developers Group",
      "description": "A group for developers to share knowledge",
      "profilePicture": "https://example.com/group.jpg",
      "coverPicture": "https://example.com/cover.jpg",
      "groupType": "public"
    },
    "inviter": {
      "id": "60d0fe4f5311236168a109cc",
      "firstName": "John",
      "lastName": "Doe",
      "displayName": "John Doe",
      "email": "john@example.com",
      "profilePicture": "https://example.com/john.jpg"
    },
    "invitee": {
      "id": "60d0fe4f5311236168a109cd",
      "firstName": "Jane",
      "lastName": "Smith",
      "displayName": "Jane Smith",
      "email": "jane@example.com",
      "profilePicture": "https://example.com/jane.jpg"
    },
    "status": "accepted",
    "createdAt": "2023-07-01T12:00:00.000Z",
    "updatedAt": "2023-07-01T12:05:00.000Z"
  }
}
```

**Status Codes:**
- `200 OK` - Invitation accepted successfully, user added to group
- `400 Bad Request` - Invitation already processed, user already member
- `401 Unauthorized` - Missing or invalid token
- `403 Forbidden` - Not your invitation
- `404 Not Found` - Invitation not found

---

### 3. Reject Invitation

**Endpoint:** `POST /invitations/:invitationId/reject`

**Request:**
- **URL Parameters:**
  - `invitationId` (string, required): MongoDB ObjectId of the invitation
- **Headers:**
  - `Authorization: Bearer <token>` (required)
- **Request Body:** None

**Response:**
```json
{
  "invitation": {
    "id": "60d0fe4f5311236168a109ca",
    "group": {
      "id": "60d0fe4f5311236168a109cb",
      "name": "Developers Group",
      "description": "A group for developers to share knowledge"
    },
    "inviter": {
      "id": "60d0fe4f5311236168a109cc",
      "firstName": "John",
      "lastName": "Doe",
      "displayName": "John Doe",
      "email": "john@example.com",
      "profilePicture": "https://example.com/john.jpg"
    },
    "invitee": {
      "id": "60d0fe4f5311236168a109cd",
      "firstName": "Jane",
      "lastName": "Smith",
      "displayName": "Jane Smith",
      "email": "jane@example.com",
      "profilePicture": "https://example.com/jane.jpg"
    },
    "status": "rejected",
    "createdAt": "2023-07-01T12:00:00.000Z",
    "updatedAt": "2023-07-01T12:05:00.000Z"
  }
}
```

**Status Codes:**
- `200 OK` - Invitation rejected successfully
- `400 Bad Request` - Invitation already processed
- `401 Unauthorized` - Missing or invalid token
- `403 Forbidden` - Not your invitation
- `404 Not Found` - Invitation not found

---

### 4. Cancel Invitation (by Inviter)

**Endpoint:** `DELETE /invitations/:invitationId`

**Request:**
- **URL Parameters:**
  - `invitationId` (string, required): MongoDB ObjectId of the invitation
- **Headers:**
  - `Authorization: Bearer <token>` (required)
- **Request Body:** None

**Response:**
```json
{
  "invitation": {
    "id": "60d0fe4f5311236168a109ca",
    "group": {
      "id": "60d0fe4f5311236168a109cb",
      "name": "Developers Group",
      "description": "A group for developers to share knowledge"
    },
    "inviter": {
      "id": "60d0fe4f5311236168a109cc",
      "firstName": "John",
      "lastName": "Doe",
      "displayName": "John Doe",
      "email": "john@example.com",
      "profilePicture": "https://example.com/john.jpg"
    },
    "invitee": {
      "id": "60d0fe4f5311236168a109cd",
      "firstName": "Jane",
      "lastName": "Smith",
      "displayName": "Jane Smith",
      "email": "jane@example.com",
      "profilePicture": "https://example.com/jane.jpg"
    },
    "status": "cancelled",
    "createdAt": "2023-07-01T12:00:00.000Z",
    "updatedAt": "2023-07-01T12:05:00.000Z"
  }
}
```

**Status Codes:**
- `200 OK` - Invitation cancelled successfully
- `400 Bad Request` - Invitation already processed
- `401 Unauthorized` - Missing or invalid token
- `403 Forbidden` - Not your invitation (you didn't send it)
- `404 Not Found` - Invitation not found

---

### 5. Get Current User's Invitations

**Endpoint:** `GET /invitations/me`

**Request:**
- **Query Parameters:**
  - `page` (number, optional): Page number (default: 1)
  - `limit` (number, optional): Items per page (default: 10)
  - `status` (string, optional): Filter by status - `pending`, `accepted`, `rejected`, or `cancelled`
- **Headers:**
  - `Authorization: Bearer <token>` (required)
- **Request Body:** None

**Example Request:**
```
GET /invitations/me?page=1&limit=10&status=pending
```

**Response:**
```json
{
  "results": [
    {
      "id": "60d0fe4f5311236168a109ca",
      "group": {
        "id": "60d0fe4f5311236168a109cb",
        "name": "Developers Group",
        "description": "A group for developers to share knowledge",
        "profilePicture": "https://example.com/group.jpg"
      },
      "inviter": {
        "id": "60d0fe4f5311236168a109cc",
        "firstName": "John",
        "lastName": "Doe",
        "displayName": "John Doe",
        "email": "john@example.com",
        "profilePicture": "https://example.com/john.jpg"
      },
      "invitee": {
        "id": "60d0fe4f5311236168a109cd",
        "firstName": "Jane",
        "lastName": "Smith",
        "displayName": "Jane Smith",
        "email": "jane@example.com",
        "profilePicture": "https://example.com/jane.jpg"
      },
      "status": "pending",
      "createdAt": "2023-07-01T12:00:00.000Z",
      "updatedAt": "2023-07-01T12:00:00.000Z"
    }
  ],
  "page": 1,
  "limit": 10,
  "totalPages": 3,
  "totalResults": 25
}
```

**Status Codes:**
- `200 OK` - Invitations retrieved successfully
- `401 Unauthorized` - Missing or invalid token

---

### 6. Get Group Invitations (Admin Only)

**Endpoint:** `GET /groups/:groupId/invitations`

**Request:**
- **URL Parameters:**
  - `groupId` (string, required): MongoDB ObjectId of the group
- **Query Parameters:**
  - `page` (number, optional): Page number (default: 1)
  - `limit` (number, optional): Items per page (default: 10)
  - `status` (string, optional): Filter by status - `pending`, `accepted`, `rejected`, or `cancelled`
- **Headers:**
  - `Authorization: Bearer <token>` (required)
- **Request Body:** None

**Example Request:**
```
GET /groups/60d0fe4f5311236168a109cb/invitations?page=1&limit=10&status=pending
```

**Response:**
```json
{
  "results": [
    {
      "id": "60d0fe4f5311236168a109ca",
      "group": "60d0fe4f5311236168a109cb",
      "inviter": {
        "id": "60d0fe4f5311236168a109cc",
        "firstName": "John",
        "lastName": "Doe",
        "displayName": "John Doe",
        "email": "john@example.com",
        "profilePicture": "https://example.com/john.jpg"
      },
      "invitee": {
        "id": "60d0fe4f5311236168a109cd",
        "firstName": "Jane",
        "lastName": "Smith",
        "displayName": "Jane Smith",
        "email": "jane@example.com",
        "profilePicture": "https://example.com/jane.jpg"
      },
      "status": "pending",
      "createdAt": "2023-07-01T12:00:00.000Z",
      "updatedAt": "2023-07-01T12:00:00.000Z"
    }
  ],
  "page": 1,
  "limit": 10,
  "totalPages": 2,
  "totalResults": 15
}
```

**Status Codes:**
- `200 OK` - Invitations retrieved successfully
- `401 Unauthorized` - Missing or invalid token
- `403 Forbidden` - Not an admin of the group
- `404 Not Found` - Group not found

---

### 7. Get Single Invitation by ID

**Endpoint:** `GET /invitations/:invitationId`

**Request:**
- **URL Parameters:**
  - `invitationId` (string, required): MongoDB ObjectId of the invitation
- **Headers:**
  - `Authorization: Bearer <token>` (required)
- **Request Body:** None

**Response:**
```json
{
  "invitation": {
    "id": "60d0fe4f5311236168a109ca",
    "group": {
      "id": "60d0fe4f5311236168a109cb",
      "name": "Developers Group",
      "description": "A group for developers to share knowledge",
      "profilePicture": "https://example.com/group.jpg",
      "coverPicture": "https://example.com/cover.jpg",
      "groupType": "public"
    },
    "inviter": {
      "id": "60d0fe4f5311236168a109cc",
      "firstName": "John",
      "lastName": "Doe",
      "displayName": "John Doe",
      "email": "john@example.com",
      "profilePicture": "https://example.com/john.jpg"
    },
    "invitee": {
      "id": "60d0fe4f5311236168a109cd",
      "firstName": "Jane",
      "lastName": "Smith",
      "displayName": "Jane Smith",
      "email": "jane@example.com",
      "profilePicture": "https://example.com/jane.jpg"
    },
    "status": "pending",
    "createdAt": "2023-07-01T12:00:00.000Z",
    "updatedAt": "2023-07-01T12:00:00.000Z"
  }
}
```

**Status Codes:**
- `200 OK` - Invitation retrieved successfully
- `401 Unauthorized` - Missing or invalid token
- `404 Not Found` - Invitation not found

---

## Updated Endpoint: Add Member to Group (Now Creates Invitation)

**Endpoint:** `POST /groups/:groupId/members/:userId`

**Note:** This endpoint has been updated to create an invitation instead of directly adding a member.

**Request:**
- **URL Parameters:**
  - `groupId` (string, required): MongoDB ObjectId of the group
  - `userId` (string, required): MongoDB ObjectId of the user to invite
- **Headers:**
  - `Authorization: Bearer <token>` (required)
- **Request Body:** None

**Response:**
```json
{
  "invitation": {
    "id": "60d0fe4f5311236168a109ca",
    "group": {
      "id": "60d0fe4f5311236168a109cb",
      "name": "Developers Group",
      "description": "A group for developers to share knowledge",
      "profilePicture": "https://example.com/group.jpg"
    },
    "inviter": {
      "id": "60d0fe4f5311236168a109cc",
      "firstName": "John",
      "lastName": "Doe",
      "displayName": "John Doe",
      "email": "john@example.com",
      "profilePicture": "https://example.com/john.jpg"
    },
    "invitee": {
      "id": "60d0fe4f5311236168a109cd",
      "firstName": "Jane",
      "lastName": "Smith",
      "displayName": "Jane Smith",
      "email": "jane@example.com",
      "profilePicture": "https://example.com/jane.jpg"
    },
    "status": "pending",
    "createdAt": "2023-07-01T12:00:00.000Z",
    "updatedAt": "2023-07-01T12:00:00.000Z"
  }
}
```

**Status Codes:**
- `200 OK` - Invitation created successfully (backward compatible response)
- `400 Bad Request` - User already member, invitation already pending, etc.
- `401 Unauthorized` - Missing or invalid token
- `403 Forbidden` - No permission to invite
- `404 Not Found` - Group or user not found

---

## Error Response Format

All error responses follow this format:

```json
{
  "code": 400,
  "message": "User is already a member of the group"
}
```

Or for validation errors:

```json
{
  "code": 400,
  "message": "Validation error",
  "errors": [
    {
      "field": "groupId",
      "message": "\"groupId\" must be a valid Object ID"
    }
  ]
}
```

---

## Notification Actions

When invitations are sent, accepted, or rejected, notifications are automatically sent:

- **GROUP_INVITE**: Sent to the invitee when an invitation is created
- **GROUP_INVITE_ACCEPTED**: Sent to the inviter when an invitation is accepted
- **GROUP_INVITE_REJECTED**: Sent to the inviter when an invitation is rejected

