```markdown
# API Reference

This section provides detailed documentation for all API endpoints.

**(This is a placeholder. You would typically generate or manually write API documentation here.)**

---

### Example Endpoint: Get All Users

**GET** `/api/v1/users`

**Description:** Retrieves a list of all registered users.

**Request:**

GET /api/v1/users HTTP/1.1
Host: https://www.google.com/search?q=your-api-domain.com

**Response (200 OK):**
```json
[
  {
    "id": 1,
    "email": "user1@example.com",
    "is_active": true
  },
  {
    "id": 2,
    "email": "user2@example.com",
    "is_active": false
  }
]