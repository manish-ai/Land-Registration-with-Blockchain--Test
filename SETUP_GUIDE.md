# Land Registration DApp - Complete Setup Guide

This guide walks you through everything from scratch, including MetaMask setup and registering users. No prior software engineering knowledge required.

---

## Part 1: Install Prerequisites

### 1.1 Install Node.js

1. Go to **https://nodejs.org/**
2. Click the big green **LTS** button to download
3. Open the downloaded file and follow the installer (click Next/Continue through everything)
4. When done, close and reopen Terminal

**Verify it worked:** Open Terminal and type:
```bash
node -v
```
You should see something like `v22.12.0` (any version 18+ is fine).

### 1.2 Install Git (if not already installed)

Open Terminal and type:
```bash
git --version
```
If it's not installed, macOS will prompt you to install Xcode Command Line Tools. Click **Install** and wait.

---

## Part 2: Get the Code and Install

### 2.1 Clone the repository

Open Terminal and run:
```bash
git clone https://github.com/vrii14/Land-Registration-with-Blockchain.git
cd Land-Registration-with-Blockchain
```

### 2.2 Run the setup script

```bash
chmod +x setup.sh
./setup.sh
```

This automatically installs all dependencies. Wait for it to say **"Setup Complete!"**.

---

## Part 3: Install and Configure MetaMask

MetaMask is a browser extension that acts as your blockchain wallet. Each user (seller, buyer, inspector) needs a different MetaMask account.

### 3.1 Install MetaMask Extension

