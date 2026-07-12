const express = require("express");
const router = express.Router();

const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

const { connectDB, sql } = require("../config/db");

require("dotenv").config();


// LOGIN
router.post("/login", async (req, res) => {

    try {

        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({
                success: false,
                message: "Email and Password required"
            });
        }

        const pool = await connectDB();

        const result = await pool.request()
            .input("Email", sql.VarChar, email)
            .query(`
                SELECT
                    U.UserID,
                    U.FirstName,
                    U.LastName,
                    U.Email,
                    U.PasswordHash,
                    U.RoleID,
                    R.RoleName
                FROM Users U
                INNER JOIN Roles R
                ON U.RoleID = R.RoleID
                WHERE U.Email=@Email
                AND U.Status=1
            `);

        if (result.recordset.length === 0) {

            return res.status(404).json({
                success: false,
                message: "User not found"
            });

        }

        const user = result.recordset[0];

        const validPassword = await bcrypt.compare(
            password,
            user.PasswordHash
        );

        if (!validPassword) {

            return res.status(401).json({
                success: false,
                message: "Invalid Password"
            });

        }

        const token = jwt.sign({

            UserID: user.UserID,
            RoleID: user.RoleID,
            Role: user.RoleName

        }, process.env.JWT_SECRET, {

            expiresIn: "1d"

        });

        delete user.PasswordHash;

        res.json({

            success: true,
            token,
            user

        });

    }

    catch (err) {

        res.status(500).json({

            success: false,
            message: err.message

        });

    }

});

module.exports = router;