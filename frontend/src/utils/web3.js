import { ethers } from "ethers";
import { CONTRACT_ADDRESS, CONTRACT_ABI } from "./contract";

// Check if MetaMask or another Ethers-compatible wallet is installed
export const hasWalletProvider = () => {
  return typeof window !== "undefined" && window.ethereum !== undefined;
};

// Request wallet connection and return signer/address info
export const connectWallet = async () => {
  if (!hasWalletProvider()) {
    throw new Error("No Ethereum wallet found. Please install MetaMask.");
  }

  try {
    const provider = new ethers.BrowserProvider(window.ethereum);
    const accounts = await window.ethereum.request({ method: "eth_requestAccounts" });
    const signer = await provider.getSigner();
    const address = accounts[0];
    
    // Check if they are on Sepolia network
    const network = await provider.getNetwork();
    const chainId = network.chainId;
    
    return { provider, signer, address, chainId: Number(chainId) };
  } catch (error) {
    console.error("Error connecting wallet:", error);
    throw error;
  }
};

// Switch network to Sepolia (Chain ID 11155111)
export const switchToSepolia = async () => {
  if (!hasWalletProvider()) return;
  try {
    await window.ethereum.request({
      method: "wallet_switchEthereumChain",
      params: [{ chainId: "0xaa36a7" }], // 11155111 in hex
    });
  } catch (switchError) {
    // If the chain is not added, request to add it
    if (switchError.code === 4902) {
      try {
        await window.ethereum.request({
          method: "wallet_addEthereumChain",
          params: [
            {
              chainId: "0xaa36a7",
              chainName: "Sepolia Test Network",
              nativeCurrency: { name: "Sepolia Ether", symbol: "ETH", decimals: 18 },
              rpcUrls: ["https://rpc.ankr.com/eth_sepolia"],
              blockExplorerUrls: ["https://sepolia.etherscan.io"],
            },
          ],
        });
      } catch (addError) {
        console.error("Error adding Sepolia chain:", addError);
      }
    }
    console.error("Error switching to Sepolia:", switchError);
  }
};

// Get contract instance (either read-only or read-write)
export const getContractInstance = (signerOrProvider) => {
  return new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, signerOrProvider);
};

// Load attendee badge info
export const loadAttendeeBadge = async (contract, address) => {
  try {
    const count = await contract.attendanceCount(address);
    const tokenId = await contract.tokenIdOf(address);
    const tierVal = await contract.tierOf(address);
    
    const countNum = Number(count);
    const tokenIdNum = Number(tokenId);
    const tierNum = Number(tierVal); // 0 = Bronze, 1 = Silver, 2 = Gold
    
    let metadata = null;
    let svgImage = null;
    
    if (tokenIdNum > 0) {
      const uri = await contract.tokenURI(tokenIdNum);
      if (uri.startsWith("data:application/json;base64,")) {
        try {
          const base64Data = uri.split(",")[1];
          const decodedJson = JSON.parse(window.atob(base64Data));
          metadata = decodedJson;
          svgImage = decodedJson.image;
        } catch (e) {
          console.error("Failed to parse tokenURI json:", e);
        }
      }
    }
    
    return {
      hasBadge: tokenIdNum > 0,
      tokenId: tokenIdNum,
      attendanceCount: countNum,
      tier: tierNum === 0 ? "Bronze" : tierNum === 1 ? "Silver" : "Gold",
      tierVal: tierNum,
      metadata,
      svgImage
    };
  } catch (error) {
    console.error(`Error loading badge for ${address}:`, error);
    throw error;
  }
};

// Load all events from contract
export const loadAllEvents = async (contract) => {
  try {
    const nextId = await contract.nextEventId();
    const count = Number(nextId);
    const eventsList = [];
    
    for (let i = 1; i <= count; i++) {
      const ev = await contract.events(i);
      if (ev.exists) {
        eventsList.push({
          id: i,
          name: ev.name,
          date: Number(ev.date),
          exists: ev.exists
        });
      }
    }
    // Return newest events first
    return eventsList.reverse();
  } catch (error) {
    console.error("Error loading events:", error);
    throw error;
  }
};

