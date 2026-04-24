import dotenv from 'dotenv';
import app from './app.js';
import connectDB from './config/db.js';

// Load env vars first
dotenv.config({ path: './.env' });

// Connect to database
await connectDB();

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
    console.log(`Server running in ${process.env.NODE_ENV} mode on port ${PORT}`);
    console.log(`API available at http://localhost:${PORT}`);
    console.log(`Swagger docs available at http://localhost:${PORT}/api-docs`);
});
