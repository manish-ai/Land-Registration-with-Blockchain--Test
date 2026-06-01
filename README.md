# Land Registration System with Blockchain

## This work was presented at IEEE ICAECC'23 - [Checkout](https://ieeexplore.ieee.org/document/10560138)

<img src="https://img.shields.io/badge/Ethereum-20232A?style=for-the-badge&logo=ethereum&logoColor=white"> <img src="https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB"> <img src="https://img.shields.io/badge/Solidity-363636?style=for-the-badge&logo=solidity&logoColor=white"> <img src="https://img.shields.io/badge/Node.js-339933?style=for-the-badge&logo=nodedotjs&logoColor=white">

## Project Description

A decentralized Land Registration System built on Ethereum blockchain. The system makes land registration resilient and reduces fraud by storing all transactions on a public, immutable ledger. It connects three stakeholders — **Buyers**, **Sellers**, and **Land Inspectors** — in a transparent workflow for property transfer.

The application includes a **Government Portal** backend that simulates real-world integrations: Aadhaar/PAN identity verification, government land records lookup, bank account services for payments, and document storage.

## Architecture

```
Land-Registration-with-Blockchain/
├── client/                  # React frontend (port 4000)
├── contracts/               # Solidity smart contracts
├── migrations/              # Truffle migration scripts
├── gov-portal/              # Government Portal Express backend (port 4002)
│   ├── db/                  # SQLite schema & seed data
│   ├── routes/              # API routes (auth, verify, land, bank, files)
│   └── index.js             # Server entry point
└── truffle-config.js        # Truffle configuration
```

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18, React Router v6, Reactstrap, Bootstrap 4, Chart.js |
| Smart Contracts | Solidity, Truffle Suite |
| Blockchain | Ethereum (Ganache local testnet) |
| Gov Portal Backend | Node.js, Express, SQLite (better-sqlite3) |
| Identity | Aadhaar/PAN verification (simulated), OTP authentication |
| Payments | Bank transfer simulation via Gov Portal API |
| File Storage | Local file upload via Gov Portal (replaces IPFS) |

## Application Features

### Buyer
- **Registration** with Aadhaar/PAN verification via Government Portal
- **Dashboard** with available lands, KPI cards, and accepted offers summary
- **Make Offer** on any verified land with a custom offer price
- **Make Payment** for accepted offers (bank transfer via Gov Portal + blockchain record)
- **Owned Lands** view for properties transferred after purchase
- **Profile** view and edit

### Seller
- **Registration** with Aadhaar/PAN verification
- **Dashboard** with listed lands, verification status badges, and incoming request count
- **Add Land** with government land records validation (PID lookup, duplicate check, encumbrance/litigation detection)
- **Approve/Reject** buyer offers with offer price details
- **Profile** view and edit

### Land Inspector (Admin)
- **Dashboard** with pending verifications count
- **Verify/Reject Buyers & Sellers** after reviewing their documents
- **Verify/Reject Lands** with government record cross-referencing
- **Approve Land Transfers** to finalize ownership change on-chain
- **Audit Trail** of all transactions

### Government Portal Services
- Aadhaar & PAN identity verification
- Government land records lookup (area, owner, encumbrances, litigation)
- Duplicate land registration detection
- Bank account balance check and payment processing
- Document/file upload and retrieval
- ETH/INR price oracle (simulated)

## Detailed Setup Guide

For a complete step-by-step walkthrough including **MetaMask setup**, **importing accounts**, and **registering users**, see **[SETUP_GUIDE.md](SETUP_GUIDE.md)**.

## Prerequisites

Make sure you have the following installed:

