# Manual Setup Guide (for Node 24+ / any Node version)

This guide avoids the setup/start scripts and walks through each step manually. It uses **nvm** to install Node 20 LTS, which is compatible with all project dependencies.

> **Why nvm?** This project uses `react-scripts 5.0.1`, `ganache`, `truffle`, and `better-sqlite3` — all of which have compatibility issues with Node 24. Node 20 LTS is the most stable version for this stack.

---

## Step 1: Install nvm (Node Version Manager)

Open Terminal and run:

```bash
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.40.1/install.sh | bash
```

**Close and reopen Terminal**, then verify:

```bash
nvm --version
```

If it shows a version number (e.g. `0.40.1`), you're good.

> If `nvm: command not found`, try running `source ~/.zshrc` (or `source ~/.bashrc` if using bash), then try again.

---

## Step 2: Install Node 20 LTS

```bash
nvm install 20
nvm use 20
```

Make it the default so every new terminal uses it automatically:

```bash
nvm alias default 20
```

Verify:

```bash
node -v
```

Should show `v20.x.x`.

---

## Step 3: Clone the repository

```bash
git clone https://github.com/manish-ai/Land-Registration-with-Blockchain--Test.git
cd Land-Registration-with-Blockchain--Test
```

---

## Step 4: Install Truffle & Ganache globally

```bash
npm install -g truffle ganache
```

Verify both installed:

```bash
truffle version
ganache --version
```

---

## Step 5: Install Gov Portal dependencies

```bash
cd gov-portal
npm install
cd ..
```

> `better-sqlite3` is a native module — it compiles during install. If you see warnings about `node-gyp`, that's normal as long as it finishes without errors.

---

## Step 6: Install Client (React) dependencies

```bash
cd client
npm install
cd ..
```

This takes a few minutes. Wait for it to finish completely.

---

## Running the Application

You need **4 Terminal tabs** running simultaneously. Open them all from the project root folder.

### Terminal 1: Start Ganache (blockchain)

```bash
cd Land-Registration-with-Blockchain--Test
npx ganache --port 7545 --deterministic --accounts 10 --networkId 5777
```

You'll see 10 accounts with private keys printed. **Keep this terminal open** — it's your blockchain.

### Terminal 2: Deploy Smart Contracts

Open a **new Terminal tab** (Cmd+T):

```bash
cd Land-Registration-with-Blockchain--Test
truffle migrate --reset --network development
```

You should see output like:
```
Deploying 'Land'
   > contract address:    0x...
```

This terminal is done after deployment. You can close it or reuse it.

### Terminal 3: Start Gov Portal

Open a **new Terminal tab**:

```bash
cd Land-Registration-with-Blockchain--Test/gov-portal
node index.js
```

Should show:
```
Gov Portal API running on http://localhost:4002
```

**Keep this terminal open.**

### Terminal 4: Start React App

Open a **new Terminal tab**:

```bash
cd Land-Registration-with-Blockchain--Test/client
npm start
```

Browser should open automatically at **http://localhost:4000**.

If it doesn't, manually open Chrome and go to: http://localhost:4000

**Keep this terminal open.**

---

## MetaMask Setup

### Install MetaMask Extension

1. Open **Google Chrome**
2. Go to **https://metamask.io/download/**
3. Click **Install MetaMask for Chrome** > **Add to Chrome** > **Add Extension**
4. Click **Create a new wallet**
5. Accept the terms, create any password
6. **Skip** the Secret Recovery Phrase backup (this is just for local testing)
7. Click through until setup is complete

### Add the Ganache Network

1. Click the **MetaMask fox icon** in the browser toolbar
2. Click the **network dropdown** at the top (says "Ethereum Mainnet")
3. Click **Add network** > **Add a network manually**
4. Fill in:

| Field | Value |
|-------|-------|
| Network Name | `Ganache Local` |
| New RPC URL | `http://127.0.0.1:7545` |
| Chain ID | `5777` |
| Currency Symbol | `ETH` |

5. Click **Save**
6. Select **Ganache Local** from the network dropdown

### Import Test Accounts

For each account you need:

1. Click the **MetaMask fox icon**
2. Click the **account icon** (circle at top-right)
3. Click **Import account**
4. Select **Private Key** as the type
5. Paste the private key from the table below
6. Click **Import**
7. (Optional) Click the account name to rename it

| Role | Name | Private Key |
|------|------|-------------|
| **Land Inspector** | Inspector | `0x4f3edf983ac636a65a842ce7c78d9aa706d3b113bce9c46f30d7d21715b23b1d` |
| **Seller** | Deepa Nair | `0x6cbed15c793ce57650b9877cf6fa156fbef513c4e6134f022a85b1ffdd59b2a1` |
| **Buyer** | Priya Patel | `0x6370fd033278c143179d81c5526140625662b8daa446c22ee2d73db3707e620c` |

Import at minimum these 3 accounts. Each should show ~1000 ETH (test ETH, not real).

---

## Test Credentials

**OTP for all logins: `1234`**

| Role | Name | Aadhaar | PAN |
|------|------|---------|-----|
| Land Inspector | -- | 100000000001 | -- |
| Seller | Deepa Nair | 678901234567 | FGHIJ6789K |
| Buyer | Priya Patel | 234567890123 | BCDEF2345G |
| Available | Rahul Sharma | 123456789012 | ABCDE1234F |
| Available | Amit Kumar | 345678901234 | CDEFG3456H |
| Available | Sneha Reddy | 456789012345 | DEFGH4567I |

---

## Stopping Everything

Press **Ctrl+C** in each terminal tab to stop that service. Or close the terminal.

If ports are stuck (e.g. "port already in use" next time):

```bash
# Kill Ganache
lsof -ti:7545 | xargs kill

# Kill Gov Portal
lsof -ti:4002 | xargs kill

# Kill React app
lsof -ti:4000 | xargs kill
```

---

## Starting Fresh (Reset Everything)

If something goes wrong or you want a clean slate:

1. Stop everything (Ctrl+C in all terminals)
2. Kill any stuck ports (commands above)
3. Delete the gov portal database:
   ```bash
   rm -f gov-portal/data/govt.db
   ```
4. Start from "Terminal 1: Start Ganache" again — the database re-seeds automatically

---

## Troubleshooting

### "nvm: command not found" after install
Close Terminal completely (Cmd+Q) and reopen it. If still not found:
```bash
source ~/.zshrc
```

### "Error: Cannot find module" during npm install
Make sure you're using Node 20:
```bash
node -v
```
If it shows v24.x, run `nvm use 20` first.

### MetaMask shows "Internal JSON-RPC error" or transactions fail
1. Make sure MetaMask is on the **Ganache Local** network (not Ethereum Mainnet)
2. Make sure the correct account is selected for the role you're using
3. If you restarted Ganache, reset MetaMask:
   MetaMask > Settings > Advanced > **Clear activity tab data**

### "Government services unavailable" in the app
The Gov Portal isn't running. Start it:
```bash
cd gov-portal && node index.js
```

### React app shows blank page or errors
Check the Terminal 4 output for errors. Common fix:
```bash
cd client
rm -rf node_modules
npm install
npm start
```

### "Already registered" error when registering
Each blockchain address can only register once (either as seller OR buyer, not both). Either use a different test citizen or reset everything (see "Starting Fresh" above).

---

## Quick Reference

| Service | URL | Terminal |
|---------|-----|---------|
| Blockchain (Ganache) | http://localhost:7545 | Terminal 1 |
| Gov Portal API | http://localhost:4002 | Terminal 3 |
| React App | http://localhost:4000 | Terminal 4 |
