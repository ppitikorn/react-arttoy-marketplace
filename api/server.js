const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const passport = require('passport');
const dotenv = require('dotenv');
const { createServer } = require('http');
const initializeSocket = require('./socketServer');
const { clientMeta } = require('./middleware/clientMeta');
dotenv.config();

const app = express();
app.set('trust proxy', true);
app.use(clientMeta({ mode: 'anonymize' }));

//socket io
const server = createServer(app);
initializeSocket(server);

// Middleware
app.use(cors({
    origin:'*', // Adjust as needed
    credentials: true // Allow credentials if needed
}));
app.use(express.json());
app.use(passport.initialize());


// Passport config
require('./config/passport');

// Routes
const authRoutes = require('./routes/auth');
const profileRoutes = require('./routes/profile');
const adminRoutes = require('./routes/admin');
const tagRoutes = require('./routes/tags');
const brandRoutes = require('./routes/brand');
const productRoutes = require('./routes/product');
const reportRoutes = require('./routes/report');
const chatRoutes = require('./routes/chat');
const uploadRoutes = require('./routes/uploads');
const notifyRoutes =  require('./routes/notifications');
const prefRoutes = require('./routes/user-preferences');
const { authenticateJWT, isAdmin } = require('./middleware/auth');


app.use('/api/auth', authRoutes);
app.use('/api/profile', profileRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/tags', tagRoutes);
app.use('/api/brand', brandRoutes);
app.use('/api/products', productRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api/notifications', notifyRoutes);
app.use('/api/pref', prefRoutes);


// Connect to MongoDB
const PORT = process.env.PORT || 5000;

mongoose.connect(process.env.MONGODB_URL)
    .then(() => {
        console.log('Connected to MongoDB successfully');
        // Only start server after successful DB connection
        server.listen(PORT, () => {
            console.log(`Server is running on port ${PORT}`);
        });
    })
    .catch((err) => {
        console.error('MongoDB connection error:', err);
        process.exit(1); // Exit if unable to connect to database
    });

// Basic error handling
mongoose.connection.on('error', (err) => {
    console.error('MongoDB connection error:', err);
});

mongoose.connection.on('disconnected', () => {
    console.log('MongoDB disconnected');
});

process.on('SIGINT', async () => {
    try {
        await mongoose.connection.close();
        console.log('MongoDB connection closed through app termination');
        process.exit(0);
    } catch (err) {
        console.error('Error during MongoDB connection closure:', err);
        process.exit(1);
    }
});

app.get('/', (req, res) => {
    res.send('API is running');
});