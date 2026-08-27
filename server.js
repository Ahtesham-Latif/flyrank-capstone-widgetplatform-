import app from './src/app.js';
import db from './src/config/db.js';
import dotenv from 'dotenv';

dotenv.config();

const PORT = process.env.PORT || 3000;

// Application entry point
const startServer = async () => {
    try {
        // Verify database connection before starting
        await db.raw('SELECT 1');
        console.log('Database connected successfully.');

        app.listen(PORT, () => {
            console.log(`Widget Platform listening on http://localhost:${PORT}`);
        });
    } catch (error) {
        console.error('Failed to connect to the database. Server not started.', error);
        process.exit(1);
    }
};

startServer();