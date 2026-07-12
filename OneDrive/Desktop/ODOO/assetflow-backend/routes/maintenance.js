const express = require("express");
const router = express.Router();

const { connectDB, sql } = require("../config/db");
const auth = require("../middleware/auth");

/*
====================================================
GET ALL MAINTENANCE REQUESTS
====================================================
*/

router.get("/", auth, async (req, res) => {

    try {

        const pool = await connectDB();

        const result = await pool.request().query(`

            SELECT

                M.MaintenanceID,

                A.AssetTag,

                A.AssetName,

                U.FirstName + ' ' + U.LastName AS RequestedBy,

                M.IssueTitle,

                M.IssueDescription,

                M.RequestDate,

                M.Priority,

                M.Status

            FROM MaintenanceRequests M

            INNER JOIN Assets A
                ON M.AssetID = A.AssetID

            INNER JOIN Users U
                ON M.RequestedBy = U.UserID

            ORDER BY M.RequestDate DESC

        `);

        res.json({
            success: true,
            count: result.recordset.length,
            data: result.recordset
        });

    } catch (err) {

        res.status(500).json({
            success: false,
            message: err.message
        });

    }

});


/*
====================================================
GET MAINTENANCE REQUEST BY ID
====================================================
*/

router.get("/:id", auth, async (req, res) => {

    try {

        const pool = await connectDB();

        const result = await pool.request()

            .input("MaintenanceID", sql.Int, req.params.id)

            .query(`

                SELECT

                    M.*,

                    A.AssetTag,

                    A.AssetName,

                    U.FirstName + ' ' + U.LastName AS RequestedByName

                FROM MaintenanceRequests M

                INNER JOIN Assets A
                    ON M.AssetID = A.AssetID

                INNER JOIN Users U
                    ON M.RequestedBy = U.UserID

                WHERE M.MaintenanceID = @MaintenanceID

            `);

        if (result.recordset.length === 0) {

            return res.status(404).json({
                success: false,
                message: "Maintenance request not found"
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

/*
====================================================
CREATE MAINTENANCE REQUEST
POST : /api/maintenance
====================================================
*/

router.post("/", auth, async (req, res) => {

    try {

        const {
            AssetID,
            IssueTitle,
            IssueDescription,
            Priority
        } = req.body;

        const pool = await connectDB();

        // Check Asset

        const asset = await pool.request()
            .input("AssetID", sql.Int, AssetID)
            .query(`
                SELECT AssetID
                FROM Assets
                WHERE AssetID=@AssetID
            `);

        if(asset.recordset.length===0){

            return res.status(404).json({
                success:false,
                message:"Asset not found"
            });

        }

        // Create Request

        await pool.request()

            .input("AssetID",sql.Int,AssetID)
            .input("IssueTitle",sql.VarChar,IssueTitle)
            .input("IssueDescription",sql.VarChar,IssueDescription)
            .input("Priority",sql.VarChar,Priority)
            .input("RequestedBy",sql.Int,req.user.UserID)

            .query(`

                INSERT INTO MaintenanceRequests
                (
                    AssetID,
                    IssueTitle,
                    IssueDescription,
                    RequestDate,
                    Priority,
                    Status,
                    RequestedBy
                )

                VALUES
                (
                    @AssetID,
                    @IssueTitle,
                    @IssueDescription,
                    GETDATE(),
                    @Priority,
                    'Pending',
                    @RequestedBy
                )

            `);

        // Update Asset Status (Under Maintenance)

        await pool.request()

            .input("AssetID",sql.Int,AssetID)

            .query(`
                UPDATE Assets
                SET StatusID=3
                WHERE AssetID=@AssetID
            `);

        res.json({

            success:true,

            message:"Maintenance request created"

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
APPROVE MAINTENANCE
====================================================
*/

router.put("/approve/:id", auth, async (req,res)=>{

    try{

        const pool=await connectDB();

        await pool.request()

            .input("MaintenanceID",sql.Int,req.params.id)

            .query(`

                UPDATE MaintenanceRequests

                SET Status='Approved'

                WHERE MaintenanceID=@MaintenanceID

            `);

        res.json({

            success:true,

            message:"Maintenance approved"

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
REJECT MAINTENANCE
====================================================
*/

router.put("/reject/:id", auth, async (req,res)=>{

    try{

        const pool=await connectDB();

        const request=await pool.request()

            .input("MaintenanceID",sql.Int,req.params.id)

            .query(`

                SELECT AssetID

                FROM MaintenanceRequests

                WHERE MaintenanceID=@MaintenanceID

            `);

        if(request.recordset.length===0){

            return res.status(404).json({

                success:false,

                message:"Request not found"

            });

        }

        const assetID=request.recordset[0].AssetID;

        await pool.request()

            .input("MaintenanceID",sql.Int,req.params.id)

            .query(`

                UPDATE MaintenanceRequests

                SET Status='Rejected'

                WHERE MaintenanceID=@MaintenanceID

            `);

        await pool.request()

            .input("AssetID",sql.Int,assetID)

            .query(`

                UPDATE Assets

                SET StatusID=1

                WHERE AssetID=@AssetID

            `);

        res.json({

            success:true,

            message:"Maintenance rejected"

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
COMPLETE MAINTENANCE
====================================================
*/

router.put("/complete/:id", auth, async (req,res)=>{

    try{

        const pool=await connectDB();

        const request=await pool.request()

            .input("MaintenanceID",sql.Int,req.params.id)

            .query(`

                SELECT AssetID

                FROM MaintenanceRequests

                WHERE MaintenanceID=@MaintenanceID

            `);

        if(request.recordset.length===0){

            return res.status(404).json({

                success:false,

                message:"Request not found"

            });

        }

        const assetID=request.recordset[0].AssetID;

        await pool.request()

            .input("MaintenanceID",sql.Int,req.params.id)

            .query(`

                UPDATE MaintenanceRequests

                SET

                    Status='Completed'

                WHERE MaintenanceID=@MaintenanceID

            `);

        await pool.request()

            .input("AssetID",sql.Int,assetID)

            .query(`

                UPDATE Assets

                SET StatusID=1

                WHERE AssetID=@AssetID

            `);

        res.json({

            success:true,

            message:"Maintenance completed"

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