// ============================================================
// BLOCKCHAIN INTERACTIONS (ethers.js v6)
// Contract is on Ethereum Sepolia Testnet
// CONTRACT_ADDRESS goes in .env.local after you deploy
// ============================================================

import { ethers } from 'ethers'

// ABI - must match your deployed MentorNFT.sol exactly
export const ABI = [
  'function mintMentor(string name, string expertise, string personality, string adviceStyle, string tokenURI_) external returns (uint256)',
  'function levelUp(uint256 tokenId) external',
  'function getMentor(uint256 tokenId) external view returns (tuple(string name, string expertise, string personality, string adviceStyle, uint256 level, uint256 xp, uint256 mintedAt))',
  'function getLevelHistory(uint256 tokenId) external view returns (tuple(uint256 level, uint256 timestamp)[])',
  'function getOwnerTokens(address owner) external view returns (uint256[])',
  'function totalSupply() external view returns (uint256)',
  'event MentorMinted(address indexed owner, uint256 indexed tokenId, string name, string expertise)',
  'event MentorLeveledUp(uint256 indexed tokenId, uint256 newLevel, uint256 xp)',
]

export const CONTRACT_ADDRESS =
  process.env.NEXT_PUBLIC_CONTRACT_ADDRESS ||
  '0x0000000000000000000000000000000000000000'

// Sepolia network config
const SEPOLIA = {
  chainId: '0xAA36A7', // 11155111 in hex
  chainName: 'Sepolia Testnet',
  nativeCurrency: { name: 'SepoliaETH', symbol: 'ETH', decimals: 18 },
  rpcUrls: ['https://rpc.sepolia.org'],
  blockExplorerUrls: ['https://sepolia.etherscan.io'],
}

// ---- Connect MetaMask wallet ----
export async function connectWallet() {
  if (!window.ethereum) {
    throw new Error('MetaMask not installed. Please install MetaMask from metamask.io')
  }

  const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' })

  // Switch to Sepolia
  try {
    await window.ethereum.request({
      method: 'wallet_switchEthereumChain',
      params: [{ chainId: SEPOLIA.chainId }],
    })
  } catch (err) {
    if (err.code === 4902) {
      // Sepolia not added yet, add it
      await window.ethereum.request({
        method: 'wallet_addEthereumChain',
        params: [SEPOLIA],
      })
    } else {
      throw err
    }
  }

  return accounts[0]
}

// ---- Get current connected account ----
export async function getCurrentAccount() {
  if (!window.ethereum) return null
  const accounts = await window.ethereum.request({ method: 'eth_accounts' })
  return accounts[0] || null
}

// ---- Get ethers provider/signer ----
function getProvider() {
  if (!window.ethereum) throw new Error('MetaMask not found')
  return new ethers.BrowserProvider(window.ethereum)
}

async function getSigner() {
  const provider = getProvider()
  return provider.getSigner()
}

function getContract(signerOrProvider) {
  return new ethers.Contract(CONTRACT_ADDRESS, ABI, signerOrProvider)
}

// ---- Mint a new mentor NFT ----
export async function mintMentorNFT({ name, expertise, personality, adviceStyle, tokenURI }) {
  const signer = await getSigner()
  const contract = getContract(signer)

  const tx = await contract.mintMentor(name, expertise, personality, adviceStyle, tokenURI)
  console.log('Mint tx sent:', tx.hash)

  const receipt = await tx.wait()
  console.log('Mint confirmed in block:', receipt.blockNumber)

  // Get tokenId from MentorMinted event
  let tokenId = null
  for (const log of receipt.logs) {
    try {
      const parsed = contract.interface.parseLog(log)
      if (parsed?.name === 'MentorMinted') {
        tokenId = parsed.args.tokenId.toString()
        break
      }
    } catch {
      // skip unparseable logs
    }
  }

  return { tokenId, txHash: receipt.hash }
}

// ---- Level up a mentor (earn XP) ----
export async function levelUpMentor(tokenId) {
  const signer = await getSigner()
  const contract = getContract(signer)

  const tx = await contract.levelUp(tokenId)
  console.log('LevelUp tx sent:', tx.hash)

  const receipt = await tx.wait()
  console.log('LevelUp confirmed')

  return receipt.hash
}

// ---- Read mentor data from chain ----
export async function getMentorFromChain(tokenId) {
  const provider = getProvider()
  const contract = getContract(provider)

  const m = await contract.getMentor(tokenId)
  const history = await contract.getLevelHistory(tokenId)

  return {
    name: m.name,
    expertise: m.expertise,
    personality: m.personality,
    adviceStyle: m.adviceStyle,
    level: Number(m.level),
    xp: Number(m.xp),
    mintedAt: Number(m.mintedAt),
    levelHistory: history.map((h) => ({
      level: Number(h.level),
      timestamp: Number(h.timestamp),
    })),
  }
}

// ---- Get all token IDs owned by address ----
export async function getOwnerTokens(address) {
  const provider = getProvider()
  const contract = getContract(provider)
  const tokens = await contract.getOwnerTokens(address)
  return tokens.map((t) => t.toString())
}

// ---- Helpers ----
export function shortAddress(addr) {
  if (!addr) return ''
  return `${addr.slice(0, 6)}...${addr.slice(-4)}`
}

export function xpProgressPercent(level, xp) {
  const xpThisLevel = xp - (level - 1) * 300
  const xpNeeded = 300
  return Math.min(100, Math.max(0, Math.round((xpThisLevel / xpNeeded) * 100)))
}

export function xpToNextLevel(level, xp) {
  return Math.max(0, level * 300 - xp)
}
