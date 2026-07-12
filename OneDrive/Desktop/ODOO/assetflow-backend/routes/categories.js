const express = require("express");
const router = express.Router();

const { connectDB, sql } = require("../config/db");
const auth = require("../middleware/auth");


// =======================================
// GET ALL CATEGORIES
// =======================================
router.get("/", auth, async (req, res) => {

    try {

        const pool = await connectDB();

        const result = await pool.request().query(`
            SELECT *
            FROM AssetCategories
            ORDER BY CategoryName
        `);

        res.json({
            success: true,
            data: result.recordset
        });

    } catch (err) {

        res.status(500).json({
            success: false,
            message: err.message
        });

    }

});


// =======================================
// GET CATEGORY BY ID
// =======================================
router.get("/:id", auth, async (req, res) => {

    try {

        const pool = await connectDB();

        const result = await pool.request()

            .input("CategoryID", sql.Int, req.params.id)

            .query(`
                SELECT *
                FROM AssetCategories
                WHERE CategoryID=@CategoryID
            `);

        if (result.recordset.length === 0) {

            return res.status(404).json({
                success: false,
                message: "Category not found"
            });

        }

        res.json({
            success: true,
            data: result.recordset[0]
        });

    } catch (err) {

        res.status(500).json({
            success: false,
            message: err.message
        });

    }

});


// =======================================
// CREATE CATEGORY
// =======================================
router.post("/", auth, async (req, res) => {

    try {

        const {
            CategoryName,
            WarrantyMonths,
            Status
        } = req.body;

        const pool = await connectDB();

        await pool.request()

            .input("CategoryName", sql.VarChar, CategoryName)
            .input("WarrantyMonths", sql.Int, WarrantyMonths)
            .input("Status", sql.Bit, Status)

            .query(`
                INSERT INTO AssetCategories
                (
                    CategoryName,
                    WarrantyMonths,
                    Status
                )
                VALUES
                (
                    @CategoryName,
                    @WarrantyMonths,
                    @Status
                )
            `);

        res.json({
            success: true,
            message: "Category created successfully"
        });

    } catch (err) {

        res.status(500).json({
            success: false,
            message: err.message
        });

    }

});


// =======================================
// UPDATE CATEGORY
// =======================================
router.put("/:id", auth, async (req, res) => {

    try {

        const {
            CategoryName,
            WarrantyMonths,
            Status
        } = req.body;

        const pool = await connectDB();

        await pool.request()

            .input("CategoryID", sql.Int, req.params.id)
            .input("CategoryName", sql.VarChar, CategoryName)
            .input("WarrantyMonths", sql.Int, WarrantyMonths)
            .input("Status", sql.Bit, Status)

            .query(`
                UPDATE AssetCategories
                SET
                    CategoryName=@CategoryName,
                    WarrantyMonths=@WarrantyMonths,
                    Status=@Status
                WHERE CategoryID=@CategoryID
            `);

        res.json({
            success: true,
            message: "Category updated successfully"
        });

    } catch (err) {

        res.status(500).json({
            success: false,
            message: err.message
        });

    }

});


// =======================================
// DELETE CATEGORY (SOFT DELETE)
// =======================================
router.delete("/:id", auth, async (req, res) => {

    try {

        const pool = await connectDB();

        await pool.request()

            .input("CategoryID", sql.Int, req.params.id)

            .query(`
                UPDATE AssetCategories
                SET Status = 0
                WHERE CategoryID=@CategoryID
            `);

        res.json({
            success: true,
            message: "Category deleted successfully"
        });

    } catch (err) {

        res.status(500).json({
            success: false,
            message: err.message
        });

    }

});

module.exports = router;