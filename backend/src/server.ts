import app from './app';
import { pool } from './config/db';

const PORT = parseInt(process.env.PORT || '5000', 10);

async function startServer() {
  try {
    // Verify database connectivity
    const connection = await pool.getConnection();
    console.log('Successfully connected to MySQL database: ' + (process.env.DB_NAME || 'gaming_tournament_db'));
    connection.release();

    app.listen(PORT, () => {
      console.log(`Server is running on port ${PORT} [http://localhost:${PORT}]`);
    });
  } catch (err) {
    console.error('Failed to initialize database connection:', err);
    process.exit(1);
  }
}

startServer();
