const express = require("express");
const router = express.Router();

const { connectDB, sql } = require("../config/db");
const auth = require("../middleware/auth");

/*
==================================================
GET ALL ASSETS
GET : /api/assets
==================================================
*/

router.get("/", auth, async (req, res) => {

    try {

        const pool = await connectDB();

        const result = await pool.request().query(`
            SELECT
                A.AssetID,
                A.AssetTag,
                A.AssetName,
                A.SerialNumber,
                A.ModelNumber,
                A.Manufacturer,
                A.AcquisitionDate,
                A.AcquisitionCost,
                A.WarrantyExpiryDate,
                A.IsBookable,
                A.Description,

                AC.CategoryName,

                D.DepartmentName,

                L.LocationName,

                S.StatusName,

                C.ConditionName,

                U.FirstName + ' ' + U.LastName AS CreatedBy

            FROM Assets A

            INNER JOIN AssetCategories AC
                ON A.CategoryID = AC.CategoryID

            INNER JOIN Departments D
                ON A.DepartmentID = D.DepartmentID

            INNER JOIN Locations L
                ON A.LocationID = L.LocationID

            INNER JOIN AssetStatus S
                ON A.StatusID = S.StatusID

            INNER JOIN ConditionMaster C
                ON A.ConditionID = C.ConditionID

            INNER JOIN Users U
                ON A.CreatedBy = U.UserID

            ORDER BY A.AssetID DESC
        `);

        res.status(200).json({

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
==================================================
GET ASSET BY ID
GET : /api/assets/:id
==================================================
*/

router.get("/:id", auth, async (req, res) => {

    try {

        const pool = await connectDB();

        const result = await pool.request()

            .input("AssetID", sql.Int, req.params.id)

            .query(`

                SELECT

                    A.*,

                    AC.CategoryName,

                    D.DepartmentName,

                    L.LocationName,

                    S.StatusName,

                    C.ConditionName,

                    U.FirstName + ' ' + U.LastName AS CreatedBy

                FROM Assets A

                INNER JOIN AssetCategories AC
                    ON A.CategoryID = AC.CategoryID

                INNER JOIN Departments D
                    ON A.DepartmentID = D.DepartmentID

                INNER JOIN Locations L
                    ON A.LocationID = L.LocationID

                INNER JOIN AssetStatus S
                    ON A.StatusID = S.StatusID

                INNER JOIN ConditionMaster C
                    ON A.ConditionID = C.ConditionID

                INNER JOIN Users U
                    ON A.CreatedBy = U.UserID

                WHERE A.AssetID=@AssetID

            `);

        if (result.recordset.length === 0) {

            return res.status(404).json({

                success: false,

                message: "Asset not found"

            });

        }

        res.status(200).json({

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
==================================================
CREATE ASSET
POST : /api/assets
==================================================
*/

router.post("/", auth, async (req, res) => {

    try {

        const {
            AssetTag,
            AssetName,
            CategoryID,
            SerialNumber,
            ModelNumber,
            Manufacturer,
            AcquisitionDate,
            AcquisitionCost,
            WarrantyExpiryDate,
            DepartmentID,
            LocationID,
            StatusID,
            ConditionID,
            IsBookable,
            Description
        } = req.body;

        const pool = await connectDB();

        await pool.request()

            .input("AssetTag", sql.VarChar, AssetTag)
            .input("AssetName", sql.VarChar, AssetName)
            .input("CategoryID", sql.Int, CategoryID)
            .input("SerialNumber", sql.VarChar, SerialNumber)
            .input("ModelNumber", sql.VarChar, ModelNumber)
            .input("Manufacturer", sql.VarChar, Manufacturer)
            .input("AcquisitionDate", sql.Date, AcquisitionDate)
            .input("AcquisitionCost", sql.Decimal(18,2), AcquisitionCost)
            .input("WarrantyExpiryDate", sql.Date, WarrantyExpiryDate)
            .input("DepartmentID", sql.Int, DepartmentID)
            .input("LocationID", sql.Int, LocationID)
            .input("StatusID", sql.Int, StatusID)
            .input("ConditionID", sql.Int, ConditionID)
            .input("IsBookable", sql.Bit, IsBookable)
            .input("Description", sql.VarChar, Description)
            .input("CreatedBy", sql.Int, req.user.UserID)

            .query(`
                INSERT INTO Assets
                (
                    AssetTag,
                    AssetName,
                    CategoryID,
                    SerialNumber,
                    ModelNumber,
                    Manufacturer,
                    AcquisitionDate,
                    AcquisitionCost,
                    WarrantyExpiryDate,
                    DepartmentID,
                    LocationID,
                    StatusID,
                    ConditionID,
                    IsBookable,
                    Description,
                    CreatedBy
                )
                VALUES
                (
                    @AssetTag,
                    @AssetName,
                    @CategoryID,
                    @SerialNumber,
                    @ModelNumber,
                    @Manufacturer,
                    @AcquisitionDate,
                    @AcquisitionCost,
                    @WarrantyExpiryDate,
                    @DepartmentID,
                    @LocationID,
                    @StatusID,
                    @ConditionID,
                    @IsBookable,
                    @Description,
                    @CreatedBy
                )
            `);

        res.json({
            success: true,
            message: "Asset created successfully"
        });

    } catch (err) {

        res.status(500).json({
            success: false,
            message: err.message
        });

    }

});

/*
==================================================
UPDATE ASSET
PUT : /api/assets/:id
==================================================
*/

router.put("/:id", auth, async (req, res) => {

    try {

        const {
            AssetTag,
            AssetName,
            CategoryID,
            SerialNumber,
            ModelNumber,
            Manufacturer,
            AcquisitionDate,
            AcquisitionCost,
            WarrantyExpiryDate,
            DepartmentID,
            LocationID,
            StatusID,
            ConditionID,
            IsBookable,
            Description
        } = req.body;

        const pool = await connectDB();

        await pool.request()

            .input("AssetID", sql.Int, req.params.id)
            .input("AssetTag", sql.VarChar, AssetTag)
            .input("AssetName", sql.VarChar, AssetName)
            .input("CategoryID", sql.Int, CategoryID)
            .input("SerialNumber", sql.VarChar, SerialNumber)
            .input("ModelNumber", sql.VarChar, ModelNumber)
            .input("Manufacturer", sql.VarChar, Manufacturer)
            .input("AcquisitionDate", sql.Date, AcquisitionDate)
            .input("AcquisitionCost", sql.Decimal(18,2), AcquisitionCost)
            .input("WarrantyExpiryDate", sql.Date, WarrantyExpiryDate)
            .input("DepartmentID", sql.Int, DepartmentID)
            .input("LocationID", sql.Int, LocationID)
            .input("StatusID", sql.Int, StatusID)
            .input("ConditionID", sql.Int, ConditionID)
            .input("IsBookable", sql.Bit, IsBookable)
            .input("Description", sql.VarChar, Description)

            .query(`
                UPDATE Assets
                SET
                    AssetTag=@AssetTag,
                    AssetName=@AssetName,
                    CategoryID=@CategoryID,
                    SerialNumber=@SerialNumber,
                    ModelNumber=@ModelNumber,
                    Manufacturer=@Manufacturer,
                    AcquisitionDate=@AcquisitionDate,
                    AcquisitionCost=@AcquisitionCost,
                    WarrantyExpiryDate=@WarrantyExpiryDate,
                    DepartmentID=@DepartmentID,
                    LocationID=@LocationID,
                    StatusID=@StatusID,
                    ConditionID=@ConditionID,
                    IsBookable=@IsBookable,
                    Description=@Description
                WHERE AssetID=@AssetID
            `);

        res.json({
            success: true,
            message: "Asset updated successfully"
        });

    } catch (err) {

        res.status(500).json({
            success: false,
            message: err.message
        });

    }

});

/*
==================================================
DELETE ASSET
DELETE : /api/assets/:id
==================================================
*/

router.delete("/:id", auth, async (req, res) => {

    try {

        const pool = await connectDB();

        await pool.request()

            .input("AssetID", sql.Int, req.params.id)

            .query(`
                UPDATE Assets
                SET StatusID = 7
                WHERE AssetID=@AssetID
            `);

        res.json({
            success: true,
            message: "Asset deleted successfully"
        });

    } catch (err) {

        res.status(500).json({
            success: false,
            message: err.message
        });

    }

});

/*
==================================================
SEARCH ASSETS
GET : /api/assets/search/:text
==================================================
*/

router.get("/search/:text", auth, async (req, res) => {

    try {

        const pool = await connectDB();

        const result = await pool.request()

            .input("Search", sql.VarChar, "%" + req.params.text + "%")

            .query(`
                SELECT
                    A.AssetID,
                    A.AssetTag,
                    A.AssetName,
                    A.SerialNumber,
                    AC.CategoryName,
                    S.StatusName,
                    D.DepartmentName,
                    L.LocationName
                FROM Assets A

                INNER JOIN AssetCategories AC
                    ON A.CategoryID=AC.CategoryID

                INNER JOIN AssetStatus S
                    ON A.StatusID=S.StatusID

                INNER JOIN Departments D
                    ON A.DepartmentID=D.DepartmentID

                INNER JOIN Locations L
                    ON A.LocationID=L.LocationID

                WHERE

                    A.AssetTag LIKE @Search
                    OR A.AssetName LIKE @Search
                    OR A.SerialNumber LIKE @Search

                ORDER BY A.AssetName
            `);

        res.json({

            success:true,

            count:result.recordset.length,

            data:result.recordset

        });

    } catch(err){

        res.status(500).json({

            success:false,

            message:err.message

        });

    }

});

/*
==================================================
FILTER BY CATEGORY
GET : /api/assets/category/:id
==================================================
*/

router.get("/category/:id", auth, async (req,res)=>{

    try{

        const pool = await connectDB();

        const result = await pool.request()

            .input("CategoryID",sql.Int,req.params.id)

            .query(`
                SELECT *
                FROM Assets
                WHERE CategoryID=@CategoryID
            `);

        res.json({

            success:true,

            data:result.recordset

        });

    }catch(err){

        res.status(500).json({

            success:false,

            message:err.message

        });

    }

});

/*
==================================================
FILTER BY STATUS
GET : /api/assets/status/:id
==================================================
*/

router.get("/status/:id", auth, async (req,res)=>{

    try{

        const pool = await connectDB();

        const result = await pool.request()

            .input("StatusID",sql.Int,req.params.id)

            .query(`
                SELECT *
                FROM Assets
                WHERE StatusID=@StatusID
            `);

        res.json({

            success:true,

            data:result.recordset

        });

    }catch(err){

        res.status(500).json({

            success:false,

            message:err.message

        });

    }

});

/*
==================================================
FILTER BY LOCATION
GET : /api/assets/location/:id
==================================================
*/

router.get("/location/:id", auth, async (req,res)=>{

    try{

        const pool = await connectDB();

        const result = await pool.request()

            .input("LocationID",sql.Int,req.params.id)

            .query(`
                SELECT *
                FROM Assets
                WHERE LocationID=@LocationID
            `);

        res.json({

            success:true,

            data:result.recordset

        });

    }catch(err){

        res.status(500).json({

            success:false,

            message:err.message

        });

    }

});

/*
==================================================
FILTER BY DEPARTMENT
GET : /api/assets/department/:id
==================================================
*/

router.get("/department/:id", auth, async (req,res)=>{

    try{

        const pool = await connectDB();

        const result = await pool.request()

            .input("DepartmentID",sql.Int,req.params.id)

            .query(`
                SELECT *
                FROM Assets
                WHERE DepartmentID=@DepartmentID
            `);

        res.json({

            success:true,

            data:result.recordset

        });

    }catch(err){

        res.status(500).json({

            success:false,

            message:err.message

        });

    }

});

/*
==================================================
ASSET HISTORY
GET : /api/assets/history/:id
==================================================
*/

router.get("/history/:id", auth, async (req,res)=>{

    try{

        const pool = await connectDB();

        const allocation = await pool.request()

            .input("AssetID",sql.Int,req.params.id)

            .query(`
                SELECT
                    AllocationID,
                    AllocatedDate,
                    ExpectedReturnDate,
                    ActualReturnDate,
                    Status
                FROM AssetAllocations
                WHERE AssetID=@AssetID
                ORDER BY AllocatedDate DESC
            `);

        const maintenance = await pool.request()

            .input("AssetID",sql.Int,req.params.id)

            .query(`
                SELECT
                    MaintenanceID,
                    IssueTitle,
                    RequestDate,
                    Status
                FROM MaintenanceRequests
                WHERE AssetID=@AssetID
                ORDER BY RequestDate DESC
            `);

        res.json({

            success:true,

            allocationHistory:allocation.recordset,

            maintenanceHistory:maintenance.recordset

        });

    }catch(err){

        res.status(500).json({

            success:false,

            message:err.message

        });

    }

});



module.exports = router;