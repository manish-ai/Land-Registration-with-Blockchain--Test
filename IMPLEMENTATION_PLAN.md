# Land Registration System — Banger Demo Implementation Plan

## The Big Picture

We're building **two separate apps** that talk to each other:

```
┌─────────────────────────────────────────────────────────────────────┐
│                    APP 1: GOVERNMENT PORTAL                        │
│               (Separate Express + React app)                       │
│                   Runs on port 4002                                │
│                                                                    │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐             │
│  │  Admin UI     │  │  REST APIs   │  │   SQLite DB  │             │
│  │  (React SPA)  │──│  (Express)   │──│  (govt data) │             │
│  └──────────────┘  └──────┬───────┘  └──────────────┘             │
│                           │                                        │
│  Manage: Citizens, Land Records, Bank Accounts, Transactions Log  │
└───────────────────────────┼────────────────────────────────────────┘
                            │  REST API calls
                            │  (verify identity, lookup land, process payment)
┌───────────────────────────┼────────────────────────────────────────┐
│                    APP 2: LAND REGISTRY DAPP                       │
│              (Existing React + Blockchain app)                     │
│                   Runs on port 4000                                │
│                                                                    │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐             │
│  │  React UI    │  │  Smart       │  │   Ganache    │             │
│  │  (existing)  │──│  Contract    │──│   Blockchain │             │
│  └──────────────┘  └──────────────┘  └──────────────┘             │
│                                                                    │
│  Register, Buy/Sell Land, Make Payment, View Audit Trail          │
└────────────────────────────────────────────────────────────────────┘
```

**Why separate?** In real life, the government's identity/land/bank systems are completely separate services. The blockchain app calls them like any external API. This separation makes the demo authentic.

**Ports:**
- **Gov Portal:** `http://localhost:4002` (API + Admin UI)
- **Land Registry DApp:** `http://localhost:4000` (React + Blockchain)
- **Ganache:** `http://localhost:7545` (Local blockchain)

---

## APP 1: Government Portal (New — `gov-portal/`)

### Tech Stack
- **Backend:** Express.js + `cors` middleware (CRITICAL — DApp on port 4000 makes cross-origin requests to port 4002)
- **Database:** SQLite (via `better-sqlite3` — zero config, single file, perfect for demo)
- **Frontend:** React (built and served as static files by Express on port 4002 — no separate dev server needed)
- **File uploads:** Multer (stored locally in `gov-portal/uploads/`)

### Database Schema (SQLite)

