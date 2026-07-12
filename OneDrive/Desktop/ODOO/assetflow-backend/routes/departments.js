const express = require("express");
const router = express.Router();

const { connectDB, sql } = require("../config/db");
const auth = require("../middleware/auth");


// ==========================
// GET ALL DEPARTMENTS
// ==========================
router.get("/", auth, async (req, res) => {

    try {

        const pool = await connectDB();

        const result = await pool.request().query(`
            SELECT
                D.DepartmentID,
                D.DepartmentName,
                D.Status,
                D.CreatedDate,
                U.FirstName + ' ' + U.LastName AS DepartmentHead
            FROM Departments D
            LEFT JOIN Users U
            ON D.DepartmentHeadID = U.UserID
            ORDER BY D.DepartmentName
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


// ==========================
// GET DEPARTMENT BY ID
// ==========================
router.get("/:id", auth, async (req, res) => {

    try {

        const pool = await connectDB();

        const result = await pool.request()
            .input("DepartmentID", sql.Int, req.params.id)
            .query(`
                SELECT *
                FROM Departments
                WHERE DepartmentID=@DepartmentID
            `);

        if (result.recordset.length === 0) {

            return res.status(404).json({
                success: false,
                message: "Department not found"
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


// ==========================
// CREATE DEPARTMENT
// ==========================
router.post("/", auth, async (req, res) => {

    try {

        const {
            DepartmentName,
            ParentDepartmentID,
            DepartmentHeadID
        } = req.body;

        const pool = await connectDB();

        await pool.request()
            .input("DepartmentName", sql.VarChar, DepartmentName)
            .input("ParentDepartmentID", sql.Int, ParentDepartmentID || null)
            .input("DepartmentHeadID", sql.Int, DepartmentHeadID || null)
            .query(`
                INSERT INTO Departments
                (
                    DepartmentName,
                    ParentDepartmentID,
                    DepartmentHeadID
                )
                VALUES
                (
                    @DepartmentName,
                    @ParentDepartmentID,
                    @DepartmentHeadID
                )
            `);

        res.json({
            success: true,
            message: "Department created successfully"
        });

    } catch (err) {

        res.status(500).json({
            success: false,
            message: err.message
        });

    }

});


// ==========================
// UPDATE DEPARTMENT
// ==========================
router.put("/:id", auth, async (req, res) => {

    try {

        const {
            DepartmentName,
            ParentDepartmentID,
            DepartmentHeadID,
            Status
        } = req.body;

        const pool = await connectDB();

        await pool.request()

            .input("DepartmentID", sql.Int, req.params.id)
            .input("DepartmentName", sql.VarChar, DepartmentName)
            .input("ParentDepartmentID", sql.Int, ParentDepartmentID || null)
            .input("DepartmentHeadID", sql.Int, DepartmentHeadID || null)
            .input("Status", sql.Bit, Status)

            .query(`
                UPDATE Departments
                SET
                    DepartmentName=@DepartmentName,
                    ParentDepartmentID=@ParentDepartmentID,
                    DepartmentHeadID=@DepartmentHeadID,
                    Status=@Status
                WHERE DepartmentID=@DepartmentID
            `);

        res.json({
            success: true,
            message: "Department updated successfully"
        });

    } catch (err) {

        res.status(500).json({
            success: false,
            message: err.message
        });

    }

});


// ==========================
// DELETE (SOFT DELETE)
// ==========================
router.delete("/:id", auth, async (req, res) => {

    try {

        const pool = await connectDB();

        await pool.request()

            .input("DepartmentID", sql.Int, req.params.id)

            .query(`
                UPDATE Departments
                SET Status=0
                WHERE DepartmentID=@DepartmentID
            `);

        res.json({
            success: true,
            message: "Department deactivated successfully"
        });

    } catch (err) {

        res.status(500).json({
            success: false,
            message: err.message
        });

    }

});

module.exports = router;