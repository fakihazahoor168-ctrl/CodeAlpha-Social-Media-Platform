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
const upload = multer({ storage });

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

app.post('/api/register', async (req, res) => {
    const { username, handle, password } = req.body;
    try {
        const hashedPassword = await bcrypt.hash(password, 10);
        db.run(`INSERT INTO users (username, handle, password, avatar, bio) VALUES (?, ?, ?, ?, ?)`, 
            [username, handle, hashedPassword, 'default.png', 'New user'], function(err) {
            if (err) return res.status(400).json({ error: 'Username or handle already exists' });
            res.json({ message: 'User registered successfully!' });
        });
    } catch (e) {
        res.status(500).json({ error: 'Server error' });
    }
});

app.post('/api/login', (req, res) => {
    const { handle, password } = req.body;
    db.get(`SELECT * FROM users WHERE handle = ?`, [handle], async (err, user) => {
        if (err || !user) return res.status(400).json({ error: 'User not found' });
        const valid = await bcrypt.compare(password, user.password);
        if (!valid) return res.status(400).json({ error: 'Invalid password' });
        const token = jwt.sign({ id: user.id, handle: user.handle }, SECRET_KEY);
        res.cookie('token', token, { httpOnly: true }).json({ message: 'Logged in successfully', user: { id: user.id, handle: user.handle, username: user.username, avatar: user.avatar } });
    });
});

app.post('/api/logout', (req, res) => {
    res.clearCookie('token').json({ message: 'Logged out' });
});

app.get('/api/me', authenticate, (req, res) => {
    db.get(`SELECT id, username, handle, avatar, bio FROM users WHERE id = ?`, [req.user.id], (err, user) => {
        res.json(user);
    });
});

app.post('/api/posts', authenticate, upload.single('image'), (req, res) => {
    const { content } = req.body;
    const image = req.file ? req.file.filename : null;
    db.run(`INSERT INTO posts (user_id, content, image) VALUES (?, ?, ?)`, [req.user.id, content, image], function(err) {
        if (err) return res.status(500).json({ error: 'Error creating post' });
        res.json({ message: 'Post created', id: this.lastID });
    });
});

app.get('/api/posts', authenticate, (req, res) => {
    const query = `
        SELECT p.*, u.username, u.handle, u.avatar, 
        (SELECT COUNT(*) FROM likes WHERE post_id = p.id) as likesCount,
        (SELECT COUNT(*) FROM likes WHERE post_id = p.id AND user_id = ?) as isLiked,
        (SELECT COUNT(*) FROM comments WHERE post_id = p.id) as commentsCount
        FROM posts p
        JOIN users u ON p.user_id = u.id
        ORDER BY p.created_at DESC
    `;
    db.all(query, [req.user.id], (err, posts) => {
        if (err) return res.status(500).json({ error: 'Server error' });
        res.json(posts);
    });
});

app.post('/api/posts/:id/like', authenticate, (req, res) => {
    const postId = req.params.id;
    db.get(`SELECT * FROM likes WHERE user_id = ? AND post_id = ?`, [req.user.id, postId], (err, like) => {
        if (like) {
            db.run(`DELETE FROM likes WHERE user_id = ? AND post_id = ?`, [req.user.id, postId]);
            res.json({ liked: false });
        } else {
            db.run(`INSERT INTO likes (user_id, post_id) VALUES (?, ?)`, [req.user.id, postId]);
            res.json({ liked: true });
        }
    });
});

app.get('/api/posts/:id/comments', authenticate, (req, res) => {
    db.all(`SELECT c.*, u.username, u.handle, u.avatar FROM comments c JOIN users u ON c.user_id = u.id WHERE c.post_id = ? ORDER BY c.created_at ASC`, [req.params.id], (err, comments) => {
        res.json(comments);
    });
});

app.post('/api/posts/:id/comments', authenticate, (req, res) => {
    db.run(`INSERT INTO comments (post_id, user_id, content) VALUES (?, ?, ?)`, [req.params.id, req.user.id, req.body.content], function(err) {
        res.json({ message: 'Comment added' });
    });
});

app.get('/api/profile/:handle', authenticate, (req, res) => {
    const currUser = req.user.id;
    db.get(`
        SELECT u.id, u.username, u.handle, u.bio, u.avatar,
        (SELECT COUNT(*) FROM follows WHERE following_id = u.id) as followers,
        (SELECT COUNT(*) FROM follows WHERE follower_id = u.id) as following,
        (SELECT COUNT(*) FROM follows WHERE follower_id = ? AND following_id = u.id) as isFollowing
        FROM users u WHERE u.handle = ?`, [currUser, req.params.handle], (err, user) => {
        if (!user) return res.status(404).json({ error: 'User not found' });
        
        db.all(`
            SELECT p.*, u.username, u.handle, u.avatar,
            (SELECT COUNT(*) FROM likes WHERE post_id = p.id) as likesCount,
            (SELECT COUNT(*) FROM likes WHERE post_id = p.id AND user_id = ?) as isLiked,
            (SELECT COUNT(*) FROM comments WHERE post_id = p.id) as commentsCount
            FROM posts p
            JOIN users u ON p.user_id = u.id WHERE p.user_id = ?
            ORDER BY p.created_at DESC
        `, [currUser, user.id], (err, posts) => {
            res.json({ user, posts });
        });
    });
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
                res.json({ followed: true });
            }
        });
    });
});

app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});
