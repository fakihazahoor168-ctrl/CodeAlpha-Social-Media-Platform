const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const cookieParser = require('cookie-parser');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const multer = require('multer');
const path = require('path');
const db = require('./db');

const app = express();
const PORT = 3000;
const SECRET_KEY = 'super_secret_key_for_this_app';

app.use(cors());
app.use(bodyParser.json());
app.use(cookieParser());
app.use(express.static('public'));

// Setup multer for uploads
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, './public/uploads/');
    },
    filename: (req, file, cb) => {
        cb(null, Date.now() + path.extname(file.originalname));
    }
});
const upload = multer({ storage, limits: { fileSize: 10 * 1024 * 1024 } });

// Middleware to authenticate
const authenticate = (req, res, next) => {
    const token = req.cookies.token;
    if (!token) {
        return res.status(401).json({ error: 'Unauthorized' });
    }
    jwt.verify(token, SECRET_KEY, (err, user) => {
        if (err) return res.status(403).json({ error: 'Forbidden' });
        req.user = user;
        next();
    });
};

// ─── AUTH ─────────────────────────────────────────────────────────────────────

app.post('/api/register', async (req, res) => {
    const { username, handle, password } = req.body;
    if (!username || !handle || !password) {
        return res.status(400).json({ error: 'All fields are required' });
    }
    const cleanHandle = handle.startsWith('@') ? handle : '@' + handle;
    try {
        const hashedPassword = await bcrypt.hash(password, 10);
        // Pick a random cover color
        const colors = ['#4f46e5','#7c3aed','#db2777','#059669','#d97706','#0891b2'];
        const cover_color = colors[Math.floor(Math.random() * colors.length)];
        db.run(
            `INSERT INTO users (username, handle, password, avatar, bio, cover_color) VALUES (?, ?, ?, ?, ?, ?)`,
            [username, cleanHandle, hashedPassword, 'default.png', 'Hey there! I am using Connect.', cover_color],
            function(err) {
                if (err) return res.status(400).json({ error: 'Username or handle already exists' });
                res.json({ message: 'User registered successfully!' });
            }
        );
    } catch (e) {
        res.status(500).json({ error: 'Server error' });
    }
});

app.post('/api/login', (req, res) => {
    const { handle, password } = req.body;
    const cleanHandle = handle.startsWith('@') ? handle : '@' + handle;
    db.get(`SELECT * FROM users WHERE handle = ?`, [cleanHandle], async (err, user) => {
        if (err || !user) return res.status(400).json({ error: 'User not found' });
        const valid = await bcrypt.compare(password, user.password);
        if (!valid) return res.status(400).json({ error: 'Invalid password' });
        const token = jwt.sign({ id: user.id, handle: user.handle }, SECRET_KEY);
        res.cookie('token', token, { httpOnly: true }).json({
            message: 'Logged in successfully',
            user: { id: user.id, handle: user.handle, username: user.username, avatar: user.avatar, cover_color: user.cover_color }
        });
    });
});

app.post('/api/logout', (req, res) => {
    res.clearCookie('token').json({ message: 'Logged out' });
});

app.get('/api/me', authenticate, (req, res) => {
    db.get(`SELECT id, username, handle, avatar, bio, cover_color FROM users WHERE id = ?`, [req.user.id], (err, user) => {
        if (err || !user) return res.status(404).json({ error: 'Not found' });
        res.json(user);
    });
});

// ─── POSTS ────────────────────────────────────────────────────────────────────

app.post('/api/posts', authenticate, upload.single('image'), (req, res) => {
    const { content } = req.body;
    if (!content || !content.trim()) return res.status(400).json({ error: 'Content is required' });
    const image = req.file ? req.file.filename : null;
    db.run(
        `INSERT INTO posts (user_id, content, image) VALUES (?, ?, ?)`,
        [req.user.id, content.trim(), image],
        function(err) {
            if (err) return res.status(500).json({ error: 'Error creating post' });
            res.json({ message: 'Post created', id: this.lastID });
        }
    );
});