// Load check-in records for a specific event across a list of addresses
export const loadEventCheckedInList = async (contract, eventId, addressesToCheck) => {
  try {
    const checkedInStatus = {};
    for (const address of addressesToCheck) {
      if (ethers.isAddress(address)) {
        const attended = await contract.hasAttendedEvent(address, eventId);
        checkedInStatus[address] = attended;
      }
    }
    return checkedInStatus;
  } catch (error) {
    console.error(`Error loading checked-in status for event ${eventId}:`, error);
    throw error;
  }
};

/* --- Simulated Local Ledger Storage (Mock Sandbox Mode) --- */
const MOCK_STORAGE_KEY = "streak_badge_mock_db";

export const getMockData = () => {
  const defaults = {
    events: [
      { id: 3, name: "Crypto Stamp Summit", date: Date.now() - 3600000 * 24 * 3, exists: true },
      { id: 2, name: "Vaporwave Field Ledger Meetup", date: Date.now() - 3600000 * 24 * 7, exists: true },
      { id: 1, name: "Antigravity Hackathon Day", date: Date.now() - 3600000 * 24 * 14, exists: true }
    ],
    attendance: {
      // Maps address -> array of eventIds
      "0xf39fd6e51aad88f6f4ce6ab8827279cfffb92266": [1, 2], // Admin starts with 2
      "0x70997970c51812dc3a010c7d01b50e0d17dc79c8": [1, 2, 3], // Attendee 1 starts with 3 (Silver)
      "0x3c44cdddb6a900fa2b585dd299e03d12fa4293bc": [1] // Attendee 2 starts with 1 (Bronze)
    },
    nextEventId: 3,
    organizer: "0xf39fd6e51aad88f6f4ce6ab8827279cfffb92266"
  };

  try {
    const stored = localStorage.getItem(MOCK_STORAGE_KEY);
    return stored ? JSON.parse(stored) : defaults;
  } catch (e) {
    return defaults;
  }
};

export const saveMockData = (data) => {
  try {
    localStorage.setItem(MOCK_STORAGE_KEY, JSON.stringify(data));
  } catch (e) {
    console.error("Error saving mock data:", e);
  }
};

export const getMockBadge = (address) => {
  const data = getMockData();
  const attendedIds = data.attendance[address.toLowerCase()] || [];
  const count = attendedIds.length;
  let tier = "Bronze";
  let tierVal = 0;
  if (count >= 5) {
    tier = "Gold";
    tierVal = 2;
  } else if (count >= 3) {
    tier = "Silver";
    tierVal = 1;
  }

  // Generate responsive mock SVG representation
  const color = tierVal === 2 ? "#FFD700" : tierVal === 1 ? "#C0C0C0" : "#CD7F32";
  const svgImage = `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="350" height="350"><rect width="350" height="350" fill="${encodeURIComponent(color)}"/><text x="175" y="160" font-size="28" text-anchor="middle" fill="black" font-family="Oswald">${tier} Badge</text><text x="175" y="200" font-size="18" text-anchor="middle" fill="black" font-family="monospace">Attended: ${count}</text></svg>`;

  return {
    hasBadge: count > 0,
    tokenId: count > 0 ? Math.abs(address.slice(0, 8).hashCode ? address.slice(0, 8).hashCode() : 123) : 0,
    attendanceCount: count,
    tier,
    tierVal,
    svgImage,
    eventsAttended: attendedIds
  };
};

// Helper hash code for generating mock token ID
String.prototype.hashCode = function() {
  let hash = 0;
  for (let i = 0; i < this.length; i++) {
    const char = this.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  return Math.abs(hash);
};
