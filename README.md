# 🚀 Connect — Premium Social Media Platform

Connect is a modern, high-fidelity, and feature-rich social media platform built using a powerful, lightweight stack: **Node.js, Express, and SQLite3**, with a **Vanilla Glassmorphism UI** on the frontend. Designed from the ground up to offer professional-grade aesthetics, seamless interactions, and robust security, Connect elevates the standard of simple web applications to a premium experience.

---

## 🎨 Technology Stack Decisions & Benefits

Connect is engineered to demonstrate how standard web technologies can be maximized to build lightning-fast, secure, and beautiful applications.

### 1. **Backend: Node.js & Express**
*   **Why we use it**: Node.js utilizes an asynchronous, event-driven, non-blocking I/O model. Express is the minimal, standard framework on top of it.
*   **Benefits**:
    *   **Unified Language**: Enables a single language (JavaScript) across the entire stack, speeding up development and simplifying context switching.
    *   **Performance**: Perfect for scaling user interactions (likes, comments, profile updates) with minimal overhead.
    *   **Middleware Ecosystem**: Easy integration of secure middlewares like Cookie-Parser (for auth tokens) and Multer (for robust binary image uploads).

### 2. **Database: SQLite3**
*   **Why we use it**: SQLite is a self-contained, serverless, zero-configuration SQL database engine.
*   **Benefits**:
    *   **Embedded Efficiency**: It stores data in a single local file (`database.sqlite`), avoiding the latency and setup complexity of external database servers (like PostgreSQL or MySQL) while still providing full SQL capability.
    *   **ACID Compliance**: Ensures all database transactions (e.g., cascading post deletion, double-checking follow lists) are fully atomic, consistent, isolated, and durable.
    *   **Relations & Subqueries**: Simplifies complex queries, such as fetching posts alongside user details, likes count, bookmark status, and follow relationships in a single query.

### 3. **Security: Bcrypt & JSON Web Tokens (JWT)**
*   **Why we use it**: Password security uses `bcrypt` with adaptive salt rounds, and sessions are authorized via signed JWTs.
*   **Benefits**:
    *   **Cryptographic Strength**: `bcrypt` uses one-way blowfish-based hashing, protecting credentials even in database compromise scenarios.
    *   **HTTP-Only Cookies**: JWT tokens are transmitted via secure, HTTP-Only cookies, rendering sessions immune to XSS (Cross-Site Scripting) token-stealing.
    *   **State-independent Auth**: Verification happens instantly without requiring persistent backend session memory tables.

---

## ✨ Extraordinary Features Added

Connect is loaded with advanced features that provide a modern and fluid user experience:

1.  **🔔 Real-Time Notification System**: Elegant, unread badges and a dedicated dropdown panel. Users get notified immediately when someone *likes* their post, *comments* on it, or *follows* their profile. Includes single-click "Mark all read" capabilities.
2.  **🔍 Interactive Explore & Live Search**: Debounced search bar fetches user accounts in real-time as you type. Includes a dedicated "Who to Follow" recommendations panel recommending users you aren't currently following.
3.  **📌 Bookmarks & Saved Posts**: Users can bookmark any post directly from the feed. A dedicated "Saved" tab on their profile displays their bookmarked posts for easy reading later.
4.  **🔥 Trending Widget**: The sidebar computes and updates a trending posts section in real-time, highlighting the top 5 most liked content on the platform.
5.  **📸 Live Image Previews & Lightbox**: Attach media and view a client-side preview in the compose box instantly with a toggleable delete button. Clicking on post images opens a high-fidelity image Lightbox overlay with blur transitions.
6.  **✏️ Profile Settings Customization**: A premium profile edit modal overlays the screen, letting users modify their display name and bio instantly with instant DOM updates and toast feedback.
7.  **✨ Toast Feedback System**: Standard, intrusive browser `alert()` popups are replaced with elegant, non-intrusive toast notification cards indicating successes, errors, and informational status.
8.  **⏳ Relative Timestamps**: Timestamps are computed dynamically on the client side (e.g., "Just now", "2m ago", "5h ago") to match the design conventions of major social platforms.

---

## 📂 System Architecture & File Structure

```text
/
├── public/                 # Premium Frontend Client
│   ├── css/
│   │   └── style.css       # Core design tokens, gradients, glassmorphism, & responsive media queries
│   ├── js/
│   │   ├── app.js          # Shared authentication checks, post generation, likes, bookmarks, and toasts
│   │   ├── auth.js         # Secure login, registration layout switching, and toast integration
│   │   ├── feed.js         # Compose flow, image preview, trending lists, and recommended connection items
│   │   ├── profile.js      # Modal settings, profile-specific tabs (Posts vs Saved), and covers
│   │   ├── explore.js      # Debounced search logic and connections list
│   │   └── notifications.js# Notification panel loaders, unread counters, and mark-all-read requests
│   ├── uploads/            # Server uploads folder for post media files
│   ├── index.html          # Main application dashboard
│   ├── explore.html        # Interactive user search & connect dashboard
│   ├── login.html          # Hero-split entry page
│   └── profile.html        # Glassmorphic user statistics and posts tabs
├── db.js                   # Schema definitions for users, posts, follows, bookmarks, and notifications
├── server.js               # Express API router & authentication middleware
├── database.sqlite         # Local embedded database file
└── package.json            # Application configurations & package definitions
```

---

## 🛠️ Installation & Execution

### 1. Prerequisites
Install [Node.js](https://nodejs.org/) (includes npm).

### 2. Setup Dependencies
From the repository root, install the required node modules:
```bash
npm install
```

### 3. Run the Server
Launch the local Express server:
```bash
node server.js
```

### 4. Launch the App
Visit the platform in your browser at:
**[http://localhost:3000](http://localhost:3000)**

---

## 🔒 Security Practices Built-in

*   **Cookie Security**: All authentication cookies use `HttpOnly` and `SameSite=Lax` configurations.
*   **Cascade Constraints**: Deleting a post automatically drops all linked likes, comments, and bookmarks in the database using SQL cascades.
*   **Input Sanitization**: Content input is trimmed and escaping filters are applied inside SQLite queries.