app.get('/api/posts', authenticate, (req, res) => {
    const query = `
        SELECT p.*, u.username, u.handle, u.avatar, u.cover_color,
        (SELECT COUNT(*) FROM likes WHERE post_id = p.id) as likesCount,
        (SELECT COUNT(*) FROM likes WHERE post_id = p.id AND user_id = ?) as isLiked,
        (SELECT COUNT(*) FROM comments WHERE post_id = p.id) as commentsCount,
        (SELECT COUNT(*) FROM bookmarks WHERE post_id = p.id AND user_id = ?) as isBookmarked
        FROM posts p
        JOIN users u ON p.user_id = u.id
        ORDER BY p.created_at DESC
    `;
    db.all(query, [req.user.id, req.user.id], (err, posts) => {
        if (err) return res.status(500).json({ error: 'Server error' });
        res.json(posts);
    });
});

app.get('/api/posts/trending', authenticate, (req, res) => {
    const query = `
        SELECT p.id, p.content, p.created_at, u.username, u.handle, u.cover_color,
        (SELECT COUNT(*) FROM likes WHERE post_id = p.id) as likesCount
        FROM posts p
        JOIN users u ON p.user_id = u.id
        ORDER BY likesCount DESC
        LIMIT 5
    `;
    db.all(query, [], (err, posts) => {
        if (err) return res.status(500).json({ error: 'Server error' });
        res.json(posts);
    });
});

app.delete('/api/posts/:id', authenticate, (req, res) => {
    const postId = req.params.id;
    db.get(`SELECT * FROM posts WHERE id = ? AND user_id = ?`, [postId, req.user.id], (err, post) => {
        if (err || !post) return res.status(403).json({ error: 'Post not found or not authorized' });
        db.run(`DELETE FROM posts WHERE id = ?`, [postId], (err) => {
            if (err) return res.status(500).json({ error: 'Error deleting post' });
            // Cascade delete likes, comments, bookmarks
            db.run(`DELETE FROM likes WHERE post_id = ?`, [postId]);
            db.run(`DELETE FROM comments WHERE post_id = ?`, [postId]);
            db.run(`DELETE FROM bookmarks WHERE post_id = ?`, [postId]);
            res.json({ message: 'Post deleted' });
        });
    });
});

// ─── LIKES ────────────────────────────────────────────────────────────────────

app.post('/api/posts/:id/like', authenticate, (req, res) => {
    const postId = req.params.id;
    db.get(`SELECT * FROM likes WHERE user_id = ? AND post_id = ?`, [req.user.id, postId], (err, like) => {
        if (like) {
            db.run(`DELETE FROM likes WHERE user_id = ? AND post_id = ?`, [req.user.id, postId]);
            res.json({ liked: false });
        } else {
            db.run(`INSERT INTO likes (user_id, post_id) VALUES (?, ?)`, [req.user.id, postId]);
            // Create notification for post author
            db.get(`SELECT user_id FROM posts WHERE id = ?`, [postId], (err, post) => {
                if (post && post.user_id !== req.user.id) {
                    db.run(`INSERT INTO notifications (user_id, from_user_id, type, post_id) VALUES (?, ?, ?, ?)`,
                        [post.user_id, req.user.id, 'like', postId]);
                }
            });
            res.json({ liked: true });
        }
    });
});

// ─── COMMENTS ─────────────────────────────────────────────────────────────────

app.get('/api/posts/:id/comments', authenticate, (req, res) => {
    db.all(
        `SELECT c.*, u.username, u.handle, u.avatar, u.cover_color FROM comments c JOIN users u ON c.user_id = u.id WHERE c.post_id = ? ORDER BY c.created_at ASC`,
        [req.params.id],
        (err, comments) => {
            res.json(comments || []);
        }
    );
});

