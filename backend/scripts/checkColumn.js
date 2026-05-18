const { pool } = require('../db');
(async () => {
  const res = await pool.query(
    "SELECT column_name, data_type, column_default FROM information_schema.columns WHERE table_name = 'personas' AND column_name = 'activo'"
  );
  console.log(res.rows);
  process.exit(0);
})();
