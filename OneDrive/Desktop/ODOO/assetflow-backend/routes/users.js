const express = require("express");
const router = express.Router();

const bcrypt = require("bcrypt");
const auth = require("../middleware/auth");
const { connectDB, sql } = require("../config/db");


// =========================
// GET ALL USERS
// =========================
router.get("/", auth, async (req, res) => {

    try {

        const pool = await connectDB();

        const result = await pool.request().query(`
            SELECT
                U.UserID,
                U.FirstName,
                U.LastName,
                U.Email,
                U.Phone,
                U.Status,
                D.DepartmentName,
                R.RoleName
            FROM Users U
            INNER JOIN Departments D
                ON U.DepartmentID = D.DepartmentID
            INNER JOIN Roles R
                ON U.RoleID = R.RoleID
            ORDER BY U.FirstName
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


// =========================
// GET USER BY ID
// =========================
router.get("/:id", auth, async (req, res) => {

    try {

        const pool = await connectDB();

        const result = await pool.request()
            .input("UserID", sql.Int, req.params.id)
            .query(`
                SELECT *
                FROM Users
                WHERE UserID=@UserID
            `);

        if(result.recordset.length===0){

            return res.status(404).json({
                success:false,
                message:"User not found"
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


// =========================
// CREATE USER
// =========================
router.post("/", auth, async (req, res) => {

    try {

        const {
            FirstName,
            LastName,
            Email,
            Password,
            DepartmentID,
            RoleID,
            Phone
        } = req.body;

        const passwordHash = await bcrypt.hash(Password,10);

        const pool = await connectDB();

        await pool.request()

            .input("FirstName",sql.VarChar,FirstName)
            .input("LastName",sql.VarChar,LastName)
            .input("Email",sql.VarChar,Email)
            .input("PasswordHash",sql.VarChar,passwordHash)
            .input("DepartmentID",sql.Int,DepartmentID)
            .input("RoleID",sql.Int,RoleID)
            .input("Phone",sql.VarChar,Phone)

            .query(`
                INSERT INTO Users
                (
                    FirstName,
                    LastName,
                    Email,
                    PasswordHash,
                    DepartmentID,
                    RoleID,
                    Phone
                )
                VALUES
                (
                    @FirstName,
                    @LastName,
                    @Email,
                    @PasswordHash,
                    @DepartmentID,
                    @RoleID,
                    @Phone
                )
            `);

        res.json({
            success:true,
            message:"User created successfully"
        });

    } catch (err) {

        res.status(500).json({
            success:false,
            message:err.message
        });

    }

});


// =========================
// UPDATE USER
// =========================
router.put("/:id", auth, async (req, res) => {

    try {

        const {
            FirstName,
            LastName,
            Email,
            DepartmentID,
            RoleID,
            Phone,
            Status
        } = req.body;

        const pool = await connectDB();

        await pool.request()

            .input("UserID",sql.Int,req.params.id)
            .input("FirstName",sql.VarChar,FirstName)
            .input("LastName",sql.VarChar,LastName)
            .input("Email",sql.VarChar,Email)
            .input("DepartmentID",sql.Int,DepartmentID)
            .input("RoleID",sql.Int,RoleID)
            .input("Phone",sql.VarChar,Phone)
            .input("Status",sql.Bit,Status)

            .query(`
                UPDATE Users
                SET
                    FirstName=@FirstName,
                    LastName=@LastName,
                    Email=@Email,
                    DepartmentID=@DepartmentID,
                    RoleID=@RoleID,
                    Phone=@Phone,
                    Status=@Status
                WHERE UserID=@UserID
            `);

        res.json({
            success:true,
            message:"User updated successfully"
        });

    } catch (err) {

        res.status(500).json({
            success:false,
            message:err.message
        });

    }

});


// =========================
// DELETE (SOFT DELETE)
// =========================
router.delete("/:id", auth, async (req, res) => {

    try {

        const pool = await connectDB();

        await pool.request()
            .input("UserID",sql.Int,req.params.id)
            .query(`
                UPDATE Users
                SET Status=0
                WHERE UserID=@UserID
            `);

        res.json({
            success:true,
            message:"User deactivated successfully"
        });

    } catch (err) {

        res.status(500).json({
            success:false,
            message:err.message
        });

    }

});

module.exports = router;