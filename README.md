# Mini Social Media Platform

A fully functional, responsive social media web application built as part of the CodeAlpha internship. This project provides a robust backend implementation and an interactive frontend, allowing users to connect, share content, and interact with each other.

## Features

- **User Authentication**: Secure registration and login flows using JWT (JSON Web Tokens) and secure password hashing with `bcrypt`.
- **Feed & Posts**: Users can create text and image posts. The main feed displays posts from the platform.
- **Interactions**: Users can "Like" posts and leave "Comments" on them.
- **User Profiles**: Dedicated profile pages displaying user details and their published posts.
- **Follow System**: Users can follow and unfollow other profiles.
- **Media Uploads**: Seamless handling of image uploads (for posts and profile pictures) using `multer`.

## Tech Stack

- **Frontend**: HTML5, CSS3, JavaScript (Vanilla JS), Bootstrap.
- **Backend**: Node.js, Express.js.
- **Database**: SQLite3 (Local file-based SQL database).
- **Security & Middlewares**: `jsonwebtoken` (JWT for session management), `bcrypt`, `cookie-parser`, `cors`.

## Prerequisites

Make sure you have [Node.js](https://nodejs.org/) installed on your machine.

## Installation & Setup

1. **Clone the repository:**
   ```bash
   git clone <your-github-repo-url>
   cd Social-Media
   ```

2. **Install all dependencies:**
   ```bash
   npm install
   ```

3. **Run the backend server:**
   ```bash
   node server.js
   ```

4. **Access the Application:**
   Open your browser and navigate to:
   `http://localhost:3000`

## File Structure

```text
/
├── public/                 # Frontend Static Files
│   ├── css/                # Stylesheets (style.css)
│   ├── js/                 # Client-side JavaScript (auth.js, feed.js, profile.js)
│   ├── uploads/            # Directory where user uploaded images are stored
│   ├── index.html          # Main Feed Page
│   ├── login.html          # Login / Signup Page
│   └── profile.html        # User Profile Page
├── server.js               # Main Express.js backend server
├── db.js                   # SQLite database configurations and schemas
├── database.sqlite         # Automatically generated SQLite database file
└── package.json            # Project dependencies and configurations
```

## Contributing

Pull requests are welcome! If you'd like to improve this project, feel free to fork this repository, make your changes, and submit a PR.

## License

This project is licensed under the ISC License.
