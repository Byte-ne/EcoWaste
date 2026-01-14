# EcoWaste  Recycling & Sustainability Game Platform

A full-stack web application for learning about recycling, playing educational games, and earning rewards through an in-game coin system and shop. Uses MongoDB Atlas for cloud data storage.

goto [EcoWastee](https://ecowaste-0vkj.onrender.com/)

---

## ?? Quick Start (Windows PowerShell)

### 1. Install Dependencies

```powershell
cd 'C:\Users\YOUR_PC_NAME\Desktop\YOUR_FOLDER_NAME'
npm install
```

### 2. Configure Environment Variables

Create or edit `hack.env` in your project root with:

```env
MONGO_URI=mongodb+srv://YOUR_USERNAME:YOUR_PASSWORD@YOUR_CLUSTER.mongodb.net/hackathon?appName=YOUR_APP_NAME
GROQ_API_KEY=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
GROQ_MODEL=groq/compound
```

**Important**: Replace YOUR_USERNAME, YOUR_PASSWORD, YOUR_CLUSTER, and YOUR_APP_NAME with your actual MongoDB Atlas details.

### 3. Optional: Migrate Existing Users

If you have an existing `users.json` file with user data, run the migration script:

```powershell
node migrate-users.js
```

### 4. Start the Server

```powershell
node server.js
```

### 5. Open in Browser

Once the server outputs Server running on http://localhost:PORT_NUMBER, open your browser to:

```
http://localhost:3000/
```

---

##  Project File Structure & Functions

### **Frontend Files**

| File | Purpose |
|------|---------|
| index.html | **Homepage**  displays the EcoWaste logo, site name, recycling importance paragraph, and two interactive animated pie charts showing waste segregation statistics. |
| recycling-tips.html | **Recycling Tips Page**  contains educational tips and an AI-powered DIY suggester powered by Groq API (e.g., "How to recycle plastic bottles?"). |
| sorting-game.html | **Drag-and-Drop Sorting Game**  users drag waste items into colored bins. Scores are synced with MongoDB Atlas database. |
| quiz-game.html | **Quiz Game**  AI-generated multiple-choice quiz. Scores and coins saved to MongoDB Atlas. |
| shop.html | **Shop Page**  displays purchasable TAGS. User inventory managed in MongoDB Atlas. |
| style.css | **Global Stylesheet**  modern design system with CSS variables, animations, and responsive layout. |
| script.js | **Client-side Logic**  handles authentication, navigation, API calls to MongoDB-backed backend. |
| data.js | **API Configuration**  defines API base URL for communicating with the backend. |

### **Backend Files**

| File | Purpose |
|------|---------|
| server.js | **Express Server**  handles all API endpoints with MongoDB Atlas integration, using Groq API for AI features and express-session for session management. |
| hack.env | **Environment Variables**  stores MongoDB Atlas connection string and API keys. |
| migrate-users.js | **Migration Script**  optionally imports existing users from users.json to MongoDB Atlas. |

### **Asset Files**

| File | Purpose |
|------|---------|
| logo.png | **Site Logo**  displayed in the navigation bar next to "EcoWaste" site name. |

---

##  Features

### **Authentication**
- Sign up with username and password (stored in MongoDB Atlas)
- Log in with credential verification
- Session management with automatic data persistence
- Profile system with coin display and owned tags

### **Games**
- **Sorting Game**: Drag waste items into correct bins, earn coins on new high scores (saved to MongoDB)
- **Quiz Game**: AI-generated questions on recycling topics, earn coins (stored in MongoDB)

### **Shop & Economy**
- Earn coins based on game performance
- Purchase cosmetic TAGS with coins
- Complete inventory tracking in MongoDB Atlas

### **AI-Powered Features**
- **DIY Suggester**: Generate recycling suggestions using Groq AI
- **Quiz Generator**: Create dynamic quiz questions

### **Educational Content**
- Interactive waste segregation statistics
- Recycling tips and best practices

---

##  Environment Variables

| Variable | Example | Purpose |
|----------|---------|---------|
| MONGO_URI | mongodb+srv://user:pass@cluster.mongodb.net/hackathon | **Required**  MongoDB Atlas connection string for user data storage |
| GROQ_API_KEY | gsk_ee8kITRLUhp5... | **Required**  Groq API key for AI features |
| GROQ_MODEL | groq/compound | **Optional**  Groq model to use. Defaults to groq/compound. |

---

##  API Endpoints

All endpoints are prefixed with /api/:

| Method | Endpoint | Purpose |
|--------|----------|---------|
| POST | /signup | Create new user account in MongoDB |
| POST | /login | Authenticate and start session |
| POST | /logout | End session |
| GET | /me | Get current logged-in user |
| GET | /user-stats | Fetch user coins, tags, scores from MongoDB |
| POST | /score | Submit game score, award coins, save to MongoDB |
| GET | /tags | List all purchasable tags |
| POST | /purchase-tag | Buy tag with coins, update MongoDB |
| POST | /diy-suggestions | Generate AI recycling suggestions |
| POST | /quiz/generate | Generate AI quiz questions |

---

##  Database Schema

User data is stored in MongoDB Atlas with this structure:

```javascript
{
  _id: ObjectId,              // Auto-generated by MongoDB
  username: String,           // Unique username
  passwordHash: String,      // Bcrypt hashed password
  created: Number,           // Unix timestamp
  highscores: {
    sorting: Number,         // Sorting game score
    quiz: Number            // Quiz game score
  },
  coins: Number,             // Currency earned from games
  ownedTags: [String],       // Array of purchased tag IDs
  __v: Number               // Mongoose version key
}
```

---

##  Key Features

- **MongoDB Atlas Cloud Storage**: User data persists across deployments and sessions
- **Scalable**: Support for thousands of concurrent users
- **Real-time Persistence**: All game progress automatically saved
- **Migration Support**: Import existing users from JSON to MongoDB

---

##  Notes

- **Production Ready**: Uses MongoDB Atlas for reliable cloud data storage
- **Security**: Passwords are bcrypt hashed, HTTPS recommended for production
- **Session Management**: Express sessions with automatic MongoDB persistence
- **IP Whitelisting**: Configure MongoDB Atlas network access for security

---

##  Troubleshooting

| Issue | Solution |
|-------|----------|
| **MongoDB connection error** | Check MONGO_URI in hack.env, ensure IP is whitelisted in Atlas |
| **"Groq API key not configured"** | Verify GROQ_API_KEY in hack.env |
| **Migration fails** | Ensure users.json exists and MONGO_URI is correctly set |
| **Cannot save scores** | Check MongoDB Atlas dashboard for connection issues |

---

##  License

Hackathon demo project  use freely for learning and development.
