const sql = require("mssql");
require("dotenv").config();

const dbConfig = {
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    server: process.env.DB_SERVER,
    database: process.env.DB_DATABASE,
    port: parseInt(process.env.DB_PORT),

    options: {
        encrypt: false,
        trustServerCertificate: true
    },

    pool: {
        max: 10,
        min: 0,
        idleTimeoutMillis: 30000
    }
};

let pool;

const connectDB = async () => {
    try {
        if (!pool) {
            pool = await sql.connect(dbConfig);
            console.log("✅ SQL Server Connected");
        }

        return pool;

    } catch (err) {
        console.error("❌ Database Connection Failed");
        console.error(err.message);
        process.exit(1);
    }
};

module.exports = {
    sql,
    connectDB
};