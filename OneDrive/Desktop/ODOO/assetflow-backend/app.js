const express = require("express");
const cors = require("cors");

const app = express();

// ======================
// Middleware
// ======================

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ======================
// Routes
// ======================

const authRoutes = require("./routes/auth");
const departmentRoutes = require("./routes/departments");
const userRoutes = require("./routes/users");
const categoryRoutes = require("./routes/categories");
const locationRoutes = require("./routes/locations");
const assetRoutes = require("./routes/assets");
const allocationRoutes = require("./routes/allocations");
const bookingRoutes = require("./routes/bookings");
const maintenanceRoutes = require("./routes/maintenance");
const auditRoutes = require("./routes/audits");

// ======================
// API Routes
// ======================

app.use("/api/auth", authRoutes);
app.use("/api/departments", departmentRoutes);
app.use("/api/users", userRoutes);
app.use("/api/categories", categoryRoutes);
app.use("/api/locations", locationRoutes);
app.use("/api/assets", assetRoutes);
app.use("/api/allocations", allocationRoutes);
app.use("/api/bookings", bookingRoutes);
app.use("/api/maintenance", maintenanceRoutes);
app.use("/api/audits", auditRoutes);

// ======================
// Health Check
// ======================

app.get("/", (req, res) => {
    res.status(200).json({
        success: true,
        message: "AssetFlow ERP Backend API is running successfully.",
        version: "1.0.0"
    });
});

// ======================
// 404 Handler
// ======================

app.use((req, res) => {
    res.status(404).json({
        success: false,
        message: "API endpoint not found."
    });
});

// ======================
// Global Error Handler
// ======================

app.use((err, req, res, next) => {
    console.error(err);

    res.status(err.status || 500).json({
        success: false,
        message: err.message || "Internal Server Error"
    });
});

module.exports = app;