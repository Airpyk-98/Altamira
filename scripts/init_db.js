const { Pool } = require('pg');
const bcrypt = require('bcryptjs');

const DATABASE_URL = process.env.DATABASE_URL || 'postgresql://neondb_owner:npg_9cE6WDAxFiHj@ep-wandering-frog-aeohvckz-pooler.c-2.us-east-2.aws.neon.tech/neondb?sslmode=require';

const pool = new Pool({
  connectionString: DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

async function initDB() {
  const client = await pool.connect();
  try {
    console.log('--- Initializing Altamira Database Schema on Neon ---');

    await client.query('BEGIN');

    // 1. Users table
    await client.query(`
      CREATE TABLE IF NOT EXISTS altamira_users (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        email VARCHAR(255) UNIQUE NOT NULL,
        phone VARCHAR(50) DEFAULT '',
        password_hash VARCHAR(255) NOT NULL,
        role VARCHAR(50) NOT NULL DEFAULT 'manager',
        is_active BOOLEAN NOT NULL DEFAULT FALSE,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
    `);

    // 2. Apartments table
    await client.query(`
      CREATE TABLE IF NOT EXISTS altamira_apartments (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        address VARCHAR(255) DEFAULT '',
        price_mode VARCHAR(50) NOT NULL DEFAULT 'fixed',
        default_price NUMERIC(15, 2) NOT NULL DEFAULT 0.00,
        description TEXT DEFAULT '',
        is_archived BOOLEAN NOT NULL DEFAULT FALSE,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
    `);

    // 3. Manager to Apartment assignments
    await client.query(`
      CREATE TABLE IF NOT EXISTS altamira_manager_apartments (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL REFERENCES altamira_users(id) ON DELETE CASCADE,
        apartment_id INTEGER NOT NULL REFERENCES altamira_apartments(id) ON DELETE CASCADE,
        assigned_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        UNIQUE(user_id, apartment_id)
      );
    `);

    // 4. Bookings table
    await client.query(`
      CREATE TABLE IF NOT EXISTS altamira_bookings (
        id SERIAL PRIMARY KEY,
        apartment_id INTEGER NOT NULL REFERENCES altamira_apartments(id) ON DELETE CASCADE,
        client_name VARCHAR(255) NOT NULL,
        client_phone VARCHAR(50) DEFAULT '',
        dates JSONB NOT NULL DEFAULT '[]'::jsonb,
        start_date DATE NOT NULL,
        end_date DATE NOT NULL,
        total_amount NUMERIC(15, 2) NOT NULL DEFAULT 0.00,
        rate_per_night NUMERIC(15, 2) NOT NULL DEFAULT 0.00,
        nights_count INTEGER NOT NULL DEFAULT 1,
        notes TEXT DEFAULT '',
        booked_by INTEGER REFERENCES altamira_users(id) ON DELETE SET NULL,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
    `);

    // 5. Expenses table
    await client.query(`
      CREATE TABLE IF NOT EXISTS altamira_expenses (
        id SERIAL PRIMARY KEY,
        apartment_id INTEGER NOT NULL REFERENCES altamira_apartments(id) ON DELETE CASCADE,
        amount NUMERIC(15, 2) NOT NULL DEFAULT 0.00,
        category VARCHAR(100) NOT NULL DEFAULT 'General',
        description TEXT DEFAULT '',
        expense_date DATE NOT NULL DEFAULT CURRENT_DATE,
        logged_by INTEGER REFERENCES altamira_users(id) ON DELETE SET NULL,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
    `);

    // 6. Ensure default admin account exists
    const adminEmail = 'ebiringai@gmail.com';
    const adminPassword = 'Airpyk98';
    const adminName = 'Ikechukwu Ebiringa';

    const checkAdmin = await client.query('SELECT id, password_hash, role, is_active FROM altamira_users WHERE email = $1', [adminEmail]);
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(adminPassword, salt);

    if (checkAdmin.rows.length === 0) {
      await client.query(`
        INSERT INTO altamira_users (name, email, password_hash, role, is_active)
        VALUES ($1, $2, $3, 'admin', TRUE);
      `, [adminName, adminEmail, passwordHash]);
      console.log(`[SEED] Admin account created for: ${adminEmail}`);
    } else {
      // Update password hash and ensure admin role & active
      await client.query(`
        UPDATE altamira_users
        SET password_hash = $1, role = 'admin', is_active = TRUE, updated_at = NOW()
        WHERE email = $2;
      `, [passwordHash, adminEmail]);
      console.log(`[SEED] Admin account verified & updated for: ${adminEmail}`);
    }

    // 7. Seed demo apartments if none exist
    const countApts = await client.query('SELECT COUNT(*) FROM altamira_apartments WHERE is_archived = FALSE');
    if (parseInt(countApts.rows[0].count) === 0) {
      const apt1 = await client.query(`
        INSERT INTO altamira_apartments (name, address, price_mode, default_price, description)
        VALUES ('Altamira Gold Penthouse 01', 'Victoria Island, Lagos', 'fixed', 150000.00, '3-Bedroom Luxury Waterfront Penthouse with private terrace')
        RETURNING id;
      `);
      const apt2 = await client.query(`
        INSERT INTO altamira_apartments (name, address, price_mode, default_price, description)
        VALUES ('Altamira Sapphire Suite 2B', 'Ikoyi, Lagos', 'manual_input', 95000.00, '2-Bedroom Executive Suite with Smart Home integration')
        RETURNING id;
      `);
      const apt3 = await client.query(`
        INSERT INTO altamira_apartments (name, address, price_mode, default_price, description)
        VALUES ('Altamira Emerald Villa A', 'Lekki Phase 1, Lagos', 'fixed', 220000.00, '4-Bedroom Private Villa with dedicated generator and pool')
        RETURNING id;
      `);
      console.log(`[SEED] Sample luxury apartments created with Fixed & Manual pricing models.`);
    }

    await client.query('COMMIT');
    console.log('--- Database schema successfully initialized and verified! ---');
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Error during database initialization:', err);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

initDB();