- **Node.js** v18 or later — [Download](https://nodejs.org/)
- **npm** (comes with Node.js)
- **Git** — [Download](https://git-scm.com/)
- A modern web browser (Chrome/Firefox/Edge)

## Installation & Setup

### 1. Clone the Repository

```bash
git clone https://github.com/vrii14/Land-Registration-with-Blockchain.git
cd Land-Registration-with-Blockchain
```

### 2. Install Truffle and Ganache (Global)

```bash
npm install -g truffle ganache
```

### 3. Install Gov Portal Dependencies

```bash
cd gov-portal
npm install
cd ..
```

### 4. Install Client Dependencies

```bash
cd client
npm install
cd ..
```

### 5. Start Ganache (Local Blockchain)

Open a terminal and run:

```bash
npx ganache --port 7545 --deterministic --accounts 10 --networkId 5777
```

> Keep this terminal running. The `--deterministic` flag ensures the same accounts are generated every time.

### 6. Deploy Smart Contracts

In a new terminal, from the project root:

```bash
truffle migrate --reset --network development
```

This compiles the Solidity contracts and deploys them to Ganache. The compiled artifacts are written to `client/src/artifacts/`.

### 7. Start the Government Portal

In a new terminal:

```bash
cd gov-portal
node index.js
```

You should see:
```
Gov Portal API running on http://localhost:4002
```

> The database is automatically created and seeded with test data on first run.

### 8. Start the React Frontend

In a new terminal:

```bash
cd client
npm start
```

The app opens at `http://localhost:4000`.

## Test Accounts

The Gov Portal is pre-seeded with test citizens and bank accounts. Use the OTP **`1234`** for all logins.

| Role | Name | Aadhaar | PAN | Ganache Account |
|------|------|---------|-----|-----------------|
| Land Inspector | — | 100000000001 | — | Account 0 |
| Seller | Rahul Sharma | 123456789012 | ABCDE1234F | Account 1 |
| Buyer | Priya Patel | 234567890123 | BCDEF2345G | Account 2 |
| Available | Amit Kumar | 345678901234 | CDEFG3456H | Account 3 |
| Available | Sneha Reddy | 456789012345 | DEFGH4567I | Account 4 |
| Available | Vikram Singh | 567890123456 | EFGHI5678J | Account 5 |
| Available | Deepa Nair | 678901234567 | FGHIJ6789K | Account 6 |
| Available | Rajesh Gupta | 789012345678 | GHIJK7890L | Account 7 |
| Available | Anita Desai | 890123456789 | HIJKL8901M | Account 8 |

> **Note:** There is also a fake/unverified citizen (Aadhaar `999999999999`) in the seed data for testing verification rejection.

## End-to-End Workflow

1. **Login as Seller** (Aadhaar: `123456789012`, OTP: `1234`)
2. **Register** as a Seller (wallet address is auto-assigned during registration)
3. **Login as Land Inspector** (Aadhaar: `100000000001`, OTP: `1234`)
4. **Verify the Seller** from the LI dashboard
5. **Login as Seller** again and **Add a Land** (use PID like `KA-BLR-2024-001` from seed data)
6. **Login as Land Inspector** and **Verify the Land**
7. **Login as Buyer** (Aadhaar: `234567890123`, OTP: `1234`)
8. **Register** as a Buyer
9. **Login as Land Inspector** and **Verify the Buyer**
10. **Login as Buyer** and **Make an Offer** on the verified land
11. **Login as Seller** and **Accept the Offer** from Buyer Requests
12. **Login as Buyer** and **Make Payment** (bank transfer processed via Gov Portal)
13. **Login as Land Inspector** and **Approve the Transfer** to finalize ownership change

## Available Land PIDs (Seed Data)

| PID | City | State | Type | Owner | Notes |
|-----|------|-------|------|-------|-------|
| KA-BLR-2024-001 | Bengaluru | Karnataka | Residential | Rahul Sharma | Clean |
| MH-MUM-2024-002 | Mumbai | Maharashtra | Commercial | Priya Patel | Clean |
| DL-NDL-2024-003 | New Delhi | Delhi | Residential | Amit Kumar | Clean |
| TS-HYD-2024-004 | Hyderabad | Telangana | Residential | Sneha Reddy | Clean |
| RJ-JPR-2024-005 | Jaipur | Rajasthan | Agricultural | Vikram Singh | Has encumbrance |
| KL-KCH-2024-006 | Kochi | Kerala | Commercial | Deepa Nair | Under litigation |

## Ports Summary

| Service | Port |
|---------|------|
| Ganache (Blockchain) | 7545 |
| React Frontend | 4000 |
| Government Portal API | 4002 |

## Troubleshooting

- **"Failed to load web3, accounts, or contract"** — Make sure Ganache is running on port 7545 and contracts are deployed.
- **"Government services unavailable"** — Make sure the Gov Portal is running (`node index.js` in `gov-portal/`).
- **Contract redeployment** — If you restart Ganache, you must run `truffle migrate --reset` again and re-register all users (blockchain state is reset).
- **OpenSSL errors on npm start** — The client's start script already includes `NODE_OPTIONS=--openssl-legacy-provider`. If you still see errors, make sure you're using Node.js v18+.
- **Database reset** — Delete `gov-portal/data/govt.db` and restart the Gov Portal to re-seed the database.
- **Port conflicts** — If port 4000 is in use, React will prompt to use another port. Ganache and Gov Portal ports are configured in `truffle-config.js` and `gov-portal/index.js` respectively.

## Project Demo

[Watch the demo on YouTube](https://youtu.be/6VLaAa8GNDc)

## Screenshots

Landing Page | Buyer Registration
:---: | :---:
<img src="Screenshots/landing.png" height="200"> | <img src="Screenshots/registration.png" height="200">

Buyer Dashboard | Seller Dashboard
:---: | :---:
<img src="Screenshots/buyer dashboard.png" height="200"> | <img src="Screenshots/seller dashboard2.png" height="200">

Add Land (by Seller) | View all Lands Details
:---: | :---:
<img src="Screenshots/add land.png" height="200"> | <img src="Screenshots/Land Gallery.png" height="200">

Help & FAQ Page | Verify Buyer (by Land Inspector)
:---: | :---:
<img src="Screenshots/help.png" height="200"> | <img src="Screenshots/verify buyer.png" height="200">

Approve Land Request (by Seller) | Payment by Buyer
:---: | :---:
<img src="Screenshots/approve request.png" height="200"> | <img src="Screenshots/payment.png" height="200">

Verify Land Transaction (by Land Inspector) | Owned Lands (Buyer)
:---: | :---:
<img src="Screenshots/verify transaction.png" height="200"> | <img src="Screenshots/owned lands.png" height="200">

---

### Make sure to star the repository if you find it helpful!

![visitors](https://visitor-badge.laobi.icu/badge?page_id=vrii14.Land-Registration-with-Blockchain)
<a href="https://github.com/vrii14/Land-Registration-with-Blockchain/stargazers"><img src="https://img.shields.io/github/stars/vrii14/Land-Registration-with-Blockchain?color=yellow" alt="Stars Badge"/></a>
<a href="https://github.com/vrii14/Land-Registration-with-Blockchain/graphs/contributors"><img alt="GitHub contributors" src="https://img.shields.io/github/contributors/vrii14/Land-Registration-with-Blockchain?color=2b9348"></a>
