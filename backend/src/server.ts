import app from './app';
import { pool } from './config/db';

const PORT = parseInt(process.env.PORT || '5001', 10);

async function startServer() {
  try {
    // Verify database connectivity
    const connection = await pool.getConnection();
    console.log('Successfully connected to MySQL database: ' + (process.env.DB_NAME || 'gaming_tournament_db'));

    // Ensure TeamJoinRequests table exists
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS TeamJoinRequests (
        request_id INT AUTO_INCREMENT PRIMARY KEY,
        team_id INT NOT NULL,
        user_id INT NOT NULL,
        type ENUM('Invitation', 'Request') NOT NULL,
        member_role VARCHAR(50) NOT NULL DEFAULT 'Starter',
        status ENUM('Pending', 'Accepted', 'Declined', 'Cancelled') NOT NULL DEFAULT 'Pending',
        created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (team_id) REFERENCES Teams(team_id) ON UPDATE CASCADE ON DELETE CASCADE,
        FOREIGN KEY (user_id) REFERENCES Users(user_id) ON UPDATE CASCADE ON DELETE CASCADE
      ) ENGINE=InnoDB
    `);

    connection.release();

    const server = app.listen(PORT, '0.0.0.0', () => {
      console.log(`Server is running on port ${PORT} [http://localhost:${PORT}]`);
    });

    server.on('error', (err: any) => {
      if (err.code === 'EADDRINUSE') {
        const fallbackPort = PORT + 1;
        console.warn(`[Port Warning] Port ${PORT} is busy, attempting fallback on port ${fallbackPort}...`);
        app.listen(fallbackPort, '0.0.0.0', () => {
          console.log(`Server is running on fallback port ${fallbackPort} [http://localhost:${fallbackPort}]`);
        });
      } else {
        console.error('Server error:', err);
      }
    });
  } catch (err) {
    console.error('Failed to initialize database connection:', err);
    process.exit(1);
  }
}

startServer();
