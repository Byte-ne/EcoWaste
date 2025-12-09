const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: 'hack.env' });

// Define User schema (same as in server.js)
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

async function migrateUsers() {
    try {
        // Connect to MongoDB
        await mongoose.connect(process.env.MONGO_URI);
        console.log('Connected to MongoDB Atlas');

        // Read existing users.json
        const usersFile = path.join(__dirname, 'users.json');
        if (!fs.existsSync(usersFile)) {
            console.log('users.json not found, nothing to migrate');
            return;
        }

        const usersData = JSON.parse(fs.readFileSync(usersFile, 'utf8'));
        const usersArray = Object.values(usersData); // Convert object to array

        console.log(`Found ${usersArray.length} users to migrate`);

        // Insert users (will skip if username already exists due to unique index)
        const inserted = [];
        for (const user of usersArray) {
            try {
                const newUser = new User(user);
                await newUser.save();
                inserted.push(user.username);
                console.log(`✓ Migrated: ${user.username}`);
            } catch (err) {
                if (err.code === 11000) { // Duplicate key error
                    console.log(`⚠ Skipped: ${user.username} (already exists)`);
                } else {
                    console.error(`✗ Error migrating ${user.username}:`, err.message);
                }
            }
        }

        console.log(`\nMigration complete!`);
        console.log(`Total users in users.json: ${usersArray.length}`);
        console.log(`Successfully migrated: ${inserted.length}`);
        console.log(`Skipped (already exist): ${usersArray.length - inserted.length}`);

    } catch (error) {
        console.error('Migration failed:', error);
    } finally {
        // Close database connection
        await mongoose.connection.close();
        console.log('Database connection closed');
    }
}

// Run the migration
migrateUsers().catch(console.error);