```sql
-- Citizens registry (simulates UIDAI + Income Tax dept)
CREATE TABLE citizens (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    aadhar_number TEXT UNIQUE NOT NULL,      -- 12 digits
    pan_number TEXT UNIQUE NOT NULL,          -- ABCDE1234F format
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
    is_verified BOOLEAN DEFAULT 1,           -- 1 = legit citizen, 0 = flagged/fake
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Government land records (simulates State Land Revenue dept)
CREATE TABLE land_records (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    property_pid TEXT UNIQUE NOT NULL,        -- e.g., "KA-BLR-2024-001"
    survey_number TEXT UNIQUE NOT NULL,       -- e.g., "SY-145/A"
    area INTEGER NOT NULL,                   -- in sq meters
    city TEXT NOT NULL,
    state TEXT NOT NULL,
    district TEXT,
    taluk TEXT,
    village TEXT,
    owner_name TEXT NOT NULL,
    owner_aadhar TEXT NOT NULL,
    registration_date TEXT,
    market_value INTEGER NOT NULL,            -- in INR
    land_type TEXT,                           -- Residential/Commercial/Agricultural
    has_encumbrance BOOLEAN DEFAULT 0,        -- loan/mortgage exists
    has_litigation BOOLEAN DEFAULT 0,         -- court case pending
    is_registered_on_chain BOOLEAN DEFAULT 0, -- tracks if already on blockchain
    latitude REAL,
    longitude REAL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (owner_aadhar) REFERENCES citizens(aadhar_number)
);

-- Bank accounts (simulates RBI/Bank system)
CREATE TABLE bank_accounts (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    account_number TEXT UNIQUE NOT NULL,
    ifsc TEXT NOT NULL,
    bank_name TEXT NOT NULL,
    holder_name TEXT NOT NULL,
    aadhar_linked TEXT NOT NULL,
    pan_linked TEXT NOT NULL,
    balance REAL NOT NULL,                    -- in INR
    account_type TEXT DEFAULT 'Savings',
    branch TEXT,
    is_active BOOLEAN DEFAULT 1,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (aadhar_linked) REFERENCES citizens(aadhar_number)
);

-- Payment transaction log
CREATE TABLE transactions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    transaction_id TEXT UNIQUE NOT NULL,       -- "TXN-2024-xxxx"
    buyer_aadhar TEXT NOT NULL,
    seller_aadhar TEXT NOT NULL,
    amount REAL NOT NULL,
    land_pid TEXT NOT NULL,
    buyer_account TEXT NOT NULL,
    seller_account TEXT NOT NULL,
    status TEXT DEFAULT 'SUCCESS',             -- SUCCESS / FAILED / PENDING
    blockchain_tx_hash TEXT,                   -- link to on-chain tx
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Verification log (audit trail for identity checks)
CREATE TABLE verification_log (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    verification_id TEXT UNIQUE NOT NULL,      -- "VRF-2024-xxxx"
    aadhar_number TEXT NOT NULL,
    verification_type TEXT NOT NULL,            -- AADHAR / PAN / LAND
    result TEXT NOT NULL,                       -- VERIFIED / REJECTED
    details TEXT,                               -- JSON string with extra info
    requested_by TEXT,                          -- wallet address
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- File uploads (replaces IPFS)
CREATE TABLE uploaded_files (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    file_id TEXT UNIQUE NOT NULL,              -- "FILE-xxxx"
    original_name TEXT NOT NULL,
    file_path TEXT NOT NULL,
    file_size INTEGER,
    mime_type TEXT,
    sha256_hash TEXT NOT NULL,                 -- integrity hash (stored on-chain)
    uploaded_by TEXT,                           -- wallet address
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

### Seed Data

Pre-loaded on server start (8 legit citizens + 1 fake for fraud demo):

| Aadhar | PAN | Name | City | Bank Balance |
|--------|-----|------|------|-------------|
| 123456789012 | ABCDE1234F | Rahul Sharma | Bengaluru | 50,00,000 |
| 234567890123 | BCDEF2345G | Priya Patel | Mumbai | 85,00,000 |
| 345678901234 | CDEFG3456H | Amit Kumar | New Delhi | 2,50,00,000 |
| 456789012345 | DEFGH4567I | Sneha Reddy | Hyderabad | 1,20,00,000 |
| 567890123456 | EFGHI5678J | Vikram Singh | Jaipur | 3,50,00,000 |
| 678901234567 | FGHIJ6789K | Deepa Nair | Kochi | 32,00,000 |
| 789012345678 | GHIJK7890L | Rajesh Gupta | Kolkata | 1,80,00,000 |
| 890123456789 | HIJKL8901M | Anita Desai | Pune | 67,00,000 |
| **999999999999** | **FRAUD9999Z** | **Fake Person** | Unknown | 0 (**is_verified = false**) |

6 land records (1 with encumbrance, 1 with litigation — for demo rejection scenarios).

### REST API Endpoints

#### Identity Verification
```
POST /api/verify/aadhar
  Body: { "aadharNumber": "123456789012", "name": "Rahul Sharma" }
  Response: {
    "verified": true,
    "verificationId": "VRF-2024-0001",
    "citizen": { name, age, gender, city, state, photo_url },
    "message": "Identity verified against UIDAI records"
  }
  -- OR if fake/mismatch:
  Response: {
    "verified": false,
    "verificationId": "VRF-2024-0002",
    "reason": "Citizen flagged in government records" | "Name does not match Aadhar records"
  }

POST /api/verify/pan
  Body: { "panNumber": "ABCDE1234F", "name": "Rahul Sharma" }
  Response: { "verified": true, "panStatus": "Active", "verificationId": "VRF-2024-0003" }
```

#### Land Record Operations
```
POST /api/land/lookup
  Body: { "propertyPID": "KA-BLR-2024-001" }
  Response: {
    "found": true,
    "record": { owner_name, area, city, state, market_value, land_type,
                has_encumbrance, has_litigation, latitude, longitude },
    "message": "Land record found in State Revenue Department"
  }

POST /api/land/check-duplicate
  Body: { "propertyPID": "KA-BLR-2024-001", "surveyNumber": "SY-145/A" }
  Response: {
    "isDuplicate": false,
    "message": "Land is not yet registered on blockchain"
  }

