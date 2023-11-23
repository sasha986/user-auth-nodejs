const express = require('express');
const dotenv = require('dotenv');
const morgan = require('morgan');
const path = require('path');
const cookieParser = require('cookie-parser');
const mongoSanitize = require('express-mongo-sanitize');
const rateLimit = require('express-rate-limit');
const cors = require('cors');

const errorHandler = require('./middleware/error');
const connectDB = require('./config/db');

// Load env vars
dotenv.config({path: './config/config.env'});

// Route files
const auth = require('./routes/auth');

const app = express();

// Connect to database
connectDB();

// Body parser
app.use(express.json());
// Cookie parser
app.use(cookieParser());
// Sanitize data
app.use(mongoSanitize());
// Request rate limit
const limiter = rateLimit({
    windowMs: 10 * 60 * 1000, // 10 mins
    max: 200
});
app.use(limiter);
// Enable CORS
app.use(cors());

// Dev logging middleware
if(process.env.NODE_ENV === 'development') {
    app.use(morgan('dev'));
}

// Mount routers
app.use("/", express.static(path.join(__dirname, 'public')));
app.use('/api/v1/auth/', auth);

app.use(errorHandler);

const PORT = process.env.PORT || 5000;

const server = app.listen(PORT, () => {
    console.log(`Server is running in ${process.env.NODE_ENV} mode on port ${PORT}`);
});

const io = require('./socket').init(server);
io.on('connection', (socket) => {
    console.log('Client connected');
});

// Handle promise rejections
process.on('unhandledRejection', (err, promise) => {
    console.log(`Error: ${err.message}`);
    server.close(() => process.exit(1));
});
