const mysql = require('mysql2');

const pool = mysql.createPool({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'mercurio',
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});

// Exportar pool como Promises para poder usar async/await
module.exports = pool.promise();
