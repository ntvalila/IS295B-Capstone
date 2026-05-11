import pkg from 'pg'
const { Pool } = pkg

const pool = new Pool({
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  database: process.env.DB_NAME,
})

pool.query('SELECT current_database()', (err, res) => {
  console.log('Connected to DB:', res.rows[0].current_database)
})


export default pool