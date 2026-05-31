const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const Database = require('better-sqlite3');

const app = express();
const PORT = 4002;

// Middleware
app.use(cors({ origin: true, credentials: true }));
app.use(express.json());

// Ensure data and uploads directories exist
const dataDir = path.join(__dirname, 'data');
const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });
if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });

// Initialize SQLite database
const dbPath = path.join(dataDir, 'govt.db');
const isNewDb = !fs.existsSync(dbPath);
const db = new Database(dbPath);
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

if (isNewDb) {
    console.log('Initializing database with schema and seed data...');
    const schema = fs.readFileSync(path.join(__dirname, 'db', 'schema.sql'), 'utf8');
    db.exec(schema);
    const seed = fs.readFileSync(path.join(__dirname, 'db', 'seed.sql'), 'utf8');
    db.exec(seed);
    console.log('Database initialized successfully.');
} else {
    // Ensure tables exist even on existing DB (in case schema changed)
    const schema = fs.readFileSync(path.join(__dirname, 'db', 'schema.sql'), 'utf8');
    db.exec(schema);
    console.log('Database loaded from existing file.');
}

// Migration: remove owner NOT NULL and FK constraints from land_records
const landCols = db.pragma('table_info(land_records)').map(c => c.name);
if (landCols.includes('owner_name')) {
    // Check if the FK constraint still exists by looking at the notnull flag on owner_aadhar
    const ownerCol = db.pragma('table_info(land_records)').find(c => c.name === 'owner_aadhar');
    if (ownerCol && ownerCol.notnull) {
        console.log('Migration: relaxing owner constraints on land_records...');
        db.exec(`
            CREATE TABLE IF NOT EXISTS land_records_new (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                property_pid TEXT UNIQUE NOT NULL,
                survey_number TEXT UNIQUE NOT NULL,
                area INTEGER NOT NULL,
                city TEXT NOT NULL,
                state TEXT NOT NULL,
                district TEXT,
                taluk TEXT,
                village TEXT,
                owner_name TEXT DEFAULT '',
                owner_aadhar TEXT DEFAULT '',
                registration_date TEXT,
                market_value INTEGER NOT NULL,
                land_type TEXT,
                has_encumbrance BOOLEAN DEFAULT 0,
                has_litigation BOOLEAN DEFAULT 0,
                is_registered_on_chain BOOLEAN DEFAULT 0,
                latitude REAL,
                longitude REAL,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP
            );
            INSERT OR IGNORE INTO land_records_new SELECT * FROM land_records;
            DROP TABLE land_records;
            ALTER TABLE land_records_new RENAME TO land_records;
        `);
        console.log('Migration: land_records owner constraints relaxed.');
    }
}

// Migration: add wallet_address and role columns if missing
const citizenCols = db.pragma('table_info(citizens)').map(c => c.name);
if (!citizenCols.includes('wallet_address')) {
    db.exec('ALTER TABLE citizens ADD COLUMN wallet_address TEXT');
    db.exec('ALTER TABLE citizens ADD COLUMN role TEXT');
    console.log('Migration: added wallet_address and role columns to citizens');
}

// Seed blockchain wallet mappings (idempotent — safe to run every startup)
const setWallet = db.prepare('UPDATE citizens SET wallet_address = ?, role = ? WHERE aadhar_number = ?');
setWallet.run('0xFFcf8FDEE72ac11b5c542428B35EEF5769C409f0', 'seller', '123456789012'); // Rahul Sharma
setWallet.run('0x22d491Bde2303f2f43325b2108D26f1eAbA1e32b', 'buyer',  '234567890123'); // Priya Patel

// Map remaining citizens to Ganache accounts (accounts 3-8) so new registrations work
const setWalletIfNull = db.prepare('UPDATE citizens SET wallet_address = ? WHERE aadhar_number = ? AND wallet_address IS NULL');
setWalletIfNull.run('0xE11BA2b4D45Eaed5996Cd0823791E0C93114882d', '345678901234'); // Amit Kumar
setWalletIfNull.run('0xd03ea8624C8C5987235048901fB614fDcA89b117', '456789012345'); // Sneha Reddy
setWalletIfNull.run('0x95cED938F7991cd0dFcb48F0a06a40FA1aF46EBC', '567890123456'); // Vikram Singh
setWalletIfNull.run('0x3E5e9111Ae8eB78Fe1CC3bb8915d5D461F3Ef9A9', '678901234567'); // Deepa Nair
setWalletIfNull.run('0x28a8746e75304c0780E011BEd21C72cD78cd535E', '789012345678'); // Rajesh Gupta
setWalletIfNull.run('0xACa94ef8bD5ffEE41947b4585a84BdA5a3d3DA6E', '890123456789'); // Anita Desai

// Add Land Inspector account if not already present
db.prepare(`INSERT OR IGNORE INTO citizens
    (aadhar_number, pan_number, name, age, dob, gender, address, city, state, phone, email, is_verified, wallet_address, role)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1, ?, ?)`)
    .run('100000000001', 'LIINSP0001A', 'Land Inspector', 40, '1984-01-01', 'Male',
         'Government Office, North Block', 'New Delhi', 'Delhi', '9000000001',
         'li@gov.in', '0x90F8bf6A479f320ead074411a4B0e7944Ea8c9C1', 'inspector');
console.log('Wallet mappings seeded.');

// Make db available to routes
app.locals.db = db;

// Mount routes
const verifyRoutes = require('./routes/verify');
const landRoutes = require('./routes/land');
const bankRoutes = require('./routes/bank');
const oracleRoutes = require('./routes/oracle');
const filesRoutes = require('./routes/files');
const adminRoutes = require('./routes/admin');
const authRoutes = require('./routes/auth');

app.use('/api/verify', verifyRoutes);
app.use('/api/land', landRoutes);
app.use('/api/bank', bankRoutes);
app.use('/api/oracle', oracleRoutes);
app.use('/api/files', filesRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/auth', authRoutes);

// Serve uploaded files statically
app.use('/uploads', express.static(uploadsDir));

// Serve admin UI from public directory (single-page HTML app)
const publicPath = path.join(__dirname, 'public');
app.use(express.static(publicPath));

// Serve admin React build if it exists (fallback)
const clientBuildPath = path.join(__dirname, 'client', 'build');
if (fs.existsSync(clientBuildPath)) {
    app.use(express.static(clientBuildPath));
    app.get('*', (req, res) => {
        if (!req.path.startsWith('/api')) {
            res.sendFile(path.join(clientBuildPath, 'index.html'));
        }
    });
}

// Health check
app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', service: 'Government Portal', port: PORT });
});

app.listen(PORT, () => {
    console.log(`Government Portal running on http://localhost:${PORT}`);
    console.log(`API available at http://localhost:${PORT}/api`);
});