POST /api/land/mark-registered
  Body: { "propertyPID": "KA-BLR-2024-001", "blockchainTxHash": "0x..." }
  -- Updates is_registered_on_chain = true in DB
```

#### Bank & Payment
```
GET /api/bank/account/:aadharNumber
  Response (found):    { found: true, account_number, bank_name, balance, is_active }
  Response (no match): { found: false, message: "No bank account linked to this Aadhar" }
  NOTE: If multiple accounts exist for one Aadhar, returns the first active one.

POST /api/bank/process-payment
  Body: {
    "buyerAadhar": "234567890123",
    "sellerAadhar": "123456789012",
    "amount": 7200000,
    "landPID": "KA-BLR-2024-001"
  }
  Response: {
    "success": true,
    "transactionId": "TXN-2024-0001",
    "buyerNewBalance": 1300000,
    "sellerNewBalance": 12200000,
    "receipt": { ... full details ... }
  }
  -- Validates balance, deducts from buyer, credits seller, logs transaction
```

#### Price Oracle
```
GET /api/oracle/eth-inr
  Response: {
    "rate": 175439,
    "source": "Mock RBI Exchange Rate Feed",
    "lastUpdated": "2024-..."
  }
  -- Returns slightly randomized rate each call for realism
```

#### File Upload (Replaces IPFS)
```
POST /api/files/upload
  Body: multipart/form-data (file field)
  Response: {
    "fileId": "FILE-0001",
    "url": "http://localhost:4002/api/files/FILE-0001",
    "sha256Hash": "a1b2c3...",
    "originalName": "aadhar_card.pdf"
  }

GET /api/files/:fileId
  -- Serves the actual file
```

#### Dashboard Stats (for Admin UI)
```
GET /api/admin/stats
  Response: {
    "totalCitizens": 9,
    "totalLandRecords": 6,
    "totalBankAccounts": 8,
    "totalTransactions": 3,
    "totalVerifications": 15,
    "recentActivity": [...]
  }
```

#### CRUD for Admin UI
```
GET    /api/admin/citizens              -- List all
POST   /api/admin/citizens              -- Add new citizen
PUT    /api/admin/citizens/:id          -- Update
DELETE /api/admin/citizens/:id          -- Delete

GET    /api/admin/land-records          -- List all
POST   /api/admin/land-records          -- Add new
PUT    /api/admin/land-records/:id      -- Update
DELETE /api/admin/land-records/:id      -- Delete

GET    /api/admin/bank-accounts         -- List all
POST   /api/admin/bank-accounts         -- Add new
PUT    /api/admin/bank-accounts/:id     -- Update

GET    /api/admin/transactions          -- List all (read-only)
GET    /api/admin/verifications         -- List all (read-only)
```

---

### Admin Portal UI (React)

A clean, separate React app with these pages:

#### 1. Dashboard (`/`)
- Stats cards: Total Citizens, Land Records, Bank Accounts, Transactions, Verifications
- Recent activity feed (last 10 verifications/transactions)
- Quick links to each section

#### 2. Citizens Management (`/citizens`)
- Table with all citizens: Aadhar, PAN, Name, Age, City, Verified status
- **Add Citizen** button → modal form
- **Edit** button per row → modal form
- **Delete** button per row → confirm dialog
- Search/filter by name, aadhar, city
- Color-coded: green = verified, red = flagged

#### 3. Land Records Management (`/land-records`)
- Table: PID, Survey No, Area, City, Owner, Market Value, Encumbrance, Litigation, On-Chain status
- **Add Land Record** button → modal form
- **Edit** / **Delete** per row
- Badges: "On Blockchain" (blue), "Encumbered" (orange), "Litigation" (red)
- This is where the demo operator can add/modify land records live

#### 4. Bank Accounts (`/bank-accounts`)
- Table: Account No, Bank, Holder, Balance, Linked Aadhar, Active
- **Add Account** / **Edit** per row
- Balance shown in formatted INR
- Can toggle active/inactive

#### 5. Transaction Log (`/transactions`)
- Read-only table of all payments processed
- Columns: TXN ID, Buyer, Seller, Amount, Land PID, Status, Blockchain TX Hash, Timestamp
- Color-coded status: green = SUCCESS, red = FAILED

#### 6. Verification Log (`/verifications`)
- Read-only table of all identity/land verification requests
- Columns: VRF ID, Aadhar, Type, Result, Requested By (wallet), Timestamp
- Shows the blockchain app's verification requests in real-time

---

## APP 2: Land Registry DApp (Modified — existing `client/`)

### Changes to Smart Contract (`contracts/Land.sol`)

#### IMPORTANT: Change PID/Survey from `uint` to `string`

The existing contract uses `uint` for `propertyPID` and `physicalSurveyNumber`, but the
Gov Portal uses realistic text IDs like `"KA-BLR-2024-001"` and `"SY-145/A"`. We must
change these fields to `string` in the `Landreg` struct and all related getter/setter functions.

```solidity
struct Landreg {
    uint id;
    uint area;
    string city;
    string state;
    uint landPrice;
    string propertyPID;           // CHANGED: uint → string
    string physicalSurveyNumber;  // CHANGED: uint → string
    string ipfsHash;
    string document;
}
```

Update `addLand()` signature, `getPID()`, `getSurveyNumber()` return types accordingly.

#### Add Duplicate Prevention (using string hashing)

```solidity
mapping(bytes32 => bool) public registeredPIDs;
mapping(bytes32 => bool) public registeredSurveyNumbers;

