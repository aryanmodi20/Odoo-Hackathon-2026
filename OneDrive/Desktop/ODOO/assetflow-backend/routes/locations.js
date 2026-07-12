const express = require("express");
const router = express.Router();

const { connectDB, sql } = require("../config/db");
const auth = require("../middleware/auth");


// ======================================
// GET ALL LOCATIONS
// ======================================
router.get("/", auth, async (req, res) => {

    try {

        const pool = await connectDB();

        const result = await pool.request().query(`
            SELECT *
            FROM Locations
            ORDER BY LocationName
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


// ======================================
// GET LOCATION BY ID
// ======================================
router.get("/:id", auth, async (req, res) => {

    try {

        const pool = await connectDB();

        const result = await pool.request()

            .input("LocationID", sql.Int, req.params.id)

            .query(`
                SELECT *
                FROM Locations
                WHERE LocationID=@LocationID
            `);

        if(result.recordset.length===0){

            return res.status(404).json({
                success:false,
                message:"Location not found"
            });

        }

        res.json({
            success:true,
            data:result.recordset[0]
        });

    } catch (err) {

        res.status(500).json({
            success:false,
            message:err.message
        });

    }

});


// ======================================
// CREATE LOCATION
// ======================================
router.post("/", auth, async (req, res) => {

    try {

        const {
            LocationName,
            FloorNo,
            Building,
            Status
        } = req.body;

        const pool = await connectDB();

        await pool.request()

            .input("LocationName", sql.VarChar, LocationName)
            .input("FloorNo", sql.VarChar, FloorNo)
            .input("Building", sql.VarChar, Building)
            .input("Status", sql.Bit, Status)

            .query(`
                INSERT INTO Locations
                (
                    LocationName,
                    FloorNo,
                    Building,
                    Status
                )
                VALUES
                (
                    @LocationName,
                    @FloorNo,
                    @Building,
                    @Status
                )
            `);

        res.json({
            success:true,
            message:"Location created successfully"
        });

    } catch (err) {

        res.status(500).json({
            success:false,
            message:err.message
        });

    }

});


// ======================================
// UPDATE LOCATION
// ======================================
router.put("/:id", auth, async (req, res) => {

    try {

        const {
            LocationName,
            FloorNo,
            Building,
            Status
        } = req.body;

        const pool = await connectDB();

        await pool.request()

            .input("LocationID", sql.Int, req.params.id)
            .input("LocationName", sql.VarChar, LocationName)
            .input("FloorNo", sql.VarChar, FloorNo)
            .input("Building", sql.VarChar, Building)
            .input("Status", sql.Bit, Status)

            .query(`
                UPDATE Locations
                SET
                    LocationName=@LocationName,
                    FloorNo=@FloorNo,
                    Building=@Building,
                    Status=@Status
                WHERE LocationID=@LocationID
            `);

        res.json({
            success:true,
            message:"Location updated successfully"
        });

    } catch (err) {

        res.status(500).json({
            success:false,
            message:err.message
        });

    }

});


// ======================================
// DELETE LOCATION (SOFT DELETE)
// ======================================
router.delete("/:id", auth, async (req, res) => {

    try {

        const pool = await connectDB();

        await pool.request()

            .input("LocationID", sql.Int, req.params.id)

            .query(`
                UPDATE Locations
                SET Status=0
                WHERE LocationID=@LocationID
            `);

        res.json({
            success:true,
            message:"Location deleted successfully"
        });

    } catch (err) {

        res.status(500).json({
            success:false,
            message:err.message
        });

    }

});

module.exports = router;