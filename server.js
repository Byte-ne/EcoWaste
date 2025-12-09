const express = require('express');
const fs = require('fs');
const path = require('path');
const bcrypt = require('bcrypt');
const session = require('express-session');
const cors = require('cors');
const mongoose = require('mongoose');
require('dotenv').config({ path: 'hack.env' });

const PORT = process.env.PORT || 3000;

// Define User schema
const userSchema = new mongoose.Schema({
    username: { type: String, required: true, unique: true },
    passwordHash: { type: String, required: true },
    created: { type: Number, default: Date.now },
    highscores: {
        sorting: { type: Number, default: 0 },
        quiz: { type: Number, default: 0 }
    },
    coins: { type: Number, default: 0 },
    ownedTags: { type: [String], default: [] }
});
const User = mongoose.model('User', userSchema);

// Connect to MongoDB
mongoose.connect(process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/hackathon')
    .then(() => console.log('Connected to MongoDB'))
    .catch(err => console.error('MongoDB connection error:', err));

const app = express();
app.use(cors({ origin: true, credentials: true }));
app.use(express.json());
app.use(session({
    secret: 'hackathon-secret-change-this',
    resave: false,
    saveUninitialized: false,
    cookie: { httpOnly: true }
}));

// simple health
app.get('/api/ping', (req, res) => res.json({ ok: true }));

app.post('/api/signup', async (req, res) => {
    const { username, password } = req.body || {};
    if (!username || !password) return res.status(400).json({ success: false, message: 'Missing username or password' });
    try {
        const existingUser = await User.findOne({ username });
        if (existingUser) return res.status(409).json({ success: false, message: 'Username exists' });
        const hash = await bcrypt.hash(password, 10);
        const newUser = new User({ username, passwordHash: hash });
        await newUser.save();
        req.session.user = { username };
        res.json({ success: true, user: { username } });
    } catch (err) {
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

app.post('/api/login', async (req, res) => {
    const { username, password } = req.body || {};
    if (!username || !password) return res.status(400).json({ success: false, message: 'Missing username or password' });
    try {
        const user = await User.findOne({ username });
        if (!user) return res.status(401).json({ success: false, message: 'No such user' });
        const ok = await bcrypt.compare(password, user.passwordHash);
        if (!ok) return res.status(401).json({ success: false, message: 'Invalid password' });
        req.session.user = { username };
        res.json({ success: true, user: { username } });
    } catch (err) {
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

app.post('/api/logout', (req, res) => {
    req.session.destroy(err => {
        res.json({ success: true });
    });
});

app.get('/api/me', (req, res) => {
    if (req.session && req.session.user) return res.json({ user: req.session.user });
    return res.status(401).json({ message: 'Not authorized' });
});

// Return user stats (coins, owned tags, highscores)
app.get('/api/user-stats', async (req, res) => {
    if (!req.session || !req.session.user) return res.status(401).json({ message: 'Not authorized' });
    try {
        const user = await User.findOne({ username: req.session.user.username });
        if (!user) return res.status(404).json({ message: 'User not found' });
        const coins = user.coins || 0;
        const ownedTags = user.ownedTags || [];
        const highscores = user.highscores || { sorting: 0, quiz: 0 };
        res.json({ coins, ownedTags, highscores });
    } catch (err) {
        res.status(500).json({ message: 'Server error' });
    }
});

// Save score for a game and award coins for new highscore
app.post('/api/score', async (req, res) => {
    if (!req.session || !req.session.user) return res.status(401).json({ message: 'Not authorized' });
    const { game, score } = req.body || {};
    if (!game || typeof score !== 'number') return res.status(400).json({ error: 'Missing game or score' });
    try {
        const user = await User.findOne({ username: req.session.user.username });
        if (!user) return res.status(404).json({ error: 'User not found' });
        const prev = user.highscores[game] || 0;
        let awarded = 0;
        if (score > prev) {
            user.highscores[game] = score;
            awarded = Math.floor(score / 10);
            user.coins += awarded;
            await user.save();
        }
        res.json({ success: true, newHigh: score > prev, awarded, highscores: user.highscores, coins: user.coins });
    } catch (err) {
        res.status(500).json({ error: 'Server error' });
    }
});

// Purchase a tag
const TAGS = [
    // 20 sample tags with costs and rarity
    { id: 'green-1', name: 'Green Sprout', cost: 10, rarity: 'common' },
    { id: 'green-2', name: 'Leaf Collector', cost: 20, rarity: 'common' },
    { id: 'green-3', name: 'Eco Friend', cost: 30, rarity: 'common' },
    { id: 'green-4', name: 'Tree Hugger', cost: 40, rarity: 'uncommon' },
    { id: 'green-5', name: 'Recycle Pro', cost: 50, rarity: 'uncommon' },
    { id: 'green-6', name: 'Compost King', cost: 60, rarity: 'uncommon' },
    { id: 'green-7', name: 'Sustain Guru', cost: 75, rarity: 'rare' },
    { id: 'green-8', name: 'Planet Pal', cost: 90, rarity: 'rare' },
    { id: 'green-9', name: 'Forest Friend', cost: 110, rarity: 'rare' },
    { id: 'green-10', name: 'Eco Guardian', cost: 140, rarity: 'epic' },
    { id: 'green-11', name: 'Green Baron', cost: 180, rarity: 'epic' },
    { id: 'green-12', name: 'Leaf Knight', cost: 220, rarity: 'legendary' },
    { id: 'green-13', name: 'The Great Tree', cost: 300, rarity: 'legendary' },
    { id: 'green-14', name: 'Green Emperor', cost: 350, rarity: 'legendary' },
    { id: 'green-15', name: 'Sapling Star', cost: 25, rarity: 'common' },
    { id: 'green-16', name: 'Branch Buddy', cost: 35, rarity: 'common' },
    { id: 'green-17', name: 'Garden Guru', cost: 55, rarity: 'uncommon' },
    { id: 'green-18', name: 'Earth Ally', cost: 95, rarity: 'rare' },
    { id: 'green-19', name: 'Nature Noble', cost: 160, rarity: 'epic' },
    { id: 'green-20', name: 'Verdant Voice', cost: 250, rarity: 'legendary' }
];

app.get('/api/tags', (req, res) => {
    res.json({ tags: TAGS });
});

app.post('/api/purchase-tag', async (req, res) => {
    if (!req.session || !req.session.user) return res.status(401).json({ message: 'Not authorized' });
    const { id } = req.body || {};
    if (!id) return res.status(400).json({ error: 'Missing tag id' });
    const tag = TAGS.find(t => t.id === id);
    if (!tag) return res.status(404).json({ error: 'Tag not found' });
    try {
        const user = await User.findOne({ username: req.session.user.username });
        if (!user) return res.status(404).json({ error: 'User not found' });
        if (user.ownedTags.includes(id)) return res.status(400).json({ error: 'Already owned' });
        if (user.coins < tag.cost) return res.status(400).json({ error: 'Insufficient coins' });
        user.coins -= tag.cost;
        user.ownedTags.push(id);
        await user.save();
        res.json({ success: true, coins: user.coins, ownedTags: user.ownedTags });
    } catch (err) {
        res.status(500).json({ error: 'Server error' });
    }
});

// Generate a quiz using Groq: returns an array of questions with 4 options each
app.post('/api/quiz/generate', async (req, res) => {
    try {
        const { count } = req.body || {};
        const n = Math.max(3, Math.min(20, parseInt(count || 5, 10)));
        const groqApiKey = process.env.GROQ_API_KEY;
        if (!groqApiKey) return res.status(500).json({ error: 'Groq API key not configured' });

        const prompt = `Generate ${n} multiple-choice questions about recycling, waste sorting, and eco-friendly habits. ` +
            `For each question provide a JSON object with keys: id (short unique), question (string), options (array of 4 strings), answerIndex (0-3). ` +
            `Ensure questions vary in difficulty and cover different topics; do not repeat questions or answers. Output a JSON array.`;

        const modelToUse = process.env.GROQ_MODEL || 'groq/compound';

        const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${groqApiKey}`, 'Content-Type': 'application/json' },
            body: JSON.stringify({ model: modelToUse, messages: [{ role: 'user', content: prompt }], temperature: 0.8, max_tokens: 1200 })
        });

        if (!response.ok) {
            const errData = await response.json().catch(() => ({}));
            console.error('Groq quiz error:', errData);
            if (errData && errData.error && errData.error.code === 'model_decommissioned') {
                return res.status(422).json({ error: 'model_decommissioned', message: errData.error.message, triedModel: modelToUse });
            }
            return res.status(response.status).json({ error: 'Groq API error', details: errData });
        }

        const data = await response.json();
        const text = data.choices?.[0]?.message?.content || '';

        // Extract JSON array
        let jsonMatch = text.match(/\[\s*\{[\s\S]*\}\s*\]/);
        if (!jsonMatch && text.includes('[')) {
            const start = text.indexOf('[');
            const end = text.lastIndexOf(']') + 1;
            if (start !== -1 && end > start) jsonMatch = [text.substring(start, end)];
        }

        let questions = [];
        try {
            if (jsonMatch) {
                questions = JSON.parse(jsonMatch[0]);
            } else {
                questions = [];
            }
        } catch (err) {
            console.error('Quiz parse error:', err, 'raw:', text);
            return res.status(500).json({ error: 'Failed to parse quiz from model', raw: text });
        }

        // Basic validation: ensure options length 4 and answerIndex present
        questions = questions.map((q, idx) => {
            if (!q.id) q.id = 'q' + idx + '_' + Math.random().toString(36).slice(2, 6);
            if (!Array.isArray(q.options)) q.options = (q.incorrect || []).slice(0, 3).concat([q.correct || '']).slice(0, 4);
            if (typeof q.answerIndex !== 'number') {
                // try to find correct in options
                const ci = q.options.findIndex(o => (q.correct && o && q.correct && o.trim() === q.correct.trim()));
                q.answerIndex = ci >= 0 ? ci : 0;
            }
            // ensure 4 options
            while (q.options.length < 4) q.options.push('None of the above');
            return q;
        });

        res.json({ success: true, questions });
    } catch (err) {
        console.error('Quiz generation error:', err);
        res.status(500).json({ error: err.message });
    }
});

// DIY Suggestion endpoint (Groq API)
app.post('/api/diy-suggestions', async (req, res) => {
    try {
        const { items } = req.body;
        if (!items || typeof items !== 'string' || items.trim().length === 0) {
            return res.status(400).json({ error: 'Please provide items' });
        }

        const groqApiKey = process.env.GROQ_API_KEY;
        if (!groqApiKey) {
            return res.status(500).json({ error: 'Groq API key not configured' });
        }

        const prompt = `I have these items: ${items}. 

Suggest 3-5 DIY eco-friendly projects I can make from these items. 
For each suggestion, provide:
1. Project name
2. Description (1-2 sentences)
3. Usability score (1-10): how practical/useful is it?
4. Eco-friendly score (1-10): how environmentally friendly?
5. Fun score (1-10): how enjoyable/interesting?

Format as JSON array with fields: name, description, usability, ecoFriendly, fun`;

        console.log('Calling Groq API with items:', items);

        const modelToUse = process.env.GROQ_MODEL || 'groq/compound';

        const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${groqApiKey}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                model: modelToUse,
                messages: [{ role: 'user', content: prompt }],
                temperature: 0.7,
                max_tokens: 1024
            })
        });

        console.log('Groq API response status:', response.status);

        if (!response.ok) {
            const errData = await response.json().catch(() => ({}));
            console.error('Groq API error details:', errData);
            // If the model was decommissioned, return a helpful message to the client
            if (errData && errData.error && errData.error.code === 'model_decommissioned') {
                return res.status(422).json({
                    error: 'model_decommissioned',
                    message: errData.error.message || 'Model decommissioned',
                    triedModel: modelToUse,
                    help: 'Set the environment variable GROQ_MODEL to a supported model. See https://console.groq.com/docs/deprecations'
                });
            }
            return res.status(response.status).json({ error: 'Groq API error', details: errData, triedModel: modelToUse });
        }

        const data = await response.json();
        console.log('Groq API response:', data);

        const text = data.choices?.[0]?.message?.content || '';

        // Extract JSON from response
        let jsonMatch = text.match(/\[\s*\{[\s\S]*\}\s*\]/);
        if (!jsonMatch && text.includes('{')) {
            const startIdx = text.indexOf('[');
            const endIdx = text.lastIndexOf(']') + 1;
            if (startIdx !== -1 && endIdx > startIdx) {
                jsonMatch = [text.substring(startIdx, endIdx)];
            }
        }

        let suggestions = [];
        try {
            if (jsonMatch) {
                suggestions = JSON.parse(jsonMatch[0]);
            } else {
                suggestions = [{ error: 'Could not parse suggestions', raw: text }];
            }
        } catch (parseErr) {
            suggestions = [{ error: 'JSON parse error', raw: text }];
        }

        res.json({ success: true, suggestions, raw: text });
    } catch (err) {
        console.error('DIY endpoint error:', err);
        res.status(500).json({ error: err.message });
    }
});

// serve frontend static files optionally
app.use(express.static(path.join(__dirname)));

app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));