function addLand(..., string memory _propertyPID, string memory _surveyNum, ...) public {
    bytes32 pidHash = keccak256(abi.encodePacked(_propertyPID));
    bytes32 surveyHash = keccak256(abi.encodePacked(_surveyNum));
    require(!registeredPIDs[pidHash], "PID already registered on blockchain");
    require(!registeredSurveyNumbers[surveyHash], "Survey number already registered");
    registeredPIDs[pidHash] = true;
    registeredSurveyNumbers[surveyHash] = true;
    ...
}
```

#### Fix Payment Access Control

**Breaking change:** The existing `payment()` takes `(address, uint _landId)` and
`MakePayment.js` passes land IDs. We change it to use **request IDs** instead, which
lets us validate the buyer and approval status. `PaymentReceived` mapping also changes
from land-based to request-based. All frontend calls to `isPaid(landId)` must be
updated to `isPaid(reqId)`.

```solidity
// PaymentReceived now keyed by request ID, not land ID
mapping(uint => bool) public PaymentReceived;

function payment(address payable _receiver, uint _reqId) public payable {
    require(RequestsMapping[_reqId].buyerId == msg.sender, "Not the authorized buyer");
    require(RequestStatus[_reqId] == true, "Request not approved by seller");
    require(!PaymentReceived[_reqId], "Already paid");
    require(msg.value > 0, "Must send payment");
    PaymentReceived[_reqId] = true;
    _receiver.transfer(msg.value);
    emit PaymentDone(msg.sender, _receiver, _reqId, msg.value);
}

function isPaid(uint _reqId) public view returns (bool) {
    return PaymentReceived[_reqId];
}
```

**Frontend impact:** `MakePayment.js`, `ApproveTransaction.js`, and `TransactionInfo.js`
all call `isPaid(landId)` — these must be refactored to iterate over requests and use
`isPaid(reqId)` instead.

#### Add Audit Events
```solidity
event UserRegistered(address indexed user, string role, uint timestamp);
event LandAdded(uint indexed landId, address indexed owner, uint timestamp);
event LandRequested(uint indexed reqId, address indexed buyer, uint landId, uint timestamp);
event RequestApproved(uint indexed reqId, address indexed seller, uint timestamp);
event PaymentDone(address indexed buyer, address indexed seller, uint reqId, uint amount);
event OwnershipTransferred(uint indexed landId, address indexed newOwner, uint timestamp);
```

#### Store Verification Reference (not raw PII)

Both `Buyer` AND `Seller` structs must be updated. Aadhar/PAN numbers are removed from
on-chain storage. Only the verification ID (proof that govt API confirmed identity) and
a document hash (for integrity) are stored.

```solidity
struct Buyer {
    address id;
    string name;
    uint age;
    string city;
    string email;
    string verificationId;   // "VRF-2024-0001" from govt API
    string documentHash;     // SHA-256 hash from file upload API
}