app.post('/api/posts/:id/comments', authenticate, (req, res) => {
    const { content } = req.body;
    if (!content || !content.trim()) return res.status(400).json({ error: 'Comment cannot be empty' });
    const postId = req.params.id;
    db.run(
        `INSERT INTO comments (post_id, user_id, content) VALUES (?, ?, ?)`,
        [postId, req.user.id, content.trim()],
        function(err) {
            if (err) return res.status(500).json({ error: 'Error adding comment' });
            // Create notification
            db.get(`SELECT user_id FROM posts WHERE id = ?`, [postId], (err, post) => {
                if (post && post.user_id !== req.user.id) {
                    db.run(`INSERT INTO notifications (user_id, from_user_id, type, post_id) VALUES (?, ?, ?, ?)`,
                        [post.user_id, req.user.id, 'comment', postId]);
                }
            });
            res.json({ message: 'Comment added', id: this.lastID });
        }
    );
});

// ─── BOOKMARKS ────────────────────────────────────────────────────────────────

app.post('/api/posts/:id/bookmark', authenticate, (req, res) => {
    const postId = req.params.id;
    db.get(`SELECT * FROM bookmarks WHERE user_id = ? AND post_id = ?`, [req.user.id, postId], (err, bm) => {
        if (bm) {
            db.run(`DELETE FROM bookmarks WHERE user_id = ? AND post_id = ?`, [req.user.id, postId]);
            res.json({ bookmarked: false });
        } else {
            db.run(`INSERT INTO bookmarks (user_id, post_id) VALUES (?, ?)`, [req.user.id, postId]);
            res.json({ bookmarked: true });
        }
    });
});

app.get('/api/bookmarks', authenticate, (req, res) => {
    const query = `
        SELECT p.*, u.username, u.handle, u.avatar, u.cover_color,
        (SELECT COUNT(*) FROM likes WHERE post_id = p.id) as likesCount,
        (SELECT COUNT(*) FROM likes WHERE post_id = p.id AND user_id = ?) as isLiked,
        (SELECT COUNT(*) FROM comments WHERE post_id = p.id) as commentsCount,
        1 as isBookmarked
        FROM bookmarks b
        JOIN posts p ON b.post_id = p.id
        JOIN users u ON p.user_id = u.id
        WHERE b.user_id = ?
        ORDER BY b.created_at DESC
    `;
    db.all(query, [req.user.id, req.user.id], (err, posts) => {
        if (err) return res.status(500).json({ error: 'Server error' });
        res.json(posts);
    });
});

// ─── NOTIFICATIONS ────────────────────────────────────────────────────────────

app.get('/api/notifications', authenticate, (req, res) => {
    const query = `
        SELECT n.*, u.username as from_username, u.handle as from_handle, u.cover_color as from_cover_color
        FROM notifications n
        JOIN users u ON n.from_user_id = u.id
        WHERE n.user_id = ?
        ORDER BY n.created_at DESC
        LIMIT 20
    `;
    db.all(query, [req.user.id], (err, notifs) => {
        if (err) return res.status(500).json({ error: 'Server error' });
        res.json(notifs || []);
    });
});

app.post('/api/notifications/read', authenticate, (req, res) => {
    db.run(`UPDATE notifications SET is_read = 1 WHERE user_id = ?`, [req.user.id], (err) => {
        res.json({ message: 'Marked as read' });
    });
});

app.get('/api/notifications/count', authenticate, (req, res) => {
    db.get(`SELECT COUNT(*) as count FROM notifications WHERE user_id = ? AND is_read = 0`, [req.user.id], (err, row) => {
        res.json({ count: row ? row.count : 0 });
    });
});

// ─── PROFILE ──────────────────────────────────────────────────────────────────

