const express = require("express");
const router = express.Router();

const { connectDB, sql } = require("../config/db");
const auth = require("../middleware/auth");

/*
====================================================
GET ALL AUDITS
====================================================
*/

router.get("/", auth, async (req, res) => {

    try {

        const pool = await connectDB();

        const result = await pool.request().query(`

            SELECT

                A.AuditID,
                AST.AssetTag,
                AST.AssetName,
                U.FirstName + ' ' + U.LastName AS Auditor,
                A.AuditDate,
                A.LocationFound,
                A.AssetCondition,
                A.Status,
                A.Remarks

            FROM AssetAudits A

            INNER JOIN Assets AST
                ON A.AssetID = AST.AssetID

            INNER JOIN Users U
                ON A.AuditorID = U.UserID

            ORDER BY A.AuditDate DESC

        `);

        res.json({

            success: true,
            count: result.recordset.length,
            data: result.recordset

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
GET AUDIT BY ID
====================================================
*/

router.get("/:id", auth, async (req,res)=>{

    try{

        const pool=await connectDB();

        const result=await pool.request()

            .input("AuditID",sql.Int,req.params.id)

            .query(`

                SELECT *

                FROM AssetAudits

                WHERE AuditID=@AuditID

            `);

        if(result.recordset.length===0){

            return res.status(404).json({

                success:false,
                message:"Audit not found"

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
CREATE AUDIT
====================================================
*/

router.post("/", auth, async (req,res)=>{

    try{

        const{

            AssetID,
            LocationFound,
            AssetCondition,
            Remarks

        }=req.body;

        const pool=await connectDB();

        await pool.request()

            .input("AssetID",sql.Int,AssetID)
            .input("AuditorID",sql.Int,req.user.UserID)
            .input("LocationFound",sql.VarChar,LocationFound)
            .input("AssetCondition",sql.VarChar,AssetCondition)
            .input("Remarks",sql.VarChar,Remarks)

            .query(`

                INSERT INTO AssetAudits
                (

                    AssetID,
                    AuditorID,
                    AuditDate,
                    LocationFound,
                    AssetCondition,
                    Status,
                    Remarks

                )

                VALUES
                (

                    @AssetID,
                    @AuditorID,
                    GETDATE(),
                    @LocationFound,
                    @AssetCondition,
                    'Verified',
                    @Remarks

                )

            `);

        res.json({

            success:true,

            message:"Audit completed successfully"

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
UPDATE AUDIT
====================================================
*/

router.put("/:id", auth, async (req,res)=>{

    try{

        const{

            LocationFound,
            AssetCondition,
            Status,
            Remarks

        }=req.body;

        const pool=await connectDB();

        await pool.request()

            .input("AuditID",sql.Int,req.params.id)
            .input("LocationFound",sql.VarChar,LocationFound)
            .input("AssetCondition",sql.VarChar,AssetCondition)
            .input("Status",sql.VarChar,Status)
            .input("Remarks",sql.VarChar,Remarks)

            .query(`

                UPDATE AssetAudits

                SET

                    LocationFound=@LocationFound,
                    AssetCondition=@AssetCondition,
                    Status=@Status,
                    Remarks=@Remarks

                WHERE AuditID=@AuditID

            `);

        res.json({

            success:true,

            message:"Audit updated successfully"

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
DELETE AUDIT
====================================================
*/

router.delete("/:id", auth, async (req,res)=>{

    try{

        const pool=await connectDB();

        await pool.request()

            .input("AuditID",sql.Int,req.params.id)

            .query(`

                DELETE

                FROM AssetAudits

                WHERE AuditID=@AuditID

            `);

        res.json({

            success:true,

            message:"Audit deleted successfully"

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