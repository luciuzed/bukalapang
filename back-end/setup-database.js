const mysql = require('mysql2/promise');
const path = require('path');
const fs = require('fs');

const envPath = path.resolve(__dirname, '../.env');
if (fs.existsSync(envPath)) {
  require('dotenv').config({ path: envPath });
}

async function setupDatabase() {
  let connection;

  try {
    connection = await mysql.createConnection({
      host: process.env.DB_HOST,
      port: Number(process.env.DB_PORT || 3306),
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME,
      multipleStatements: false
    });

    console.log('Connected to database.');

    const createStatements = [
      `CREATE TABLE IF NOT EXISTS \`admin\` (
        \`id\` bigint NOT NULL AUTO_INCREMENT,
        \`name\` varchar(100) DEFAULT NULL,
        \`email\` varchar(100) NOT NULL,
        \`password\` varchar(255) NOT NULL,
        \`number\` varchar(20) DEFAULT NULL,
        \`created_at\` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
        PRIMARY KEY (\`id\`),
        UNIQUE KEY \`email\` (\`email\`)
      ) ENGINE=InnoDB AUTO_INCREMENT=2000000001`,

      `CREATE TABLE IF NOT EXISTS \`user\` (
        \`id\` bigint NOT NULL AUTO_INCREMENT,
        \`name\` varchar(100) DEFAULT NULL,
        \`email\` varchar(100) NOT NULL,
        \`password\` varchar(255) NOT NULL,
        \`created_at\` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
        \`number\` varchar(20) DEFAULT NULL,
        PRIMARY KEY (\`id\`),
        UNIQUE KEY \`email\` (\`email\`)
      ) ENGINE=InnoDB AUTO_INCREMENT=1000000001`,

      `CREATE TABLE IF NOT EXISTS \`field\` (
        \`id\` int NOT NULL AUTO_INCREMENT,
        \`admin_id\` bigint NOT NULL,
        \`name\` varchar(100) NOT NULL,
        \`category\` enum('Futsal','Badminton','Basketball','Tennis','Biliard') NOT NULL,
        \`description\` text,
        \`address\` text NOT NULL,
        \`city\` varchar(50) DEFAULT NULL,
        \`image_url\` varchar(255) DEFAULT NULL,
        \`qr_url\` varchar(255) DEFAULT NULL,
        \`is_active\` tinyint(1) DEFAULT '1',
        \`created_at\` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
        \`google_maps_link\` varchar(500) DEFAULT NULL,
        PRIMARY KEY (\`id\`),
        KEY \`admin_id\` (\`admin_id\`),
        CONSTRAINT \`fk_field_admin\` FOREIGN KEY (\`admin_id\`) REFERENCES \`admin\` (\`id\`) ON DELETE CASCADE
      ) ENGINE=InnoDB AUTO_INCREMENT=1`,

      `CREATE TABLE IF NOT EXISTS \`court\` (
        \`id\` int NOT NULL AUTO_INCREMENT,
        \`field_id\` int NOT NULL,
        \`name\` varchar(100) NOT NULL,
        \`created_at\` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
        PRIMARY KEY (\`id\`),
        KEY \`fk_court_field\` (\`field_id\`),
        CONSTRAINT \`fk_court_field\` FOREIGN KEY (\`field_id\`) REFERENCES \`field\` (\`id\`) ON DELETE CASCADE
      ) ENGINE=InnoDB AUTO_INCREMENT=1`,

      `CREATE TABLE IF NOT EXISTS \`field_slot\` (
        \`id\` int NOT NULL AUTO_INCREMENT,
        \`court_id\` int NOT NULL,
        \`start_time\` datetime NOT NULL,
        \`end_time\` datetime NOT NULL,
        \`price\` decimal(10,2) DEFAULT '50000.00',
        \`is_booked\` tinyint(1) DEFAULT '0',
        \`field_id\` int NOT NULL,
        PRIMARY KEY (\`id\`),
        KEY \`fk_fs_court\` (\`court_id\`),
        KEY \`fk_fs_field\` (\`field_id\`),
        CONSTRAINT \`fk_fs_court\` FOREIGN KEY (\`court_id\`) REFERENCES \`court\` (\`id\`) ON DELETE CASCADE,
        CONSTRAINT \`fk_fs_field\` FOREIGN KEY (\`field_id\`) REFERENCES \`field\` (\`id\`)
      ) ENGINE=InnoDB AUTO_INCREMENT=1`,

      `CREATE TABLE IF NOT EXISTS \`booking\` (
        \`id\` int NOT NULL AUTO_INCREMENT,
        \`user_id\` bigint NOT NULL,
        \`booking_date\` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
        \`status\` enum('unpaid','failed','pending','cancelled','confirmed') DEFAULT 'unpaid',
        \`total_amount\` decimal(10,2) DEFAULT NULL,
        PRIMARY KEY (\`id\`),
        KEY \`user_id\` (\`user_id\`),
        CONSTRAINT \`fk_booking_user\` FOREIGN KEY (\`user_id\`) REFERENCES \`user\` (\`id\`) ON DELETE CASCADE
      ) ENGINE=InnoDB AUTO_INCREMENT=100001`,

      `CREATE TABLE IF NOT EXISTS \`booking_slot\` (
        \`booking_id\` int NOT NULL,
        \`slot_id\` int NOT NULL,
        PRIMARY KEY (\`booking_id\`,\`slot_id\`),
        KEY \`fk_bs_field_slot\` (\`slot_id\`),
        CONSTRAINT \`fk_bs_booking\` FOREIGN KEY (\`booking_id\`) REFERENCES \`booking\` (\`id\`) ON DELETE CASCADE,
        CONSTRAINT \`fk_bs_field_slot\` FOREIGN KEY (\`slot_id\`) REFERENCES \`field_slot\` (\`id\`) ON DELETE CASCADE
      ) ENGINE=InnoDB`,

      `CREATE TABLE IF NOT EXISTS \`payment\` (
        \`id\` varchar(12) NOT NULL,
        \`booking_id\` int NOT NULL,
        \`amount\` decimal(10,2) NOT NULL,
        \`payment_method\` varchar(50) DEFAULT NULL,
        \`status\` enum('unpaid','paid','failed') DEFAULT 'unpaid',
        \`transaction_time\` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
        PRIMARY KEY (\`id\`),
        KEY \`booking_id\` (\`booking_id\`),
        CONSTRAINT \`fk_payment_booking\` FOREIGN KEY (\`booking_id\`) REFERENCES \`booking\` (\`id\`) ON DELETE CASCADE
      ) ENGINE=InnoDB`
    ];

    for (const statement of createStatements) {
      await connection.execute(statement);
    }

    const [tables] = await connection.execute(
      `
      SELECT table_name
      FROM information_schema.tables
      WHERE table_schema = ?
      ORDER BY table_name
      `,
      [process.env.DB_NAME]
    );

    console.log('Database setup completed. Current tables:');
    for (const row of tables) {
      console.log(`- ${row.table_name}`);
    }
  } catch (err) {
    console.error('Database setup failed.');
    console.error(err.message);
    process.exitCode = 1;
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

setupDatabase();
