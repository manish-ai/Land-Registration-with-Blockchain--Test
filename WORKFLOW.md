# Land Registry DApp — Tested Workflow

## System Requirements

Before starting, ensure all services are running:

```bash
# 1. Start Ganache (deterministic accounts)
npx ganache --port 7545 --deterministic --accounts 10 --networkId 5777

# 2. Deploy smart contracts (from project root)
npx truffle migrate --reset --network development

# 3. Start Government Portal (from /gov-portal)
node server.js

# 4. Start DApp (from /client)
npm start
```

- DApp: http://localhost:4000
- Gov Portal: http://localhost:4002
- Ganache RPC: http://localhost:7545

---

## Test Accounts

| Role            | Name           | Aadhar        | PAN          | OTP  | Wallet (Ganache)                           |
|-----------------|----------------|---------------|--------------|------|--------------------------------------------|
| Land Inspector  | Land Inspector | 100000000001  | LIINSP0001A  | 1234 | 0x90F8bf6A479f320ead074411a4B0e7944Ea8c9C1 |
| Seller          | Rahul Sharma   | 123456789012  | ABCDE1234F   | 1234 | 0xFFcf8FDEE72ac11b5c542428B35EEF5769C409f0 |
| Buyer           | Priya Patel    | 234567890123  | BCDEF2345G   | 1234 | 0x22d491Bde2303f2f43325b2108D26f1eAbA1e32b |

### Admin / Land Inspector Login
- **URL:** http://localhost:4000
- **Aadhar:** `100000000001`
- **PAN:** `LIINSP0001A`
- **OTP:** `1234`
- The Land Inspector account is pre-seeded in the gov portal database on startup — no registration required.

### Seller Login
- **Aadhar:** `123456789012`  **OTP:** `1234`

### Buyer Login
- **Aadhar:** `234567890123`  **OTP:** `1234`

---

## Registration (One-Time Setup)

### Register Seller
1. Go to http://localhost:4000/register-seller
2. Fill in: Name, Age, Aadhar No, PAN No, Owned Lands count
3. Click **Verify with UIDAI** — enter Aadhar 123456789012 + name Rahul Sharma
4. Click **Verify with Income Tax** — enter PAN ABCDE1234F + name Rahul Sharma
5. Optionally upload an identity document
6. Click **Register on Blockchain**
7. After redirect, login with Aadhar 123456789012, OTP 1234

### Register Buyer
1. Go to http://localhost:4000/register-buyer
2. Fill in: Name, Age, City, Email, Aadhar No, PAN No
3. Click **Verify with UIDAI** — enter Aadhar 234567890123 + name Priya Patel
4. Click **Verify with Income Tax** — enter PAN BCDEF2345G + name Priya Patel
5. Optionally upload an identity document
6. Click **Register on Blockchain**
7. After redirect, login with Aadhar 234567890123, OTP 1234

---

## Happy Path Workflow

### Step 1 — LI Logs In
- URL: http://localhost:4000
- Aadhar: 100000000001
- OTP: 1234
- Lands at: http://localhost:4000/admin/dashboard

### Step 2 — LI Verifies Seller
- Go to **Seller Info** (sidebar)
- Find Rahul Sharma — Verification Status: false
- Click **Verify** button
- Status changes to: true

### Step 3 — LI Verifies Buyer
- Go to **Buyer Info** (sidebar)
- Find Priya Patel — Verification Status: false
- Click **Verify** button
- Status changes to: true

### Step 4 — Seller Logs In & Adds Land
- URL: http://localhost:4000
- Aadhar: 123456789012, OTP: 1234
- Lands at: http://localhost:4000/seller/dashboard
- Go to **Add Land** (sidebar)
- Fill in: Area, City, State, Price, Property PID, Survey Number
- Click **Add Land**
- Dashboard shows **My Listed Lands: 1**

### Step 5 — Buyer Logs In & Requests Land
- URL: http://localhost:4000 (different browser tab)
- Aadhar: 234567890123, OTP: 1234
- Lands at: http://localhost:4000/buyer/dashboard
- Dashboard shows **Available Lands: 1**
- Click **Request Land** button in the Available Lands table
- Dashboard shows **My Land Requests: 1**

### Step 6 — Seller Approves Request
- Go to seller tab → **Land Requests** (sidebar)
- Find the request — Request Status: false
- Click **Approve Request**
- Status changes to: true

### Step 7 — Buyer Makes Payment
- Go to buyer tab → **Make Payment** (sidebar)
- Shows the land with price and ETH equivalent
- Click **Make Payment**
- Button changes to: **Paid**

### Step 8 — LI Approves Ownership Transfer
- Go to LI tab → **Approve Transfer** (sidebar)
- Find row #1 — Request Status: true, Verify Transfer button is enabled
- Click **Approve Land Transfer**
- Transaction is submitted to blockchain

### Step 9 — Verify Transfer
- Go to buyer tab → **Owned Lands** (sidebar)
- Land #1 now appears in the table
- Transfer complete

---

## Auth Notes

- Each browser tab maintains its own independent session (sessionStorage)
- To test all three roles simultaneously, open each portal in a separate tab
- Sessions persist through page reloads (F5) but are cleared when the tab is closed
- Logout button is visible in the top-right navbar on all portals

---

## Route Reference

| Role     | Base Path  | Dashboard                    |
|----------|------------|------------------------------|
| Admin/LI | /admin/*   | /admin/dashboard             |
| Seller   | /seller/*  | /seller/dashboard            |
| Buyer    | /buyer/*   | /buyer/dashboard             |
| Login    | /          | / (redirects after login)    |
