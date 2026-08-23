"use strict";
require("dotenv").config();
const { Client } = require("pg");

const target = process.argv[2] === "prod" ? "DATABASE_URL" : "DATABASE_URL_DEV_BRANCH";
const connStr = process.env[target];

if (!connStr) {
  console.error(`Missing ${target} in .env`);
  process.exit(1);
}

(async () => {
  const client = new Client({
    connectionString: connStr,
    ssl: { require: true, rejectUnauthorized: false },
  });
  await client.connect();

  const res = await client.query(`
    SELECT
      tc.constraint_name,
      tc.constraint_type,
      string_agg(kcu.column_name, ', ' ORDER BY kcu.ordinal_position) AS columns
    FROM information_schema.table_constraints tc
    JOIN information_schema.key_column_usage kcu
      ON tc.constraint_name = kcu.constraint_name
      AND tc.table_schema = kcu.table_schema
    WHERE tc.table_name = 'Users'
      AND tc.table_schema = 'public'
      AND tc.constraint_type IN ('UNIQUE', 'PRIMARY KEY')
    GROUP BY tc.constraint_name, tc.constraint_type
    ORDER BY tc.constraint_type, tc.constraint_name;
  `);

  console.log(`\n=== ${target} — Users table UNIQUE/PK constraints ===`);
  console.table(res.rows);

  const idxRes = await client.query(`
    SELECT indexname, indexdef
    FROM pg_indexes
    WHERE tablename = 'Users' AND schemaname = 'public'
    ORDER BY indexname;
  `);
  console.log(`\n=== ${target} — Users table indexes ===`);
  idxRes.rows.forEach((r) => console.log(`${r.indexname}: ${r.indexdef}`));

  await client.end();
})().catch((err) => {
  console.error(err);
  process.exit(1);
});
