# Admin Priority Sorting for Verification Review

## Overview

When admins fetch the users list, users with **`verificationStatus: 'on_review'`** are automatically shown at the top of the list for easy review.

## How It Works

### Default Sorting Priority

1. **`on_review`** - Users with uploaded documents awaiting review (🔝 TOP)
2. **`unverified`** - Users without documents
3. **`verified`** - Already verified users

Within each group, users are sorted by creation date (newest first).

## API Usage

### Get All Users (Default Priority)

```bash
GET /v1/users
```

**Response:**
```json
{
  "results": [
    {
      "id": "...",
      "email": "user1@example.com",
      "verificationStatus": "on_review",  // 🔝 These appear first
      "isEmailVerified": false,
      "driverLicense": "https://...",
      "createdAt": "2025-10-27"
    },
    {
      "id": "...",
      "email": "user2@example.com",
      "verificationStatus": "on_review",  // 🔝
      "isEmailVerified": false,
      "passport": "https://...",
      "createdAt": "2025-10-26"
    },
    {
      "id": "...",
      "email": "user3@example.com",
      "verificationStatus": "unverified",
      "isEmailVerified": false,
      "createdAt": "2025-10-25"
    }
  ],
  "page": 1,
  "limit": 10,
  "totalPages": 3,
  "totalResults": 25
}
```

### Filter by Verification Status

```bash
# Show only users awaiting review
GET /v1/users?verificationStatus=on_review

# Show only unverified users
GET /v1/users?verificationStatus=unverified

# Show only verified users
GET /v1/users?verificationStatus=verified
```

### Custom Sorting

If you want to override the default priority sorting:

```bash
# Sort by email alphabetically
GET /v1/users?sortBy=email:asc

# Sort by creation date
GET /v1/users?sortBy=createdAt:desc
```

## Admin Workflow

### Step 1: View Users Awaiting Review

```bash
GET /v1/users
# Returns users with on_review status first
```

### Step 2: Review Documents

Check the `driverLicense` and `passport` fields for document URLs:

```json
{
  "email": "user@example.com",
  "verificationStatus": "on_review",
  "driverLicense": "https://cloudinary.com/...license.jpg",
  "passport": null
}
```

### Step 3: Approve or Reject

**Approve:**
```bash
PATCH /v1/users/{userId}/verification
{
  "verificationStatus": "verified"
}
```

**Result:**
- `verificationStatus` = `'verified'`
- `isEmailVerified` = `true` ✅
- User moves down in the list (no longer in on_review)

**Reject:**
```bash
PATCH /v1/users/{userId}/verification
{
  "verificationStatus": "unverified",
  "rejectionReason": "Documents are not clear, please re-upload"
}
```

**Result:**
- `verificationStatus` = `'unverified'`
- `isEmailVerified` = `false`
- User can see rejection reason and re-upload

## Benefits

✅ **Efficient Review** - No need to search for users awaiting verification  
✅ **Automatic Prioritization** - `on_review` users always at the top  
✅ **Quick Processing** - Review pending users first before checking others  
✅ **Flexible Filtering** - Can filter by status if needed  
✅ **Custom Sorting** - Can override with custom sort if needed  

## Example Admin Dashboard Flow

```javascript
// Fetch users (on_review automatically at top)
const response = await fetch('/v1/users?limit=20', {
  headers: { 'Authorization': `Bearer ${adminToken}` }
});

const { results } = await response.json();

// Display badge based on status
results.forEach(user => {
  if (user.verificationStatus === 'on_review') {
    console.log(`🟡 ${user.email} - NEEDS REVIEW`);
  } else if (user.verificationStatus === 'verified') {
    console.log(`🟢 ${user.email} - VERIFIED`);
  } else {
    console.log(`⚪ ${user.email} - UNVERIFIED`);
  }
});
```

## Frontend Implementation

### Display Verification Queue

```jsx
function AdminUserList() {
  const [users, setUsers] = useState([]);

  useEffect(() => {
    // Fetch users - on_review automatically at top
    fetchUsers().then(setUsers);
  }, []);

  return (
    <div>
      <h2>Users List</h2>
      <p>Users awaiting review appear at the top</p>
      
      {users.map(user => (
        <UserCard 
          key={user.id} 
          user={user}
          isPriority={user.verificationStatus === 'on_review'}
        />
      ))}
    </div>
  );
}

function UserCard({ user, isPriority }) {
  return (
    <div className={isPriority ? 'border-yellow-500' : ''}>
      <h3>{user.email}</h3>
      
      {user.verificationStatus === 'on_review' && (
        <Badge color="yellow">REVIEW NEEDED</Badge>
      )}
      
      {user.verificationStatus === 'verified' && (
        <Badge color="green">VERIFIED ✓</Badge>
      )}
      
      {user.verificationStatus === 'unverified' && (
        <Badge color="gray">NOT VERIFIED</Badge>
      )}
      
      {isPriority && (
        <div>
          <a href={user.driverLicense}>View License</a>
          <a href={user.passport}>View Passport</a>
          <button onClick={() => verify(user.id)}>Approve</button>
          <button onClick={() => reject(user.id)}>Reject</button>
        </div>
      )}
    </div>
  );
}
```

## Technical Details

### Priority Implementation

Uses MongoDB aggregation to add a temporary priority field:

```javascript
verificationPriority: {
  'on_review': 1,    // Highest priority
  'unverified': 2,
  'verified': 3
}
```

Then sorts by:
1. `verificationPriority` (ascending)
2. `createdAt` (descending)

### Performance

- Uses MongoDB aggregation pipeline for efficient sorting
- Indexed fields ensure fast queries
- Pagination supported for large datasets

---

**Status:** ✅ Active  
**Version:** 1.0  
**Date:** October 27, 2025