struct Seller {
    address id;
    string name;
    uint age;
    string landsOwned;
    string verificationId;   // "VRF-2024-0002" from govt API
    string documentHash;     // SHA-256 hash from file upload API
}
```

**Breaking change:** This changes the return values of `getBuyerDetails()`,
`getSellerDetails()`, `registerBuyer()`, `registerSeller()`, `updateBuyer()`,
`updateSeller()`. ALL of these frontend files must be updated to match the new signatures:
- `RegisterBuyer.js`, `RegisterSeller.js` — registration calls
- `buyerProfile.js`, `sellerProfile.js` — profile display
- `updateBuyer.js`, `updateSeller.js` — profile editing
- `BuyerInfo.js`, `SellerInfo.js` — inspector verification tables

The `aadharNumber` and `panNumber` columns in these tables should be removed
(that data now lives only in the Gov Portal DB).

### New File: `client/src/services/govApi.js`
API client that the React app uses to call the Government Portal:

```javascript
const GOV_API = 'http://localhost:4002/api';

export const verifyAadhar = (aadharNumber, name) =>
    fetch(`${GOV_API}/verify/aadhar`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ aadharNumber, name })
    }).then(r => r.json());

export const verifyPAN = (panNumber, name) => ...
export const lookupLand = (propertyPID) => ...
export const checkDuplicate = (propertyPID, surveyNumber) => ...
export const processPayment = (buyerAadhar, sellerAadhar, amount, landPID) => ...
export const getEthRate = () => ...
export const uploadFile = (file) => ...  // FormData upload
```

### Modified: `RegisterBuyer.js` — Multi-Step Verification Flow

```
CURRENT:
  Form → Type aadhar/PAN → Click Register → On-chain (trusts anything)

NEW (3-step wizard):
  Step 1: Enter Aadhar + Name
          → Click "Verify with UIDAI"
          → Calls POST /api/verify/aadhar
          → Shows: photo, name, age, city from govt DB
          → Green badge: "Identity Verified (VRF-2024-0001)"
          → OR Red badge: "Verification Failed — citizen flagged"

  Step 2: Enter PAN
          → Click "Verify with Income Tax Dept"
          → Calls POST /api/verify/pan
          → Green badge: "PAN Active"

  Step 3: Upload Aadhar card PDF
          → Calls POST /api/files/upload
          → Gets back SHA-256 hash + file URL

  Step 4: "Register on Blockchain" button becomes active
          → Sends to contract: name, age, city, email, verificationId, documentHash
          → (NOT aadhar/PAN — those stay in govt DB only)
```

Same pattern for `RegisterSeller.js`.

### Modified: `AddLand.js` — Government Land Validation

```
CURRENT:
  Type PID → Type details → Click Add → On-chain (no validation)

NEW:
  Step 1: Enter Property PID
          → Click "Lookup in Govt Records"
          → Calls POST /api/land/lookup
          → Shows: owner, area, city, market value, type
          → Auto-fills form fields from govt data
          → IF has_encumbrance: RED warning "Cannot register — existing mortgage"
          → IF has_litigation: RED warning "Cannot register — under court dispute"

  Step 2: Duplicate check
          → Calls POST /api/land/check-duplicate
          → IF already on chain: RED "This land is already registered on blockchain"

  Step 3: Upload land image + document
          → Calls POST /api/files/upload (×2)
          → Gets SHA-256 hashes

  Step 4: "Register on Blockchain" button active
          → Contract call with all details + hashes

  Step 5: After successful tx
          → Calls POST /api/land/mark-registered to update govt DB
```

### Modified: `MakePayment.js` — Bank Integration

```
CURRENT:
  Hardcoded ₹1 = 0.0000057 ETH → anyone can pay → no validation

NEW:
  Step 1: Show land price from contract

  Step 2: Fetch live rate
          → GET /api/oracle/eth-inr
          → Display: "₹72,00,000 = 41.14 ETH (@ ₹1,75,039/ETH)"

  Step 3: Click "Pay via Bank Transfer"
          → POST /api/bank/process-payment
          → Server validates buyer balance, deducts, credits seller
          → Returns TXN ID + receipt

  Step 4: Show bank receipt
          → TXN ID, amount, buyer/seller details, new balances

  Step 5: Record on blockchain
          → Contract payment() call with a nominal ETH amount (e.g., 0.001 ETH)
          → This is NOT the real payment — it's a blockchain proof-of-transaction
          → The actual fiat transfer already happened in Step 3
          → If Step 3 succeeds but Step 5 fails (blockchain error),
            show warning + allow retry of the on-chain recording only

  NOTE: The on-chain `msg.value` is a nominal amount for gas/proof purposes.
  The real money moves through the bank system. This is how Dubai and other
  real-world implementations work — blockchain is the ledger, not the payment rail.