app.get('/api/profile/:handle', authenticate, (req, res) => {
    const currUser = req.user.id;
    db.get(`
        SELECT u.id, u.username, u.handle, u.bio, u.avatar, u.cover_color,
        (SELECT COUNT(*) FROM follows WHERE following_id = u.id) as followers,
        (SELECT COUNT(*) FROM follows WHERE follower_id = u.id) as following,
        (SELECT COUNT(*) FROM follows WHERE follower_id = ? AND following_id = u.id) as isFollowing
        FROM users u WHERE u.handle = ?`, [currUser, req.params.handle], (err, user) => {
        if (!user) return res.status(404).json({ error: 'User not found' });

        db.all(`
            SELECT p.*, u.username, u.handle, u.avatar, u.cover_color,
            (SELECT COUNT(*) FROM likes WHERE post_id = p.id) as likesCount,
            (SELECT COUNT(*) FROM likes WHERE post_id = p.id AND user_id = ?) as isLiked,
            (SELECT COUNT(*) FROM comments WHERE post_id = p.id) as commentsCount,
            (SELECT COUNT(*) FROM bookmarks WHERE post_id = p.id AND user_id = ?) as isBookmarked
            FROM posts p
            JOIN users u ON p.user_id = u.id WHERE p.user_id = ?
            ORDER BY p.created_at DESC
        `, [currUser, currUser, user.id], (err, posts) => {
            res.json({ user, posts });
        });
    });
});

app.put('/api/profile', authenticate, (req, res) => {
    const { username, bio } = req.body;
    if (!username || !username.trim()) return res.status(400).json({ error: 'Name is required' });
    db.run(
        `UPDATE users SET username = ?, bio = ? WHERE id = ?`,
        [username.trim(), bio ? bio.trim() : '', req.user.id],
        (err) => {
            if (err) return res.status(500).json({ error: 'Error updating profile' });
            res.json({ message: 'Profile updated' });
        }
    );
});

app.post('/api/profile/:handle/follow', authenticate, (req, res) => {
    db.get(`SELECT id FROM users WHERE handle = ?`, [req.params.handle], (err, userToFollow) => {
        if (!userToFollow) return res.status(404).json({ error: 'User not found' });
        if (userToFollow.id === req.user.id) return res.status(400).json({ error: 'Cannot follow yourself' });

        db.get(`SELECT * FROM follows WHERE follower_id = ? AND following_id = ?`, [req.user.id, userToFollow.id], (err, follow) => {
            if (follow) {
                db.run(`DELETE FROM follows WHERE follower_id = ? AND following_id = ?`, [req.user.id, userToFollow.id]);
                res.json({ followed: false });
            } else {
                db.run(`INSERT INTO follows (follower_id, following_id) VALUES (?, ?)`, [req.user.id, userToFollow.id]);
                // Notification
                db.run(`INSERT INTO notifications (user_id, from_user_id, type) VALUES (?, ?, ?)`,
                    [userToFollow.id, req.user.id, 'follow']);
                res.json({ followed: true });
            }
        });
    });
});

// ─── SEARCH ───────────────────────────────────────────────────────────────────

app.get('/api/users/search', authenticate, (req, res) => {
    const q = (req.query.q || '').trim();
    if (!q) return res.json([]);
    const pattern = `%${q}%`;
    db.all(
        `SELECT id, username, handle, bio, cover_color,
        (SELECT COUNT(*) FROM follows WHERE following_id = users.id) as followers,
        (SELECT COUNT(*) FROM follows WHERE follower_id = ? AND following_id = users.id) as isFollowing
        FROM users WHERE (username LIKE ? OR handle LIKE ?) AND id != ? LIMIT 10`,
        [req.user.id, pattern, pattern, req.user.id],
        (err, users) => {
            if (err) return res.status(500).json({ error: 'Server error' });
            res.json(users || []);
        }
    );
});

app.get('/api/users/suggested', authenticate, (req, res) => {
    db.all(
        `SELECT id, username, handle, bio, cover_color,
        (SELECT COUNT(*) FROM follows WHERE following_id = users.id) as followers
        FROM users WHERE id != ?
        AND id NOT IN (SELECT following_id FROM follows WHERE follower_id = ?)
        ORDER BY followers DESC LIMIT 5`,
        [req.user.id, req.user.id],
        (err, users) => {
            if (err) return res.status(500).json({ error: 'Server error' });
            res.json(users || []);
        }
    );
});

// ─── START SERVER ─────────────────────────────────────────────────────────────

app.listen(PORT, () => {
    console.log(`🚀 Server running on http://localhost:${PORT}`);
});
