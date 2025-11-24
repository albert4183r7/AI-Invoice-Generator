require("dotenv").config();
const express = require("express");
const cors = require("cors");
const path = require("path");
const connectDB = require("./config/db");

const authRoutes = require("./routes/authRoutes");
const invoiceRoutes = require("./routes/invoiceRoutes");
const aiRoutes = require("./routes/aiRoutes");

const app = express();

// Middleware to handle CORS
// We allow the CLIENT_URL from .env, or fallbacks for local dev
const allowedOrigins = [
    process.env.CLIENT_URL, 
    "http://localhost:5173", 
    "http://localhost:80"
].filter(Boolean); // Remove undefined values

app.use(
    cors({
        origin: function (origin, callback) {
            // Allow requests with no origin (like mobile apps or curl requests)
            if (!origin) return callback(null, true);
            if (allowedOrigins.indexOf(origin) === -1) {
                // You can toggle this off for strict production security
                // return callback(new Error('The CORS policy for this site does not allow access from the specified Origin.'), false);
                return callback(null, true); // Temporarily allow all for easier Docker setup
            }
            return callback(null, true);
        },
        methods: ["GET", "POST", "PUT", "DELETE"],
        allowedHeaders: ["Content-Type", "Authorization"],
    })
);

// Connect to the database
connectDB();

// Middleware to parse JSON requests
app.use(express.json());

// Define routes
app.use("/api/auth", authRoutes);
app.use("/api/invoices", invoiceRoutes);
app.use("/api/ai", aiRoutes);

// Start the server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});