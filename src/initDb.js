import pool from './config/db.js'

export const initDb = async () => {
  try {
    // 1. Users Table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        username VARCHAR(50) NOT NULL UNIQUE, 
        first_name VARCHAR(100) NOT NULL,
        last_name VARCHAR(100) NOT NULL,
        email VARCHAR(100) NOT NULL,
        -- Roles: 1:archivist, 2:admin, 3:faculty, 4:student, 5. guest
        user_type SMALLINT NOT NULL DEFAULT 5, 
        id_number VARCHAR(20) UNIQUE, 
        password TEXT NOT NULL,

        -- Access Control
        -- status: 0=pending, 1=active, 2=declined, 3=blocked 4=expired
        status SMALLINT NOT NULL DEFAULT 0,
        
        -- Admin Audit Trail
        approved_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
        approval_date TIMESTAMP,
        rejection_reason TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // 2. Collections Table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS collections (
        id SERIAL PRIMARY KEY,
        name VARCHAR(100) NOT NULL,
        location VARCHAR(100) NOT NULL,
        description TEXT,
        restriction_id SMALLINT DEFAULT 1,
        created_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
        updated_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        is_active BOOLEAN NOT NULL DEFAULT TRUE
      );
    `);

    // 3. Boxes Table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS boxes (
        id SERIAL PRIMARY KEY,
        box_number VARCHAR(100),
        physical_order INT NOT NULL,
        name VARCHAR(100),
        description TEXT,
        restriction_id SMALLINT DEFAULT 1,
        collection_id INTEGER NOT NULL REFERENCES collections(id) ON DELETE CASCADE,
        created_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
        updated_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        is_active BOOLEAN NOT NULL DEFAULT TRUE
      );
    `);

    // 4. Folders Table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS folders (
        id SERIAL PRIMARY KEY,
        physical_order INT NOT NULL, 
        name VARCHAR(100),
        description TEXT,
        restriction_id INT NULL,
        box_id INTEGER NOT NULL REFERENCES boxes(id) ON DELETE CASCADE,
        created_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
        updated_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        is_active BOOLEAN NOT NULL DEFAULT TRUE
      );
    `);

    // 5. Items Table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS items (
        id SERIAL PRIMARY KEY,
        title VARCHAR(255) NOT NULL,
        creator VARCHAR(255),
        physical_order INT NOT NULL,
        extent VARCHAR(100), 
        description TEXT,
        -- 1: document, 2: book, 3: image, 4: pamphlet, 5: magazine
        medium_id SMALLINT,
        document_date DATE,
        restriction_id INT NOT NULL,  
        
        -- File Upload Fields
        file_path TEXT,
        file_name VARCHAR(255),
        file_type VARCHAR(100),
        file_size BIGINT,
        
        -- Hierarchy
        box_id INTEGER NOT NULL REFERENCES boxes(id) ON DELETE CASCADE,
        folder_id INTEGER REFERENCES folders(id) ON DELETE CASCADE,
        
        -- Audit
        created_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
        updated_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        is_active BOOLEAN NOT NULL DEFAULT TRUE
      );
    `);

    console.log("✅ Archive Database Schema Initialized with Approval Workflow.");
  } catch (err) {
    console.error("❌ Database Initialization Error:", err.message);
    throw err;
  }
};