```

### Modified: `ipfs.js` → Uses File Upload API

**NOTE:** The existing code has a race condition — callers do `await ipfs.files.add(buffer, callback)`
where the callback sets React state, but the state may not be set by the time the next line runs.
The new implementation returns a Promise properly and callers must be refactored to use the return value.

```javascript
const GOV_API = 'http://localhost:4002/api';

const fileUpload = {
    upload: async (buffer) => {
        const formData = new FormData();
        formData.append('file', new Blob([buffer]));
        const res = await fetch(`${GOV_API}/files/upload`, {
            method: 'POST',
            body: formData
        });
        const data = await res.json();
        // Returns both fileId (for retrieval URL) and sha256Hash (for on-chain storage)
        return { fileId: data.fileId, hash: data.sha256Hash, url: data.url };
    },
    getUrl: (fileId) => `${GOV_API}/files/${fileId}`
};
export default fileUpload;
```

**Caller refactoring** (in `RegisterBuyer.js`, `RegisterSeller.js`, `AddLand.js`):
```javascript
// OLD (race condition):
await ipfs.files.add(this.state.buffer, (err, result) => {
    this.setState({ document: result[0].hash });
});
// document may be empty here!

// NEW (proper async):
const result = await fileUpload.upload(this.state.buffer);
this.setState({ document: result.hash, documentFileId: result.fileId });
// document is guaranteed set here
```

### New Page: `AuditTrail.js` — Transaction History Timeline

Shows the complete lifecycle of every land on the system by querying blockchain events:

```
Land: KA-BLR-2024-001 — Hebbal, Bengaluru (2400 sq.m.)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  2024-01-15 10:30  Seller registered (VRF-2024-001)       Block #4521
  2024-01-16 14:22  Land added to blockchain               Block #4535
  2024-01-17 09:15  Land verified by Inspector             Block #4541
  2024-01-20 11:00  Purchase request by Priya Patel        Block #4560
  2024-01-21 16:45  Request approved by seller             Block #4572
  2024-01-22 10:00  Bank payment ₹72,00,000 (TXN-0001)    Block #4580
  2024-01-23 14:30  Ownership transferred to Priya Patel   Block #4589
```

Added to all three route files (buyer, seller, inspector can all see it).

### Modified: `viewImage.js` — Uses File Server

**Issue:** The existing code stores a hash on-chain and uses it as the IPFS URL path
(`https://ipfs.io/ipfs/${hash}`). With our file server, files are retrieved by `fileId`
(`FILE-0001`), not by hash. We have two options:

**Option A (simpler):** Store the `fileId` on-chain in the `ipfsHash` field instead of
the SHA-256 hash. Rename the field to `fileId`. Then `viewImage.js` uses:
```javascript
src={`http://localhost:4002/api/files/${fileId}`}
```

**Option B (more blockchain-y):** Store the SHA-256 hash on-chain (for integrity proof),
and add a Gov Portal endpoint `GET /api/files/by-hash/:sha256Hash` that resolves hash → file.

**Recommendation:** Option A for the demo (simpler, faster). Store the `fileId` on-chain,
and the SHA-256 hash separately in the Gov Portal DB for integrity verification. The on-chain
`ipfsHash` field effectively becomes `fileId` — rename it to `document` or `fileRef` in the struct.

Replace all IPFS gateway URLs:
```javascript
// OLD:  src={`https://ipfs.io/ipfs/${landImg}`}
// NEW:  src={`http://localhost:4002/api/files/${landImg}`}
```

---

## Files Summary

### New Files (Gov Portal — `gov-portal/`)
```
gov-portal/
├── package.json
├── index.js                    -- Express server + API routes
├── db/
│   ├── schema.sql              -- Table definitions
│   └── seed.sql                -- Sample data (9 citizens, 6 lands, 8 bank accounts)
├── routes/
│   ├── verify.js               -- /api/verify/aadhar, /api/verify/pan
│   ├── land.js                 -- /api/land/lookup, check-duplicate, mark-registered
│   ├── bank.js                 -- /api/bank/account, process-payment
│   ├── oracle.js               -- /api/oracle/eth-inr
│   ├── files.js                -- /api/files/upload, /api/files/:id
│   └── admin.js                -- /api/admin/* CRUD endpoints
├── uploads/                    -- Uploaded files stored here
└── client/                     -- Admin React app
    ├── package.json
    ├── public/index.html
    └── src/
        ├── App.js              -- Router with sidebar layout
        ├── pages/
        │   ├── Dashboard.js    -- Stats + recent activity
        │   ├── Citizens.js     -- CRUD table for citizens
        │   ├── LandRecords.js  -- CRUD table for land records
        │   ├── BankAccounts.js -- CRUD table for bank accounts
        │   ├── Transactions.js -- Read-only transaction log
        │   └── Verifications.js-- Read-only verification log
        └── components/
            ├── DataTable.js    -- Reusable table with search/sort
            ├── FormModal.js    -- Reusable add/edit modal
            └── StatCard.js     -- Dashboard stat card
```

### Modified Files (Land Registry DApp — `client/`)
```
contracts/Land.sol              -- Duplicate check, payment fix, events, no PII
client/src/services/govApi.js   -- NEW: API client for gov portal
client/src/RegisterBuyer.js     -- Multi-step verification
client/src/RegisterSeller.js    -- Multi-step verification
client/src/views/AddLand.js     -- Govt land lookup + duplicate check
client/src/views/MakePayment.js -- Bank payment + price oracle
client/src/views/AuditTrail.js  -- NEW: Transaction history timeline
client/src/views/viewImage.js   -- Use file server URLs instead of IPFS
client/src/ipfs.js              -- Redirect to file upload API
client/src/routes.js            -- Add AuditTrail route
client/src/routesLI.js          -- Add AuditTrail route
client/src/routeseller.js       -- Add AuditTrail route
```

---

## Running Everything

```bash
# Terminal 1: Ganache (local blockchain)
ganache-cli -p 7545

# Terminal 2: Deploy smart contract
cd Land-Registration-with-Blockchain
truffle migrate --reset

# Terminal 3: Government Portal (API + Admin UI)
cd gov-portal
npm install
npm start
# → API on http://localhost:4002/api
# → Admin UI on http://localhost:4002

# Terminal 4: Land Registry DApp
cd client
npm start
# → DApp on http://localhost:4000 (set PORT=4000 in client/.env)
```

---

## The 10-Minute Banger Demo Script

### Act 1: "The Government System" (2 min)
1. Open Gov Portal at `localhost:4002`
2. Show dashboard — "This is the government's internal system"
3. Browse citizens table — "These are UIDAI-verified citizens"
4. Browse land records — "State Revenue Department records"
5. Browse bank accounts — "RBI-linked bank accounts"
6. Point out the **fake citizen** (Aadhar 999999999999, red badge)
7. Point out the **encumbered land** (orange badge) and **litigated land** (red badge)

### Act 2: "Fraud Prevention" (2 min)
8. Open DApp at `localhost:4000`
9. Register as Buyer with fake Aadhar `999999999999`
10. Click "Verify with UIDAI" → **RED: "Citizen flagged in government records"**
11. Registration blocked — "Fraud stopped before it touches the blockchain"
12. Now register with real Aadhar `234567890123` (Priya Patel)
13. Click verify → **GREEN: Shows photo, name, city from govt DB**
14. PAN verified → Register on blockchain → Success

### Act 3: "Land Validation" (2 min)
15. Register a seller (Aadhar `123456789012` — Rahul Sharma) → verify → registered
16. Land Inspector verifies both users
17. Seller adds land → enters PID `KA-BLR-2024-001`
18. Click "Lookup in Govt Records" → auto-fills area, city, price from govt DB
19. No encumbrance, no litigation → proceeds
20. **Try PID `RJ-JPR-2024-005`** → "Cannot register: existing mortgage" → blocked
21. **Try PID `KL-KCH-2024-006`** → "Cannot register: under court dispute" → blocked

### Act 4: "Payment & Transfer" (2 min)
22. Buyer requests land → Seller approves
23. Buyer clicks "Pay via Bank Transfer"
24. Shows: "₹72,00,000 = 41.14 ETH @ ₹1,75,039"
25. Payment processes → Shows bank receipt with TXN ID
26. **Switch to Gov Portal** → Transaction log shows the payment in real-time
27. **Bank account balances updated** — buyer decreased, seller increased
28. Land Inspector approves transfer → Ownership changes

### Act 5: "The Audit Trail" (1 min)
29. Open Audit Trail page
30. Show complete timeline — every step timestamped and on-chain
31. "This record is immutable — no one can tamper with this history"
32. **Switch to Gov Portal** → Verification log shows every API call made

### Act 6: "Live Data Demo" (1 min)
33. **In Gov Portal**, add a new citizen live
34. **In DApp**, register with the new citizen's Aadhar → verified instantly
35. "The systems talk to each other in real-time"

---

## Demo Reset & State Management

When restarting the demo (e.g., `truffle migrate --reset`), the blockchain state resets but
the SQLite DB retains `is_registered_on_chain = true` flags and old transaction/verification logs.

**Solution:** Add a reset endpoint to the Gov Portal:
```
POST /api/admin/reset
  -- Resets: is_registered_on_chain = 0 on all land records
  -- Clears: transactions and verification_log tables
  -- Keeps: citizens, land_records, bank_accounts (re-seeds balances)
```
Call this whenever `truffle migrate --reset` is run.

---

## Error Handling

All `govApi.js` calls must be wrapped in try/catch with user-friendly errors:

```javascript
export const verifyAadhar = async (aadharNumber, name) => {
    try {
        const res = await fetch(`${GOV_API}/verify/aadhar`, { ... });
        if (!res.ok) throw new Error(`Server error: ${res.status}`);
        return await res.json();
    } catch (err) {
        return { verified: false, error: true, reason: "Government services unavailable. Is the Gov Portal running?" };
    }
};
```

This prevents cryptic `fetch failed` errors during the demo if the Gov Portal isn't running.

---

## MetaMask Account Switching (Demo Notes)

The DApp identifies users by their MetaMask wallet address. During the demo, you need
different Ganache accounts for each role:

| Role | Ganache Account | Purpose |
|------|----------------|---------|
| Land Inspector | Account 0 (contract deployer) | Verifies users, approves transfers |
| Seller (Rahul Sharma) | Account 1 | Registers as seller, adds land |
| Buyer (Priya Patel) | Account 2 | Registers as buyer, requests/pays |

**How to switch:** In MetaMask, click the account icon → select the correct imported
Ganache account. The DApp auto-detects the active account on page load.

**Import Ganache accounts into MetaMask:** Settings → Import Account → paste private key
from Ganache's account list.

---

## Additional Modified Files (from Opus Review)

These files were missing from the original "Modified Files" list but MUST be updated
due to struct changes in `Land.sol`:

```
client/src/views/buyerProfile.js    -- Remove aadhar/PAN display, show verificationId
client/src/views/sellerProfile.js   -- Remove aadhar/PAN display, show verificationId
client/src/views/updateBuyer.js     -- Remove aadhar/PAN fields from edit form
client/src/views/updateSeller.js    -- Remove aadhar/PAN fields from edit form
client/src/views/BuyerInfo.js       -- Remove aadhar/PAN columns from inspector table
client/src/views/SellerInfo.js      -- Remove aadhar/PAN columns from inspector table
client/src/views/ApproveTransaction.js -- Update isPaid() calls from landId to reqId
client/src/views/TransactionInfo.js    -- Update isPaid() calls from landId to reqId
```

---

## Implementation Order

**IMPORTANT:** Smart contract changes (step 3) MUST happen before frontend changes (steps 5-9),
because the ABI changes. After `truffle migrate --reset`, the new `Land.json` artifact is
generated in `client/src/artifacts/` and all frontend code must match the new function signatures.

| # | Task | Effort | Impact |
|---|------|--------|--------|
| 1 | Gov Portal Express server + SQLite DB + seed data + CORS | Medium | Foundation |
| 2 | Gov Portal API routes (verify, land, bank, files, reset) | Medium | Core APIs |
| 3 | **Update `Land.sol`** (string PIDs, duplicate check, payment fix, struct changes, events) | Medium | Must be first — ABI changes affect everything |
| 4 | Gov Portal Admin React UI (CRUD tables, built & served by Express) | Medium | Demo visual |
| 5 | `govApi.js` service client + error handling | Small | Glue code |
| 6 | Replace `ipfs.js` with file upload | Small | Makes docs work |
| 7 | Update `RegisterBuyer.js` + `RegisterSeller.js` + profiles + inspector views | Large | Key feature (many files affected by struct change) |
| 8 | Update `AddLand.js` with land lookup + `viewImage.js` with file server URLs | Medium | Key feature |
| 9 | Update `MakePayment.js` + `ApproveTransaction.js` + `TransactionInfo.js` (reqId-based payment) | Medium | Key feature |
| 10 | Build `AuditTrail.js` page | Medium | Demo closer |
| 11 | Update routes + add `.env` with PORT=4000 + test full flow | Small | Wiring |
