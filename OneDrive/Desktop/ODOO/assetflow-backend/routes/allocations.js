const express = require("express");
const router = express.Router();

const { connectDB, sql } = require("../config/db");
const auth = require("../middleware/auth");

/*
====================================================
GET ALL ALLOCATIONS
GET : /api/allocations
====================================================
*/

router.get("/", auth, async (req, res) => {

    try {

        const pool = await connectDB();

        const result = await pool.request().query(`

            SELECT

                AA.AllocationID,

                A.AssetTag,

                A.AssetName,

                U.FirstName + ' ' + U.LastName AS Employee,

                D.DepartmentName,

                AA.AllocatedDate,

                AA.ExpectedReturnDate,

                AA.ActualReturnDate,

                AA.Status,

                AA.Remarks

            FROM AssetAllocations AA

            INNER JOIN Assets A
                ON AA.AssetID=A.AssetID

            INNER JOIN Users U
                ON AA.UserID=U.UserID

            INNER JOIN Departments D
                ON AA.DepartmentID=D.DepartmentID

            ORDER BY AA.AllocatedDate DESC

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
GET ALLOCATION BY ID
GET : /api/allocations/:id
====================================================
*/

router.get("/:id", auth, async (req,res)=>{

    try{

        const pool = await connectDB();

        const result = await pool.request()

            .input("AllocationID",sql.Int,req.params.id)

            .query(`

                SELECT

                    AA.*,

                    A.AssetTag,

                    A.AssetName,

                    U.FirstName + ' ' + U.LastName AS Employee,

                    D.DepartmentName

                FROM AssetAllocations AA

                INNER JOIN Assets A
                    ON AA.AssetID=A.AssetID

                INNER JOIN Users U
                    ON AA.UserID=U.UserID

                INNER JOIN Departments D
                    ON AA.DepartmentID=D.DepartmentID

                WHERE AllocationID=@AllocationID

            `);

        if(result.recordset.length===0){

            return res.status(404).json({

                success:false,

                message:"Allocation not found"

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
ALLOCATE ASSET
POST : /api/allocations
====================================================
*/

router.post("/", auth, async (req, res) => {

    try {

        const {
            AssetID,
            UserID,
            DepartmentID,
            ExpectedReturnDate,
            Remarks
        } = req.body;

        const pool = await connectDB();

        // Check Asset Exists
        const asset = await pool.request()

            .input("AssetID", sql.Int, AssetID)

            .query(`
                SELECT StatusID
                FROM Assets
                WHERE AssetID=@AssetID
            `);

        if (asset.recordset.length === 0) {

            return res.status(404).json({
                success: false,
                message: "Asset not found"
            });

        }

        /*
            StatusID

            1 = Available
            2 = Allocated
        */

        if (asset.recordset[0].StatusID != 1) {

            return res.status(400).json({
                success: false,
                message: "Asset is not available"
            });

        }

        // Insert Allocation
        await pool.request()

            .input("AssetID", sql.Int, AssetID)
            .input("UserID", sql.Int, UserID)
            .input("DepartmentID", sql.Int, DepartmentID)
            .input("ExpectedReturnDate", sql.Date, ExpectedReturnDate)
            .input("Remarks", sql.VarChar, Remarks)
            .input("CreatedBy", sql.Int, req.user.UserID)

            .query(`

                INSERT INTO AssetAllocations
                (
                    AssetID,
                    UserID,
                    DepartmentID,
                    AllocatedDate,
                    ExpectedReturnDate,
                    Status,
                    Remarks,
                    CreatedBy,
                    CreatedDate
                )

                VALUES
                (
                    @AssetID,
                    @UserID,
                    @DepartmentID,
                    GETDATE(),
                    @ExpectedReturnDate,
                    'Allocated',
                    @Remarks,
                    @CreatedBy,
                    GETDATE()
                )

            `);

        // Update Asset Status
        await pool.request()

            .input("AssetID", sql.Int, AssetID)

            .query(`

                UPDATE Assets
                SET StatusID = 2
                WHERE AssetID=@AssetID

            `);

        res.json({

            success: true,

            message: "Asset allocated successfully"

        });

    }

    catch (err) {

        res.status(500).json({

            success: false,

            message: err.message

        });

    }

});

/*
====================================================
RETURN ASSET
PUT : /api/allocations/return/:id
====================================================
*/

router.put("/return/:id", auth, async (req, res) => {

    try {

        const pool = await connectDB();

        // Get Allocation
        const allocation = await pool.request()

            .input("AllocationID", sql.Int, req.params.id)

            .query(`
                SELECT AssetID
                FROM AssetAllocations
                WHERE AllocationID=@AllocationID
            `);

        if (allocation.recordset.length === 0) {

            return res.status(404).json({
                success: false,
                message: "Allocation not found"
            });

        }

        const assetID = allocation.recordset[0].AssetID;

        // Update Allocation

        await pool.request()

            .input("AllocationID", sql.Int, req.params.id)

            .query(`
                UPDATE AssetAllocations
                SET
                    ActualReturnDate = GETDATE(),
                    Status = 'Returned'
                WHERE AllocationID=@AllocationID
            `);

        // Update Asset Status

        await pool.request()

            .input("AssetID", sql.Int, assetID)

            .query(`
                UPDATE Assets
                SET StatusID = 1
                WHERE AssetID=@AssetID
            `);

        res.json({

            success: true,

            message: "Asset returned successfully"

        });

    }

    catch (err) {

        res.status(500).json({

            success: false,

            message: err.message

        });

    }

});

/*
====================================================
TRANSFER ASSET
PUT : /api/allocations/transfer/:id
====================================================
*/

router.put("/transfer/:id", auth, async (req, res) => {

    try {

        const {

            UserID,

            DepartmentID,

            ExpectedReturnDate,

            Remarks

        } = req.body;

        const pool = await connectDB();

        // Existing Allocation

        const oldAllocation = await pool.request()

            .input("AllocationID", sql.Int, req.params.id)

            .query(`
                SELECT AssetID
                FROM AssetAllocations
                WHERE AllocationID=@AllocationID
            `);

        if (oldAllocation.recordset.length === 0) {

            return res.status(404).json({

                success: false,

                message: "Allocation not found"

            });

        }

        const assetID = oldAllocation.recordset[0].AssetID;

        // Close Current Allocation

        await pool.request()

            .input("AllocationID", sql.Int, req.params.id)

            .query(`
                UPDATE AssetAllocations
                SET
                    ActualReturnDate = GETDATE(),
                    Status='Transferred'
                WHERE AllocationID=@AllocationID
            `);

        // New Allocation

        await pool.request()

            .input("AssetID", sql.Int, assetID)
            .input("UserID", sql.Int, UserID)
            .input("DepartmentID", sql.Int, DepartmentID)
            .input("ExpectedReturnDate", sql.Date, ExpectedReturnDate)
            .input("Remarks", sql.VarChar, Remarks)
            .input("CreatedBy", sql.Int, req.user.UserID)

            .query(`

                INSERT INTO AssetAllocations
                (
                    AssetID,
                    UserID,
                    DepartmentID,
                    AllocatedDate,
                    ExpectedReturnDate,
                    Status,
                    Remarks,
                    CreatedBy,
                    CreatedDate
                )

                VALUES
                (
                    @AssetID,
                    @UserID,
                    @DepartmentID,
                    GETDATE(),
                    @ExpectedReturnDate,
                    'Allocated',
                    @Remarks,
                    @CreatedBy,
                    GETDATE()
                )

            `);

        res.json({

            success: true,

            message: "Asset transferred successfully"

        });

    }

    catch (err) {

        res.status(500).json({

            success: false,

            message: err.message

        });

    }

});

/*
====================================================
ALLOCATION HISTORY
GET : /api/allocations/asset/:id
====================================================
*/

router.get("/asset/:id", auth, async (req, res) => {

    try {

        const pool = await connectDB();

        const result = await pool.request()

            .input("AssetID", sql.Int, req.params.id)

            .query(`

                SELECT

                    AA.*,

                    U.FirstName + ' ' + U.LastName AS Employee,

                    D.DepartmentName

                FROM AssetAllocations AA

                INNER JOIN Users U
                    ON AA.UserID=U.UserID

                INNER JOIN Departments D
                    ON AA.DepartmentID=D.DepartmentID

                WHERE AA.AssetID=@AssetID

                ORDER BY AA.AllocatedDate DESC

            `);

        res.json({

            success: true,

            count: result.recordset.length,

            data: result.recordset

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