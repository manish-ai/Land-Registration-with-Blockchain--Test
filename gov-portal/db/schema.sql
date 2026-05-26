-- Citizens registry (simulates UIDAI + Income Tax dept)
CREATE TABLE IF NOT EXISTS citizens (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    aadhar_number TEXT UNIQUE NOT NULL,
    pan_number TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    age INTEGER NOT NULL,
    dob TEXT,
    gender TEXT,
    address TEXT,
    city TEXT,
    state TEXT,
    phone TEXT,
    email TEXT,
    photo_url TEXT,
    is_verified BOOLEAN DEFAULT 1,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Government land records (simulates State Land Revenue dept)
CREATE TABLE IF NOT EXISTS land_records (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    property_pid TEXT UNIQUE NOT NULL,
    survey_number TEXT UNIQUE NOT NULL,
    area INTEGER NOT NULL,
    city TEXT NOT NULL,
    state TEXT NOT NULL,
    district TEXT,
    taluk TEXT,
    village TEXT,
    owner_name TEXT NOT NULL,
    owner_aadhar TEXT NOT NULL,
    registration_date TEXT,
    market_value INTEGER NOT NULL,
    land_type TEXT,
    has_encumbrance BOOLEAN DEFAULT 0,
    has_litigation BOOLEAN DEFAULT 0,
    is_registered_on_chain BOOLEAN DEFAULT 0,
    latitude REAL,
    longitude REAL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (owner_aadhar) REFERENCES citizens(aadhar_number)
);

-- Bank accounts (simulates RBI/Bank system)
CREATE TABLE IF NOT EXISTS bank_accounts (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    account_number TEXT UNIQUE NOT NULL,
    ifsc TEXT NOT NULL,
    bank_name TEXT NOT NULL,
    holder_name TEXT NOT NULL,
    aadhar_linked TEXT NOT NULL,
    pan_linked TEXT NOT NULL,
    balance REAL NOT NULL,
    account_type TEXT DEFAULT 'Savings',
    branch TEXT,
    is_active BOOLEAN DEFAULT 1,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (aadhar_linked) REFERENCES citizens(aadhar_number)
);

-- Payment transaction log
CREATE TABLE IF NOT EXISTS transactions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    transaction_id TEXT UNIQUE NOT NULL,
    buyer_aadhar TEXT NOT NULL,
    seller_aadhar TEXT NOT NULL,
    amount REAL NOT NULL,
    land_pid TEXT NOT NULL,
    buyer_account TEXT NOT NULL,
    seller_account TEXT NOT NULL,
    status TEXT DEFAULT 'SUCCESS',
    blockchain_tx_hash TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Verification log (audit trail for identity checks)
CREATE TABLE IF NOT EXISTS verification_log (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    verification_id TEXT UNIQUE NOT NULL,
    aadhar_number TEXT NOT NULL,
    verification_type TEXT NOT NULL,
    result TEXT NOT NULL,
    details TEXT,
    requested_by TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- File uploads (replaces IPFS)
CREATE TABLE IF NOT EXISTS uploaded_files (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    file_id TEXT UNIQUE NOT NULL,
    original_name TEXT NOT NULL,
    file_path TEXT NOT NULL,
    file_size INTEGER,
    mime_type TEXT,
    sha256_hash TEXT NOT NULL,
    uploaded_by TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
