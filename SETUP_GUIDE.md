# Land Registration DApp - Complete Setup Guide

This guide walks you through everything from scratch. No prior software engineering knowledge required. **No browser extensions or wallet setup needed.**

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

## Part 3: Start the Application

### 3.1 Start all services

Open Terminal, go to the project folder, and run:

```bash
./start.sh
```

Wait until you see the message with all the URLs. The browser should open automatically at **http://localhost:4000**.

If the browser doesn't open, manually go to: **http://localhost:4000**

> **That's it!** No MetaMask, no browser extensions, no wallet setup. The app connects directly to the local blockchain and the government portal assigns wallet addresses automatically based on your Aadhaar identity.

---

## Part 4: Register Users on the Blockchain

The application has three roles. You must register them **in this specific order** because the Land Inspector needs to verify the others.

**Login credentials for all users:** OTP is always **`1234`**

### 4.1 The Land Inspector (Already Set Up)

The Land Inspector (admin) is automatically registered when the contract is deployed. You just need to log in.

1. Go to **http://localhost:4000**
2. Enter Aadhaar: **`100000000001`**
3. Select type: **Aadhaar**
4. Click **Send OTP**, then enter OTP: **`1234`**
5. Click **Verify & Login**
6. You should land on the **Land Inspector Dashboard**

> The Land Inspector doesn't need registration — they're pre-configured as the contract deployer.

### 4.2 Register a Seller

1. Go to **http://localhost:4000**
2. Click **Register as Seller**
3. Fill in the form:
   - **Full Name:** `Deepa Nair` (must match exactly as in the government records)
   - **Age:** `30` (must be 21 or older)
   - **Owned Lands:** `2` (any number)
   - **Aadhaar Number:** `678901234567` — click **Verify** (should show green checkmark)
   - **PAN Number:** `FGHIJ6789K` — click **Verify** (should show green checkmark)
   - **Identity Document:** Upload any PDF or image file
4. Click **Register on Blockchain**
5. Wait for the transaction to process. You'll be redirected to the login page.

#### Verify the Seller (as Land Inspector)

1. Log in as Land Inspector (Aadhaar: `100000000001`, OTP: `1234`)
2. Go to **Seller Info** from the dashboard
3. Find the newly registered seller
4. Click **Verify** to approve them

### 4.3 Register a Buyer

1. Go to **http://localhost:4000**
2. Click **Register as Buyer**
3. Fill in the form:
   - **Full Name:** `Priya Patel` (must match government records exactly)
   - **Age:** `28`
   - **City:** `Mumbai`
   - **Email:** `priya.patel@email.com`
   - **Aadhaar Number:** `234567890123` — click **Verify**
   - **PAN Number:** `BCDEF2345G` — click **Verify**
   - **Identity Document:** Upload any PDF or image file
4. Click **Register on Blockchain**
5. Wait for redirect to login page.

#### Verify the Buyer (as Land Inspector)

1. Log in as Land Inspector
2. Go to **Buyer Info** from the dashboard
3. Find the newly registered buyer
4. Click **Verify** to approve them

---

## Part 5: Full Demo Workflow

Now that everyone is registered and verified, here's the complete land transaction flow:

### 5.1 Seller Adds a Land

1. Log in as Seller (use their Aadhaar + OTP `1234`)
2. Go to **Add Land** from the dashboard
3. Fill in land details:
   - **Property PID:** `KA-BLR-2024-001` (use a PID from the government records)
   - The area, city, state will auto-fill from government records
   - **Price:** Enter a price in INR (e.g., `7200000`)
   - **Upload a land image** (any image file)
4. Click **Add Land**

### 5.2 Land Inspector Verifies the Land

1. Log in as Land Inspector
2. Go to **Land Verifications**
3. Find the newly added land
4. Click **Verify** to approve it

### 5.3 Buyer Makes an Offer

1. Log in as Buyer
2. On the dashboard, find the verified land in the **Available Lands** table
3. Click **Make Offer**
4. Enter your offer price (e.g., `7200000`)
5. Click **Submit Offer**

### 5.4 Seller Accepts the Offer

1. Log in as Seller
2. Go to **Buyer Requests** from the dashboard
3. Find the buyer's offer
4. Click **Accept**

### 5.5 Buyer Makes Payment

1. Log in as Buyer
2. Go to **Payments** from the dashboard (or click the **Make Payment** button on the accepted offer)
3. Click **Make Payment** next to the accepted offer
4. Wait for confirmation — you should see a green "Payment Successful" message

### 5.6 Land Inspector Approves the Transfer

1. Log in as Land Inspector
2. Go to **Approve Transaction** from the dashboard
3. Find the completed payment
4. Click **Approve Transfer**

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
