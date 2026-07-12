const express = require("express");
const router = express.Router();

const { connectDB, sql } = require("../config/db");
const auth = require("../middleware/auth");

/*
====================================================
GET ALL BOOKINGS
====================================================
*/

router.get("/", auth, async (req, res) => {

    try {

        const pool = await connectDB();

        const result = await pool.request().query(`

            SELECT

                B.BookingID,

                A.AssetTag,

                A.AssetName,

                U.FirstName + ' ' + U.LastName AS Employee,

                B.BookingDate,

                B.StartTime,

                B.EndTime,

                B.Purpose,

                B.Status

            FROM Bookings B

            INNER JOIN Assets A
                ON B.AssetID=A.AssetID

            INNER JOIN Users U
                ON B.UserID=U.UserID

            ORDER BY B.BookingDate DESC

        `);

        res.json({

            success:true,

            count:result.recordset.length,

            data:result.recordset

        });

    }

    catch(err){

        res.status(500).json({

            success:false,

            message:err.message

        });

    }

});


/*
====================================================
GET BOOKING BY ID
====================================================
*/

router.get("/:id", auth, async (req,res)=>{

    try{

        const pool = await connectDB();

        const result = await pool.request()

            .input("BookingID",sql.Int,req.params.id)

            .query(`

                SELECT *

                FROM Bookings

                WHERE BookingID=@BookingID

            `);

        if(result.recordset.length===0){

            return res.status(404).json({

                success:false,

                message:"Booking not found"

            });

        }

        res.json({

            success:true,

            data:result.recordset[0]

        });

    }

    catch(err){

        res.status(500).json({

            success:false,

            message:err.message

        });

    }

});

/*
====================================================
CREATE BOOKING
POST : /api/bookings
====================================================
*/

router.post("/", auth, async (req, res) => {

    try {

        const {

            AssetID,
            UserID,
            BookingDate,
            StartTime,
            EndTime,
            Purpose

        } = req.body;

        const pool = await connectDB();

        // Check Asset

        const asset = await pool.request()

            .input("AssetID", sql.Int, AssetID)

            .query(`
                SELECT IsBookable
                FROM Assets
                WHERE AssetID=@AssetID
            `);

        if(asset.recordset.length===0){

            return res.status(404).json({
                success:false,
                message:"Asset not found"
            });

        }

        if(asset.recordset[0].IsBookable===false){

            return res.status(400).json({
                success:false,
                message:"Asset cannot be booked"
            });

        }

        // Check Conflict

        const conflict = await pool.request()

            .input("AssetID",sql.Int,AssetID)
            .input("BookingDate",sql.Date,BookingDate)
            .input("StartTime",sql.Time,StartTime)
            .input("EndTime",sql.Time,EndTime)

            .query(`

                SELECT *

                FROM Bookings

                WHERE AssetID=@AssetID

                AND BookingDate=@BookingDate

                AND Status='Booked'

                AND

                (

                    (@StartTime BETWEEN StartTime AND EndTime)

                    OR

                    (@EndTime BETWEEN StartTime AND EndTime)

                    OR

                    (StartTime BETWEEN @StartTime AND @EndTime)

                )

            `);

        if(conflict.recordset.length>0){

            return res.status(400).json({

                success:false,

                message:"Booking conflict detected"

            });

        }

        await pool.request()

            .input("AssetID",sql.Int,AssetID)
            .input("UserID",sql.Int,UserID)
            .input("BookingDate",sql.Date,BookingDate)
            .input("StartTime",sql.Time,StartTime)
            .input("EndTime",sql.Time,EndTime)
            .input("Purpose",sql.VarChar,Purpose)

            .query(`

                INSERT INTO Bookings
                (

                    AssetID,
                    UserID,
                    BookingDate,
                    StartTime,
                    EndTime,
                    Purpose,
                    Status

                )

                VALUES
                (

                    @AssetID,
                    @UserID,
                    @BookingDate,
                    @StartTime,
                    @EndTime,
                    @Purpose,
                    'Booked'

                )

            `);

        res.json({

            success:true,

            message:"Booking created successfully"

        });

    }

    catch(err){

        res.status(500).json({

            success:false,

            message:err.message

        });

    }

});

/*
====================================================
UPDATE BOOKING
PUT : /api/bookings/:id
====================================================
*/

router.put("/:id", auth, async (req,res)=>{

    try{

        const{

            BookingDate,
            StartTime,
            EndTime,
            Purpose

        }=req.body;

        const pool=await connectDB();

        await pool.request()

            .input("BookingID",sql.Int,req.params.id)
            .input("BookingDate",sql.Date,BookingDate)
            .input("StartTime",sql.Time,StartTime)
            .input("EndTime",sql.Time,EndTime)
            .input("Purpose",sql.VarChar,Purpose)

            .query(`

                UPDATE Bookings

                SET

                    BookingDate=@BookingDate,

                    StartTime=@StartTime,

                    EndTime=@EndTime,

                    Purpose=@Purpose

                WHERE BookingID=@BookingID

            `);

        res.json({

            success:true,

            message:"Booking updated successfully"

        });

    }

    catch(err){

        res.status(500).json({

            success:false,

            message:err.message

        });

    }

});

/*
====================================================
CANCEL BOOKING
PUT : /api/bookings/cancel/:id
====================================================
*/

router.put("/cancel/:id", auth, async (req,res)=>{

    try{

        const pool=await connectDB();

        await pool.request()

            .input("BookingID",sql.Int,req.params.id)

            .query(`

                UPDATE Bookings

                SET Status='Cancelled'

                WHERE BookingID=@BookingID

            `);

        res.json({

            success:true,

            message:"Booking cancelled successfully"

        });

    }

    catch(err){

        res.status(500).json({

            success:false,

            message:err.message

        });

    }

});

/*
====================================================
GET BOOKINGS OF ASSET
GET : /api/bookings/asset/:id
====================================================
*/

router.get("/asset/:id", auth, async (req,res)=>{

    try{

        const pool=await connectDB();

        const result=await pool.request()

            .input("AssetID",sql.Int,req.params.id)

            .query(`

                SELECT *

                FROM Bookings

                WHERE AssetID=@AssetID

                ORDER BY BookingDate DESC

            `);

        res.json({

            success:true,

            count:result.recordset.length,

            data:result.recordset

        });

    }

    catch(err){

        res.status(500).json({

            success:false,

            message:err.message

        });

    }

});



module.exports = router;