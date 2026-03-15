# MentorMint v2

Web3 + AI platform: Generate an AI mentor with Gemini, mint it as an NFT on Ethereum Sepolia, chat with it, and level it up.

---

## Quick Start

### 1. Install dependencies
```bash
npm install
```

### 2. Add your Gemini API key
Open `.env.local` and replace `PASTE_YOUR_GEMINI_KEY_HERE`:

```
GEMINI_API_KEY=AIzaSy...your_key_here
```

Get a FREE key at: https://aistudio.google.com/app/apikey
- Click "Create API Key" → copy it → paste above

### 3. Run the app
```bash
npm run dev
```
Open http://localhost:3000

> The app works in demo mode even WITHOUT a contract deployed.
> Mentor generation and chat work as soon as you add the Gemini key.

---

## Deploy Smart Contract (Blockchain Setup)

### Step 1: Open Remix IDE
Go to https://remix.ethereum.org

### Step 2: Create the contract file
- In the File Explorer, click the "+" icon
- Name it `MentorNFT.sol`
- Copy-paste the full code from `contracts/MentorNFT.sol`

### Step 3: Install OpenZeppelin
In Remix, go to the "Plugin Manager" and enable "DGIT".
Or simply compile — Remix auto-installs OpenZeppelin imports.

Alternatively, in the File Explorer create:
`.deps/npm/@openzeppelin/contracts/` (Remix handles this automatically on compile)

### Step 4: Compile
- Click "Solidity Compiler" tab
- Select version `0.8.20`
- Click "Compile MentorNFT.sol"
- Should show green checkmark

### Step 5: Deploy to Sepolia
- Click "Deploy & Run Transactions" tab
- Set Environment to: **Injected Provider - MetaMask**
- MetaMask will open — switch to **Sepolia Testnet**
- Get free Sepolia ETH from: https://sepoliafaucet.com
- Click **Deploy**
- Confirm the transaction in MetaMask
- Copy the deployed contract address (shown in Remix after deploy)

### Step 6: Add contract address to project
Open `.env.local` and update:
```
NEXT_PUBLIC_CONTRACT_ADDRESS=0xYourContractAddressHere
```

Restart the dev server:
```bash
npm run dev
```

Now the "Mint NFT" button and "Complete Task" button work on-chain!

---

## File Structure

```
mentor-mint-v2/
├── .env.local                      ← ADD KEYS HERE
├── jsconfig.json                   ← Fixes @/ import paths
├── app/
│   ├── layout.js
│   ├── globals.css
│   ├── page.js                     ← Landing page
│   ├── createMentor/page.js        ← Step 1: Describe → Generate → Mint
│   ├── dashboard/page.js           ← View NFT, level up
│   ├── chat/page.js                ← AI chat interface
│   └── api/
│       ├── generateMentor/route.js ← POST: Gemini generates mentor
│       └── chat/route.js           ← POST: Gemini chat reply
├── components/
│   ├── Navbar.js                   ← MetaMask wallet connect
│   ├── MentorCard.js               ← NFT display card with XP bar
│   └── ChatBox.js                  ← Full chat UI
├── contracts/
│   └── MentorNFT.sol               ← Deploy this on Remix
├── lib/
│   ├── gemini.js                   ← Gemini 1.5 Flash API
│   ├── contract.js                 ← ethers.js v6 blockchain calls
│   └── ipfs.js                     ← SVG avatar + base64 metadata
└── README.md
```

---

## Environment Variables

| Variable | Where to get it | Required for |
|---|---|---|
| `GEMINI_API_KEY` | aistudio.google.com/app/apikey | AI generation + chat |
| `NEXT_PUBLIC_CONTRACT_ADDRESS` | Remix after deploy | On-chain minting + levelUp |
| `NEXT_PUBLIC_CHAIN_ID` | Leave as `11155111` | Sepolia network |

---

## Demo Flow

```
1. npm run dev → open localhost:3000
2. Click "Connect Wallet" → MetaMask opens → approve Sepolia
3. Click "Create Your Mentor"
4. Type needs → "Help with DSA and motivation"
5. Click "Generate My Mentor" → Gemini AI generates profile
6. Click "Mint Mentor NFT" → MetaMask transaction → confirmed
7. View in Dashboard
8. Click "Chat with Mentor" → AI conversation
9. Click "Complete Task" → +100 XP on blockchain
10. Mentor levels up!
```

---

## Smart Contract Functions

| Function | Description |
|---|---|
| `mintMentor(name, expertise, personality, adviceStyle, tokenURI)` | Mints NFT, stores mentor data |
| `levelUp(tokenId)` | +100 XP, auto levels at 300 XP |
| `getMentor(tokenId)` | Returns full Mentor struct |
| `getLevelHistory(tokenId)` | Returns level-up events |
| `getOwnerTokens(address)` | Returns all token IDs for an address |

---

## Troubleshooting

**"Module not found @/components"**
→ Make sure `jsconfig.json` exists in root with `@/*` path mapping

**"Invalid character" error**
→ Gemini API key is missing or wrong. Check `GEMINI_API_KEY` in `.env.local`

**"gemini-pro not found"**
→ Already fixed — we use `gemini-1.5-flash` (gemini-pro was deprecated)

**MetaMask not switching to Sepolia**
→ Add Sepolia manually: chainId 11155111, RPC https://rpc.sepolia.org

**Contract call fails**
→ App auto-saves to localStorage as demo mode. Deploy the contract for real on-chain data.