1. Open **Google Chrome**
2. Go to **https://metamask.io/download/**
3. Click **Install MetaMask for Chrome**
4. Click **Add to Chrome** > **Add Extension**
5. MetaMask will open automatically. Click **Create a new wallet**
6. Accept the terms, create a password (anything you'll remember)
7. You can **skip** the Secret Recovery Phrase backup for now (this is just for local testing)
8. Click through until setup is complete

### 3.2 Add the Ganache Local Network

MetaMask needs to know about our local blockchain (Ganache).

1. Click the **MetaMask fox icon** in your browser toolbar
2. Click the **network dropdown** at the top (it says "Ethereum Mainnet")
3. Click **Add network** (or **Add a network manually** at the bottom)
4. Fill in these details:

| Field | Value |
|-------|-------|
| Network Name | `Ganache Local` |
| New RPC URL | `http://127.0.0.1:7545` |
| Chain ID | `5777` |
| Currency Symbol | `ETH` |

5. Click **Save**
6. Select **Ganache Local** from the network dropdown

### 3.3 Import Test Accounts into MetaMask

Our local blockchain has 10 pre-funded accounts. You need to import the ones you'll use. Each account has a **private key** that you copy-paste into MetaMask.

#### How to import an account:

1. Click the **MetaMask fox icon**
2. Click the **account icon** (circle at top-right)
3. Click **Import account**
4. Select **Private Key** as the type
5. Paste the private key from the table below
6. Click **Import**
7. (Optional) Click the account name to rename it (e.g., "Land Inspector")

#### Account Private Keys

Import the accounts you need. At minimum, import the **Land Inspector**, one **Seller**, and one **Buyer**.

| Role | Name | Private Key |
|------|------|-------------|
| **Land Inspector** | Land Inspector | `0x4f3edf983ac636a65a842ce7c78d9aa706d3b113bce9c46f30d7d21715b23b1d` |
| **Seller** | Rahul Sharma | `0x6cbed15c793ce57650b9877cf6fa156fbef513c4e6134f022a85b1ffdd59b2a1` |
| **Buyer** | Priya Patel | `0x6370fd033278c143179d81c5526140625662b8daa446c22ee2d73db3707e620c` |
| Available | Amit Kumar | `0x646f1ce2fdad0e6deeeb5c7e8e5543bdde65e86029e2fd9fc169899c440a7913` |
| Available | Sneha Reddy | `0xadd53f9a7e588d003326d1cbf9e4a43c061aadd9bc938c843a79e7b4fd2ad743` |
| Available | Vikram Singh | `0x395df67f0c2d2d9fe1ad08d1bc8b6627011959b79c53d7dd6a3536a33ab8a4fd` |
| Available | Deepa Nair | `0xe485d098507f54e7733a205420dfddbe58db035fa577fc294ebd14db90767a52` |
| Available | Rajesh Gupta | `0xa453611d9419d0e56f499079478fd72c37b251a94bfde4d19872c44cf65386e3` |
| Available | Anita Desai | `0x829e924fdf021ba3dbbc4225edfece9aca04b929d6e75613329ca6f1d31c0bb4` |

> **Important:** These are test-only private keys for the local Ganache blockchain. Never use them for real cryptocurrency.

After importing, you should see each account has **~1000 ETH** (test ETH, not real).

---

## Part 4: Start the Application

### 4.1 Start all services

Open Terminal, go to the project folder, and run:

```bash
./start.sh
```

Wait until you see the message with all the URLs. The browser should open automatically at **http://localhost:4000**.

If the browser doesn't open, manually go to: **http://localhost:4000**

---

## Part 5: Register Users on the Blockchain

The application has three roles. You must register them **in this specific order** because the Land Inspector needs to verify the others.

**Login credentials for all users:** OTP is always **`1234`**

### 5.1 The Land Inspector (Already Set Up)

The Land Inspector (admin) is automatically registered when the contract is deployed. You just need to log in.

1. In MetaMask, **switch to the Land Inspector account**
   - Click the MetaMask icon > click the account selector at top > choose the Land Inspector account
2. Go to **http://localhost:4000** (refresh if already open)
3. Enter Aadhaar: **`100000000001`**
4. Select type: **Aadhaar**
5. Click **Send OTP**, then enter OTP: **`1234`**
6. Click **Verify & Login**
7. You should land on the **Land Inspector Dashboard**

> The Land Inspector doesn't need registration — they're pre-configured as the contract deployer.

### 5.2 Register a Seller

1. In MetaMask, **switch to the Seller account** (e.g., Rahul Sharma)
2. Go to **http://localhost:4000**
3. Click **Register as Seller**
4. Fill in the form:
   - **Full Name:** `Deepa Nair` (must match exactly as in the government records)
   - **Age:** `30` (must be 21 or older)
   - **Owned Lands:** `2` (any number)
   - **Aadhaar Number:** `678901234567` — click **Verify** (should show green checkmark)
   - **PAN Number:** `FGHIJ6789K` — click **Verify** (should show green checkmark)
   - **Identity Document:** Upload any PDF or image file
5. Click **Register on Blockchain**
6. **MetaMask will pop up** asking to confirm the transaction — click **Confirm**
7. Wait for the transaction to process. You'll be redirected to the login page.

#### Verify the Seller (as Land Inspector)

1. In MetaMask, **switch back to the Land Inspector account**
2. Log in as Land Inspector (Aadhaar: `100000000001`, OTP: `1234`)
3. Go to **Seller Info** from the dashboard
4. Find the newly registered seller
5. Click **Verify** to approve them

### 5.3 Register a Buyer

1. In MetaMask, **switch to the Buyer account** (e.g., Priya Patel)
2. Go to **http://localhost:4000**
3. Click **Register as Buyer**
4. Fill in the form:
   - **Full Name:** `Priya Patel` (must match government records exactly)
   - **Age:** `28`
   - **City:** `Mumbai`
   - **Email:** `priya.patel@email.com`
   - **Aadhaar Number:** `234567890123` — click **Verify**
   - **PAN Number:** `BCDEF2345G` — click **Verify**
   - **Identity Document:** Upload any PDF or image file
5. Click **Register on Blockchain**
6. **MetaMask will pop up** — click **Confirm**
7. Wait for redirect to login page.

#### Verify the Buyer (as Land Inspector)

1. In MetaMask, **switch to the Land Inspector account**
2. Log in as Land Inspector
3. Go to **Buyer Info** from the dashboard
4. Find the newly registered buyer
5. Click **Verify** to approve them

---

## Part 6: Full Demo Workflow

Now that everyone is registered and verified, here's the complete land transaction flow:

### 6.1 Seller Adds a Land

1. In MetaMask, switch to the **Seller account**
2. Log in as Seller (use their Aadhaar + OTP `1234`)
3. Go to **Add Land** from the dashboard
4. Fill in land details:
   - **Property PID:** `KA-BLR-2024-001` (use a PID from the government records)
   - The area, city, state will auto-fill from government records
   - **Price:** Enter a price in INR (e.g., `7200000`)
   - **Upload a land image** (any image file)
5. Click **Add Land**
6. MetaMask pops up — click **Confirm**

### 6.2 Land Inspector Verifies the Land

1. Switch to **Land Inspector** in MetaMask
2. Log in as Land Inspector
3. Go to **Land Verifications**
4. Find the newly added land
5. Click **Verify** to approve it

### 6.3 Buyer Makes an Offer

1. Switch to **Buyer account** in MetaMask
2. Log in as Buyer
3. On the dashboard, find the verified land in the **Available Lands** table
4. Click **Make Offer**
5. Enter your offer price (e.g., `7200000`)
6. Click **Submit Offer**
7. MetaMask pops up — click **Confirm**

### 6.4 Seller Accepts the Offer

1. Switch to **Seller account** in MetaMask
2. Log in as Seller
3. Go to **Buyer Requests** from the dashboard
4. Find the buyer's offer
5. Click **Accept**
6. MetaMask pops up — click **Confirm**

### 6.5 Buyer Makes Payment

1. Switch to **Buyer account** in MetaMask
2. Log in as Buyer
3. Go to **Payments** from the dashboard (or click the **Make Payment** button on the accepted offer)
4. Click **Make Payment** next to the accepted offer
5. MetaMask pops up — click **Confirm**
6. Wait for confirmation — you should see a green "Payment Successful" message

### 6.6 Land Inspector Approves the Transfer

1. Switch to **Land Inspector** in MetaMask
2. Log in as Land Inspector
3. Go to **Approve Transaction** from the dashboard
4. Find the completed payment
5. Click **Approve Transfer**
6. MetaMask pops up — click **Confirm**

The land ownership is now transferred from the Seller to the Buyer on the blockchain!

---

## Available Test Citizens

All these citizens exist in the government database and can be used for registration:

| Name | Aadhaar | PAN | City |
|------|---------|-----|------|
| Rahul Sharma | 123456789012 | ABCDE1234F | Bengaluru |
| Priya Patel | 234567890123 | BCDEF2345G | Mumbai |
| Amit Kumar | 345678901234 | CDEFG3456H | New Delhi |
| Sneha Reddy | 456789012345 | DEFGH4567I | Hyderabad |
| Vikram Singh | 567890123456 | EFGHI5678J | Jaipur |
| Deepa Nair | 678901234567 | FGHIJ6789K | Kochi |
| Rajesh Gupta | 789012345678 | GHIJK7890L | Kolkata |
| Anita Desai | 890123456789 | HIJKL8901M | Pune |

## Available Land PIDs (Government Records)

Use these PIDs when adding land:

| PID | City | Type | Notes |
|-----|------|------|-------|
| KA-BLR-2024-001 | Bengaluru | Residential | Clean |
| MH-MUM-2024-002 | Mumbai | Commercial | Clean |
| DL-NDL-2024-003 | New Delhi | Residential | Clean |
| TS-HYD-2024-004 | Hyderabad | Residential | Clean |
| RJ-JPR-2024-005 | Jaipur | Agricultural | Has encumbrance (will be flagged) |
| KL-KCH-2024-006 | Kochi | Commercial | Under litigation (will be flagged) |

---

## Troubleshooting

### "MetaMask is not connecting"
- Make sure MetaMask is set to the **Ganache Local** network (not Ethereum Mainnet)
- Make sure the correct account is selected in MetaMask for the role you're using

### "Transaction failed" or MetaMask shows an error
- Make sure Ganache is running (`./start.sh` should handle this)
- If you restarted Ganache, you need to **reset MetaMask's account data**:
  1. Open MetaMask > Settings > Advanced > **Clear activity tab data**
  2. This clears the transaction history (MetaMask gets confused when Ganache restarts)

### "Government services unavailable"
- Make sure the Gov Portal is running (check http://localhost:4002/api/health in your browser)
- If not, the `./start.sh` script starts it automatically

### "Already registered" error
- Each blockchain address can only register once (either as seller OR buyer, not both)
- Use a different test citizen, or restart fresh with `./stop.sh` then `./start.sh`

### Starting fresh (reset everything)
```bash
./stop.sh
./start.sh
```
The start script redeploys contracts and resets the database automatically.

### Port already in use
```bash
./stop.sh
```
This kills any processes on ports 4000, 4002, and 7545.

---

## Quick Reference

| Service | URL |
|---------|-----|
| Application | http://localhost:4000 |
| Gov Portal API | http://localhost:4002 |
| Ganache Blockchain | http://localhost:7545 |

| Action | Command |
|--------|---------|
| Start everything | `./start.sh` |
| Stop everything | `./stop.sh` or `Ctrl+C` |
| First-time setup | `./setup.sh` |

**OTP for all logins: `1234`**
