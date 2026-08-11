import React, { useState, useEffect } from "react";
import { ethers } from "ethers";
import { 
  BookOpen, 
  User, 
  ShieldAlert, 
  Calendar, 
  Plus, 
  ArrowLeft, 
  Users, 
  FileText,
  Copy, 
  Check, 
  Sparkles,
  Award,
  Layers,
  Laptop
} from "lucide-react";
import { 
  hasWalletProvider, 
  connectWallet, 
  switchToSepolia, 
  getContractInstance, 
  loadAttendeeBadge, 
  loadAllEvents, 
  loadEventCheckedInList,
  getMockData, 
  saveMockData, 
  getMockBadge
} from "./utils/web3";
import { CONTRACT_ADDRESS } from "./utils/contract";

/* --- Hand-Stamped SVG Components --- */

// SVG Roughness Filter to simulate ink bleed/irregularity
const InkBleedFilter = () => (
  <svg style={{ position: "absolute", width: 0, height: 0 }} width="0" height="0">
    <filter id="ink-bleed">
      <feTurbulence type="fractalNoise" baseFrequency="0.04" numOctaves="3" result="noise" />
      <feDisplacementMap in="SourceGraphic" in2="noise" scale="2.5" xChannelSelector="R" yChannelSelector="G" />
    </filter>
  </svg>
);

// Locked Badge Stamp Placeholder (Dashed Ring, Locked text)
const StampLocked = ({ size = 130 }) => {
  return (
    <div className="ink-stamp-graphic" style={{ color: "#8c9b91", transform: "rotate(0deg)", opacity: 0.4 }}>
      <svg width={size} height={size} viewBox="0 0 120 120" style={{ fill: "none", stroke: "currentColor", strokeWidth: 2 }}>
        <circle cx="60" cy="60" r="50" strokeDasharray="4,4" />
        <circle cx="60" cy="60" r="44" strokeWidth={0.5} strokeDasharray="2,2" />
        <text x="60" y="48" textAnchor="middle" fill="currentColor" stroke="none" fontSize="10" fontWeight="bold" fontFamily="Oswald" letterSpacing="1">STREAK BADGE</text>
        <text x="60" y="70" textAnchor="middle" fill="currentColor" stroke="none" fontSize="16" fontWeight="bold" fontFamily="Oswald" letterSpacing="1.5">LOCKED</text>
        <text x="60" y="85" textAnchor="middle" fill="currentColor" stroke="none" fontSize="8" fontFamily="Space Mono">0 CHECK-INS</text>
      </svg>
    </div>
  );
};

// Bronze Tier Stamp (Single Plain Ring)
const StampBronze = ({ color = "#CD7F32", size = 130, count = "" }) => {
  return (
    <div className="ink-stamp-graphic" style={{ color, transform: "rotate(-3deg)" }}>
      <svg width={size} height={size} viewBox="0 0 120 120" style={{ fill: "none", stroke: "currentColor", strokeWidth: 3 }}>
        <circle cx="60" cy="60" r="50" />
        <circle cx="60" cy="60" r="46" strokeWidth={1} strokeDasharray="4,2" />
        <text x="60" y="45" textAnchor="middle" fill="currentColor" stroke="none" fontSize="11" fontWeight="bold" fontFamily="Oswald">STREAK BADGE</text>
        <text x="60" y="68" textAnchor="middle" fill="currentColor" stroke="none" fontSize="18" fontWeight="bold" fontFamily="Oswald">BRONZE</text>
        <text x="60" y="85" textAnchor="middle" fill="currentColor" stroke="none" fontSize="8" fontFamily="Space Mono">
          {count !== "" ? `COUNT: ${count.toString().padStart(2, "0")}` : "RECORDED"}
        </text>
      </svg>
    </div>
  );
};

// Silver Tier Stamp (Double Ring)
const StampSilver = ({ color = "#C0C0C0", size = 130, count = "" }) => {
  return (
    <div className="ink-stamp-graphic" style={{ color, transform: "rotate(4deg)" }}>
      <svg width={size} height={size} viewBox="0 0 120 120" style={{ fill: "none", stroke: "currentColor", strokeWidth: 3.5 }}>
        <circle cx="60" cy="60" r="50" />
        <circle cx="60" cy="60" r="44" strokeWidth={1.5} />
        <text x="60" y="44" textAnchor="middle" fill="currentColor" stroke="none" fontSize="11" fontWeight="bold" fontFamily="Oswald">STREAK BADGE</text>
        <text x="60" y="68" textAnchor="middle" fill="currentColor" stroke="none" fontSize="18" fontWeight="bold" fontFamily="Oswald">SILVER</text>
        <text x="60" y="85" textAnchor="middle" fill="currentColor" stroke="none" fontSize="8" fontFamily="Space Mono">
          {count !== "" ? `COUNT: ${count.toString().padStart(2, "0")}` : "RECORDED"}
        </text>
      </svg>
    </div>
  );
};

// Gold Tier Stamp (Ring with Starburst)
const StampGold = ({ color = "#FFD700", size = 130, count = "" }) => {
  // Generate 16 points for a starburst inside the ring
  const starPoints = [];
  for (let i = 0; i < 32; i++) {
    const r = i % 2 === 0 ? 32 : 22;
    const angle = (i * Math.PI) / 16;
    const x = 60 + r * Math.cos(angle);
    const y = 60 + r * Math.sin(angle);
    starPoints.push(`${x},${y}`);
  }
  const pointsStr = starPoints.join(" ");

  return (
    <div className="ink-stamp-graphic" style={{ color, transform: "rotate(-5deg)" }}>
      <svg width={size} height={size} viewBox="0 0 120 120" style={{ fill: "none", stroke: "currentColor", strokeWidth: 3.5 }}>
        <circle cx="60" cy="60" r="52" />
        <polygon points={pointsStr} strokeWidth={1.2} strokeDasharray="3,1" />
        <text x="60" y="52" textAnchor="middle" fill="currentColor" stroke="none" fontSize="11" fontWeight="bold" fontFamily="Oswald">STREAK BADGE</text>
        <text x="60" y="72" textAnchor="middle" fill="currentColor" stroke="none" fontSize="20" fontWeight="bold" fontFamily="Oswald">GOLD</text>
        <text x="60" y="88" textAnchor="middle" fill="currentColor" stroke="none" fontSize="8" fontFamily="Space Mono">
          {count !== "" ? `COUNT: ${count.toString().padStart(2, "0")}` : "RECORDED"}
        </text>
      </svg>
    </div>
  );
};

// Standard Sienna Check-in Stamp for Attendance Logs
const StampCheckIn = ({ size = 95, dateText = "APPROVED", eventId = "" }) => {
  return (
    <div className="ink-stamp-graphic" style={{ color: "var(--color-sienna)" }}>
      <svg width={size} height={size * 0.55} viewBox="0 0 120 66" style={{ fill: "none", stroke: "currentColor", strokeWidth: 3 }}>
        <rect x="5" y="5" width="110" height="56" rx="2" strokeDasharray="250" />
        <rect x="9" y="9" width="102" height="48" rx="1" strokeWidth={1} strokeDasharray="4,2" />
        <text x="60" y="27" textAnchor="middle" fill="currentColor" stroke="none" fontSize="12" fontWeight="bold" fontFamily="Oswald">CHECKED IN</text>
        <text x="60" y="42" textAnchor="middle" fill="currentColor" stroke="none" fontSize="8" fontFamily="Space Mono">{dateText}</text>
        <text x="60" y="51" textAnchor="middle" fill="currentColor" stroke="none" fontSize="7" fontFamily="Space Mono">{eventId ? `EVENT ID: ${eventId}` : "CONFIRMED"}</text>
      </svg>
    </div>
  );
};

export default function App() {
  // Navigation & Connection states
  const [isMockMode, setIsMockMode] = useState(true);
  const [inLedger, setInLedger] = useState(false); // true when user clicks "Open Ledger"
  const [activeTab, setActiveTab] = useState("my-badge"); // my-badge, organizer
  const [userAddress, setUserAddress] = useState("");
  const [isConnecting, setIsConnecting] = useState(false);
  const [selectedEventId, setSelectedEventId] = useState(null); // When viewing event sign-in sheet
  
  // Blockchain connection states
  const [provider, setProvider] = useState(null);
  const [signer, setSigner] = useState(null);
  const [chainId, setChainId] = useState(null);
  
  // Domain data states
  const [badgeInfo, setBadgeInfo] = useState({
    hasBadge: false,
    tokenId: 0,
    attendanceCount: 0,
    tier: "Bronze",
    tierVal: 0,
    svgImage: null
  });
  const [events, setEvents] = useState([]);
  const [organizerAddress, setOrganizerAddress] = useState("");
  const [isOrganizer, setIsOrganizer] = useState(false);
  
  // UI animation and message state
  const [slammingStamp, setSlammingStamp] = useState(false);
  const [alertMsg, setAlertMsg] = useState(null);
  const [successMsg, setSuccessMsg] = useState(null);
  
  // Form input states
  const [newEventName, setNewEventName] = useState("");
  const [newEventDate, setNewEventDate] = useState("");
  const [singleAttendee, setSingleAttendee] = useState("");
  const [batchAttendees, setBatchAttendees] = useState("");
  const [checkInEventId, setCheckInEventId] = useState("");
  
  // Clipboard copied indicator
  const [copied, setCopied] = useState(false);

  // Load state depending on mode
  useEffect(() => {
    if (isMockMode) {
      loadMockState();
    } else {
      loadWeb3State();
    }
  }, [isMockMode, userAddress]);

  // Alert/Notification timeout
  useEffect(() => {
    if (alertMsg) {
      const timer = setTimeout(() => setAlertMsg(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [alertMsg]);

  useEffect(() => {
    if (successMsg) {
      const timer = setTimeout(() => setSuccessMsg(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [successMsg]);

  // Load Mock State
  const loadMockState = () => {
    const mockDb = getMockData();
    setEvents(mockDb.events);
    setOrganizerAddress(mockDb.organizer);
    
    // Set a default mock user if none connected
    const activeAddress = userAddress || "0x70997970c51812dc3a010c7d01b50e0d17dc79c8";
    if (!userAddress) {
      setUserAddress(activeAddress);
    }
    
    const badge = getMockBadge(activeAddress);
    setBadgeInfo(badge);
    
    const isOrg = activeAddress.toLowerCase() === mockDb.organizer.toLowerCase();
    setIsOrganizer(isOrg);
  };

  // Load Web3 State from Sepolia Contract
  const loadWeb3State = async () => {
    if (!userAddress) return;
    try {
      let web3Provider = provider;
      if (!web3Provider) {
        const connection = await connectWallet();
        web3Provider = connection.provider;
        setProvider(connection.provider);
        setSigner(connection.signer);
        setChainId(connection.chainId);
      }
      const contract = getContractInstance(web3Provider);
      
      // Load Organizer
      const org = await contract.organizer();
      setOrganizerAddress(org);
      setIsOrganizer(userAddress.toLowerCase() === org.toLowerCase());
      
      // Load events
      const evs = await loadAllEvents(contract);
      setEvents(evs);
      
      // Load attendee badge
      const badge = await loadAttendeeBadge(contract, userAddress);
      setBadgeInfo(badge);
    } catch (err) {
      console.error(err);
      triggerAlert("Failed to load blockchain state. Ensure you are connected to Sepolia.");
    }
  };

  // Connect MetaMask Wallet
  const handleConnectWallet = async () => {
    setIsConnecting(true);
    try {
      const connection = await connectWallet();
      setUserAddress(connection.address);
      setProvider(connection.provider);
      setSigner(connection.signer);
      setChainId(connection.chainId);
      setIsMockMode(false);
      setInLedger(true);
      
      if (connection.chainId !== 11155111) {
        triggerAlert("Please switch your network to Sepolia!");
        await switchToSepolia();
      }
      triggerSuccess("Wallet connected to Sepolia ledger.");
    } catch (err) {
      console.error(err);
      triggerAlert("Failed to connect wallet: " + err.message);
    } finally {
      setIsConnecting(false);
    }
  };

  // Handle Mock Login (Sandbox)
  const handleEnterMock = () => {
    setIsMockMode(true);
    setInLedger(true);
    triggerSuccess("Entering simulated Ledger Sandbox mode.");
  };

  const handleToggleMock = (e) => {
    const checked = e.target.checked;
    if (checked) {
      setIsMockMode(true);
      triggerSuccess("Switched to offline Simulated Ledger.");
    } else {
      if (hasWalletProvider()) {
        handleConnectWallet();
      } else {
        triggerAlert("MetaMask/Ethereum Wallet not detected. Reverting to Simulated Ledger.");
        setIsMockMode(true);
      }
    }
  };

  // Disconnect active wallet / session
  const handleDisconnect = () => {
    setUserAddress("");
    setProvider(null);
    setSigner(null);
    setChainId(null);
    setIsMockMode(true);
    setInLedger(false);
    triggerSuccess("Wallet disconnected from ledger.");
  };

  // Alert triggers
  const triggerAlert = (msg) => {
    setAlertMsg(msg);
  };

  const triggerSuccess = (msg) => {
    setSuccessMsg(msg);
  };

  // Copy Contract Address
  const copyAddress = () => {
    navigator.clipboard.writeText(CONTRACT_ADDRESS);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  /* --- Transaction Operations --- */

  // 1. Create Event
  const handleCreateEvent = async (e) => {
    e.preventDefault();
    if (!newEventName || !newEventDate) {
      triggerAlert("Please enter event name and date.");
      return;
    }

    const eventDateUnix = Math.floor(new Date(newEventDate).getTime() / 1000);

    if (isMockMode) {
      const mockDb = getMockData();
      const newId = mockDb.nextEventId + 1;
      const newEvent = { id: newId, name: newEventName, date: eventDateUnix * 1000, exists: true };
      
      mockDb.events.unshift(newEvent); // Add to beginning
      mockDb.nextEventId = newId;
      saveMockData(mockDb);
      
      setEvents(mockDb.events);
      setNewEventName("");
      setNewEventDate("");
      triggerSuccess(`Event #${newId} "${newEventName}" successfully registered.`);
    } else {
      try {
        const contract = getContractInstance(signer);
        const tx = await contract.createEvent(newEventName, eventDateUnix);
        triggerSuccess("Broadcasting event registration...");
        await tx.wait();
        triggerSuccess(`Event "${newEventName}" created successfully on Sepolia.`);
        setNewEventName("");
        setNewEventDate("");
        loadWeb3State();
      } catch (err) {
        console.error(err);
        triggerAlert("Error creating event: " + (err.reason || err.message));
      }
    }
  };

  // 2. Single Check-In (with slamming stamp animation)
  const handleSingleCheckIn = async (e) => {
    e.preventDefault();
    if (!singleAttendee || !checkInEventId) {
      triggerAlert("Attendee address and event choice are required.");
      return;
    }

    if (!ethers.isAddress(singleAttendee.trim())) {
      triggerAlert("Invalid attendee wallet address format.");
      return;
    }

    const attendee = singleAttendee.trim().toLowerCase();
    const eventId = Number(checkInEventId);

    if (isMockMode) {
      const mockDb = getMockData();
      
      // Check if event exists
      const eventExists = mockDb.events.some(ev => ev.id === eventId);
      if (!eventExists) {
        triggerAlert("Selected event does not exist.");
        return;
      }

      // Check if already checked in
      const list = mockDb.attendance[attendee] || [];
      if (list.includes(eventId)) {
        triggerAlert("This attendee is already stamped into this event.");
        return;
      }

      // Add check-in
      list.push(eventId);
      mockDb.attendance[attendee] = list;
      saveMockData(mockDb);

      // Trigger Slam Stamp Animation
      setSlammingStamp(true);
      setTimeout(() => {
        setSlammingStamp(false);
        triggerSuccess(`Successfully stamped check-in for address ${attendee.slice(0,6)}...`);
      }, 1000);

      // Reset Form & Reload state
      setSingleAttendee("");
      loadMockState();
    } else {
      try {
        const contract = getContractInstance(signer);
        
        // Check if already checked in
        const alreadyChecked = await contract.hasAttendedEvent(attendee, eventId);
        if (alreadyChecked) {
          triggerAlert("This attendee has already been checked in for this event.");
          return;
        }

        const tx = await contract.checkIn(attendee, eventId);
        triggerSuccess("Submitting check-in stamp to contract...");
        await tx.wait();

        // Trigger Stamp Slam on confirmation
        setSlammingStamp(true);
        setTimeout(() => {
          setSlammingStamp(false);
          triggerSuccess("Attendee badge updated on-chain!");
        }, 1000);

        setSingleAttendee("");
        loadWeb3State();
      } catch (err) {
        console.error(err);
        triggerAlert("Check-in transaction failed: " + (err.reason || err.message));
      }
    }
  };

  // 3. Batch Check-In
  const handleBatchCheckIn = async (e) => {
    e.preventDefault();
    if (!batchAttendees || !checkInEventId) {
      triggerAlert("Please choose an event and paste attendee addresses.");
      return;
    }

    const addressList = batchAttendees
      .split(/[\n,]+/)
      .map(addr => addr.trim())
      .filter(addr => addr.length > 0);

    const validAddresses = [];
    const invalidAddresses = [];

    addressList.forEach(addr => {
      if (ethers.isAddress(addr)) {
        validAddresses.push(addr.toLowerCase());
      } else {
        invalidAddresses.push(addr);
      }
    });

    if (invalidAddresses.length > 0) {
      triggerAlert(`Detected ${invalidAddresses.length} invalid addresses. Please correct them.`);
      return;
    }

    if (validAddresses.length === 0) {
      triggerAlert("No valid addresses found in the entry field.");
      return;
    }

    const eventId = Number(checkInEventId);

    if (isMockMode) {
      const mockDb = getMockData();
      let checkInCount = 0;

      validAddresses.forEach(attendee => {
        const list = mockDb.attendance[attendee] || [];
        if (!list.includes(eventId)) {
          list.push(eventId);
          mockDb.attendance[attendee] = list;
          checkInCount++;
        }
      });

      saveMockData(mockDb);

      setSlammingStamp(true);
      setTimeout(() => {
        setSlammingStamp(false);
        triggerSuccess(`Batch check-in complete. Stamp applied to ${checkInCount} attendee accounts.`);
      }, 1000);

      setBatchAttendees("");
      loadMockState();
    } else {
      try {
        const contract = getContractInstance(signer);
        const tx = await contract.checkInBatch(validAddresses, eventId);
        triggerSuccess("Submitting batch check-in stamp...");
        await tx.wait();

        setSlammingStamp(true);
        setTimeout(() => {
          setSlammingStamp(false);
          triggerSuccess(`Successfully processed batch of ${validAddresses.length} attendees.`);
        }, 1000);

        setBatchAttendees("");
        loadWeb3State();
      } catch (err) {
        console.error(err);
        triggerAlert("Batch check-in transaction failed: " + (err.reason || err.message));
      }
    }
  };

  /* --- Helper Rendering Functions --- */

  const renderBadgeStamp = (tier, count, hasBadge = true) => {
    if (!hasBadge) {
      return <StampLocked size={145} />;
    }
    switch (tier) {
      case "Gold":
        return <StampGold color="var(--color-gold)" size={145} count={count} />;
      case "Silver":
        return <StampSilver color="var(--color-silver)" size={145} count={count} />;
      default:
        return <StampBronze color="var(--color-bronze)" size={145} count={count} />;
    }
  };

  const getTierStats = () => {
    const c = badgeInfo.attendanceCount;
    if (c >= 5) {
      return { current: "Gold", next: "Max Level Reached", remaining: 0, progress: 100 };
    } else if (c >= 3) {
      return { current: "Silver", next: "Gold", remaining: 5 - c, progress: ((c - 3) / 2) * 100 };
    } else {
      return { current: "Bronze", next: "Silver", remaining: 3 - c, progress: (c / 3) * 100 };
    }
  };

  return (
    <div className={`app-wrapper ${slammingStamp ? "shake-screen" : ""}`}>
      {/* SVG Ink Distortion Filter */}
      <InkBleedFilter />

      {/* Main Container */}
      <div style={{ maxWidth: "1000px", margin: "0 auto", padding: "1.5rem" }}>
        
        {/* Top Ledger Header Bar */}
        <header style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "2rem", color: "#EDE6D6" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
            <BookOpen size={24} style={{ color: "var(--color-sienna)" }} />
            <span style={{ fontFamily: "var(--font-headers)", fontSize: "1.5rem", letterSpacing: "1px" }}>STREAKBADGE</span>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
            {/* Sandbox toggle badge */}
            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", background: "rgba(255,255,255,0.05)", padding: "0.3rem 0.8rem", borderRadius: "100px", border: "1px solid rgba(255,255,255,0.1)" }}>
              <Laptop size={14} style={{ color: isMockMode ? "var(--color-gold)" : "#8c9b91" }} />
              <span style={{ fontSize: "0.75rem", fontWeight: "bold" }}>
                {isMockMode ? "SANDBOX MODE" : "SEPOLIA BLOCKCHAIN"}
              </span>
              <input 
                type="checkbox" 
                checked={isMockMode} 
                onChange={handleToggleMock}
                style={{ cursor: "pointer" }}
              />
            </div>
            
            {userAddress && (
              <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                <span style={{ fontSize: "0.8rem", color: "#a5b5ab", background: "#111815", padding: "0.4rem 0.8rem", borderRadius: "4px" }}>
                  LOGGED: {userAddress.slice(0, 6)}...{userAddress.slice(-4)}
                </span>
                <button 
                  onClick={handleDisconnect}
                  style={{
                    background: "rgba(181, 75, 58, 0.15)",
                    border: "1px solid var(--color-sienna)",
                    color: "var(--color-sienna)",
                    cursor: "pointer",
                    fontSize: "0.75rem",
                    padding: "0.4rem 0.8rem",
                    borderRadius: "4px",
                    fontFamily: "var(--font-headers)",
                    textTransform: "uppercase",
                    transition: "all 0.2s ease"
                  }}
                  onMouseEnter={(e) => {
                    e.target.style.background = "var(--color-sienna)";
                    e.target.style.color = "var(--color-parchment)";
                  }}
                  onMouseLeave={(e) => {
                    e.target.style.background = "rgba(181, 75, 58, 0.15)";
                    e.target.style.color = "var(--color-sienna)";
                  }}
                >
                  Disconnect
                </button>
              </div>
            )}
          </div>
        </header>

        {/* Global Notifications */}
        {alertMsg && (
          <div className="ledger-alert" style={{ fontFamily: "var(--font-mono)" }}>
            <span style={{ fontWeight: "bold" }}>[WARNING] </span> {alertMsg}
          </div>
        )}
        {successMsg && (
          <div className="ledger-alert" style={{ borderLeftColor: "#2a754b", background: "rgba(42,117,75,0.1)", color: "#1e5234", fontFamily: "var(--font-mono)" }}>
            <span style={{ fontWeight: "bold" }}>[RECORDED] </span> {successMsg}
          </div>
        )}

        {/* ==================== SCREEN 1: LANDING / CONNECT COVER ==================== */}
        {!inLedger ? (
          <div className="ledger-cover">
            <div style={{ border: "2px dashed rgba(237, 230, 214, 0.2)", padding: "3rem 1.5rem", borderRadius: "4px" }}>
              <div style={{ marginBottom: "2rem" }}>
                <span style={{ color: "var(--color-sienna)", fontFamily: "var(--font-headers)", fontSize: "1.3rem", letterSpacing: "3px" }}>OFFICIAL REGISTER</span>
                <h1 style={{ color: "var(--color-parchment)", fontSize: "3.5rem", margin: "0.5rem 0", lineHeight: "1.1" }}>
                  Streak Badge
                </h1>
                <p style={{ color: "#7a8a80", fontSize: "0.85rem", textTransform: "uppercase", letterSpacing: "1px" }}>
                  On-chain event attendance ledger
                </p>
              </div>

              {/* SPECIMEN BADGES STAMP ROW */}
              <div style={{ background: "rgba(0,0,0,0.2)", padding: "1.5rem", borderRadius: "6px", margin: "2rem 0", border: "1px solid rgba(255,255,255,0.05)" }}>
                <span style={{ color: "#7a8a80", fontSize: "0.75rem", display: "block", marginBottom: "1.5rem", letterSpacing: "2px" }}>SPECIMEN STAMPS (TIER LEVELS)</span>
                <div style={{ display: "flex", justifyContent: "space-around", gap: "1rem", flexWrap: "wrap" }}>
                  <div style={{ textAlign: "center" }}>
                    <StampBronze color="var(--color-bronze)" size={90} />
                    <div style={{ color: "#a5b5ab", fontSize: "0.7rem", marginTop: "0.5rem" }}>BRONZE<br/>(1-2 Checkins)</div>
                  </div>
                  <div style={{ textAlign: "center" }}>
                    <StampSilver color="var(--color-silver)" size={90} />
                    <div style={{ color: "#a5b5ab", fontSize: "0.7rem", marginTop: "0.5rem" }}>SILVER<br/>(3-4 Checkins)</div>
                  </div>
                  <div style={{ textAlign: "center" }}>
                    <StampGold color="var(--color-gold)" size={90} />
                    <div style={{ color: "#a5b5ab", fontSize: "0.7rem", marginTop: "0.5rem" }}>GOLD<br/>(5+ Checkins)</div>
                  </div>
                </div>
              </div>

              {/* ACTION BUTTONS */}
              <div style={{ display: "flex", flexDirection: "column", gap: "1rem", maxWidth: "340px", margin: "0 auto" }}>
                <button className="btn-stamp" onClick={handleConnectWallet} disabled={isConnecting} style={{ width: "100%", justifyContent: "center" }}>
                  {isConnecting ? "Connecting Signer..." : "Connect Wallet (Sepolia)"}
                </button>
                <button className="btn-stamp secondary" onClick={handleEnterMock} style={{ width: "100%", justifyContent: "center" }}>
                  Open Ledger Sandbox
                </button>
              </div>

              <div style={{ marginTop: "2.5rem", color: "#54645a", fontSize: "0.75rem" }}>
                StreakBadge contract deployed to Sepolia at:<br/>
                <span style={{ fontFamily: "var(--font-mono)", color: "#7a8a80" }}>
                  {CONTRACT_ADDRESS}
                </span>
              </div>

              <div style={{ marginTop: "1.5rem", padding: "0.75rem", borderRadius: "4px", border: "1px solid rgba(205, 127, 50, 0.2)", background: "rgba(205, 127, 50, 0.05)", textAlign: "left", fontSize: "0.75rem", color: "#a5b5ab", lineHeight: "1.4" }}>
                <span style={{ color: "var(--color-sienna)", fontWeight: "bold", display: "block", marginBottom: "0.25rem" }}>⚠️ Note on MetaMask Security Warnings</span>
                Since this smart contract is newly deployed to the Sepolia testnet and running on localhost, MetaMask's automated security filter (Blockaid) may display a caution warning. This is a common false positive for new testnet development. It is completely safe to bypass by clicking "Proceed" or "Ignore warning".
              </div>
            </div>
          </div>
        ) : (
          /* ==================== LEDGER APPLICATION MAIN SHEET ==================== */
          <div>
            
            {/* Tabs matching vintage ledger folder structure */}
            <div className="ledger-tabs">
              <button 
                className={`ledger-tab ${activeTab === "my-badge" && !selectedEventId ? "active" : ""}`}
                onClick={() => { setActiveTab("my-badge"); setSelectedEventId(null); }}
              >
                <User size={14} style={{ display: "inline", marginRight: "4px", verticalAlign: "text-bottom" }} />
                My Ledger Badge
              </button>
              <button 
                className={`ledger-tab ${activeTab === "organizer" && !selectedEventId ? "active" : ""}`}
                onClick={() => { setActiveTab("organizer"); setSelectedEventId(null); }}
              >
                <Layers size={14} style={{ display: "inline", marginRight: "4px", verticalAlign: "text-bottom" }} />
                Organizer Check-in Desk
              </button>
              {selectedEventId && (
                <button className="ledger-tab active">
                  <FileText size={14} style={{ display: "inline", marginRight: "4px", verticalAlign: "text-bottom" }} />
                  Sign-In Sheet (Event #{selectedEventId})
                </button>
              )}
            </div>

            <div className="parchment-card">
              
              {/* ==================== SCREEN 2: MY BADGE (ATTENDEE) ==================== */}
              {activeTab === "my-badge" && !selectedEventId && (
                <div>
                  <div className="ledger-header" style={{ display: "flex", justifyContent: "space-between", flexWrap: "wrap", gap: "1rem" }}>
                    <div>
                      <span style={{ fontSize: "0.8rem", color: "var(--color-sienna)", fontWeight: "bold" }}>ATTENDEE PORTFOLIO</span>
                      <h2>LEDGER CARD SUMMARY</h2>
                      <p style={{ fontSize: "0.85rem", opacity: 0.8 }}>Holder Address: <span style={{ textDecoration: "underline" }}>{userAddress}</span></p>
                    </div>
                    <div style={{ textAlign: "right" }}>
                      <span style={{ fontSize: "0.8rem", opacity: 0.6 }}>REGISTERED ON-CHAIN:</span>
                      <div style={{ fontFamily: "var(--font-headers)", fontSize: "1.4rem", color: "var(--color-sienna)" }}>
                        {badgeInfo.hasBadge ? `NFT TOKEN #${badgeInfo.tokenId}` : "NO BADGE MINTED YET"}
                      </div>
                    </div>
                  </div>

                  <div style={{ display: "grid", gridTemplateColumns: "1fr", md: "1fr 1fr", gap: "3rem", marginTop: "1rem" }}>
                    
                    {/* Visual Badge Display */}
                    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", border: "1px dashed rgba(90, 82, 70, 0.2)", padding: "2rem", borderRadius: "4px", background: "rgba(0,0,0,0.02)" }}>
                      <span style={{ fontSize: "0.75rem", letterSpacing: "1px", marginBottom: "1.5rem", opacity: 0.7 }}>
                        {badgeInfo.hasBadge ? "ACTIVE INK BADGE" : "NO BADGE EARNED"}
                      </span>
                      
                      <div className="stamp-container">
                        {renderBadgeStamp(badgeInfo.tier, badgeInfo.attendanceCount, badgeInfo.hasBadge)}
                      </div>
                      
                      <div style={{ textAlign: "center", marginTop: "1.5rem" }}>
                        <div style={{ fontFamily: "var(--font-headers)", fontSize: "1.6rem", color: "var(--color-sienna)", textTransform: "uppercase" }}>
                          {badgeInfo.hasBadge ? `${badgeInfo.tier} TIER` : "LOCKED"}
                        </div>
                        <div style={{ fontSize: "0.85rem", opacity: 0.7 }}>
                          Total check-ins registered: {badgeInfo.attendanceCount}
                        </div>
                      </div>
                    </div>

                    {/* Progress Punch Card & NFT Metadata */}
                    <div style={{ display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
                      
                      {/* Attendance Stamp Punch Card */}
                      <div style={{ border: "2px solid #7c7262", padding: "1.5rem", borderRadius: "4px", background: "rgba(0,0,0,0.01)", position: "relative" }}>
                        <div style={{ position: "absolute", top: "-12px", left: "20px", background: "var(--color-parchment)", padding: "0 10px", fontSize: "0.8rem", fontWeight: "bold", border: "1px solid #7c7262" }}>
                          ATTENDANCE PUNCH CARD
                        </div>

                        <p style={{ fontSize: "0.8rem", marginBottom: "1rem", opacity: 0.8 }}>
                          Stamp evolution tracker (Next level: <span style={{ fontWeight: "bold" }}>{getTierStats().next}</span>)
                        </p>

                        {/* Punch Grid */}
                        <div className="stamp-punch-grid">
                          {[1, 2, 3, 4, 5].map((index) => {
                            const isPunched = badgeInfo.attendanceCount >= index;
                            return (
                              <div key={index} className={`punch-slot ${isPunched ? "punched" : ""}`}>
                                <span className="punch-index">{index}</span>
                                {isPunched && (
                                  <StampCheckIn size={55} dateText="CHECKED" eventId={index} />
                                )}
                              </div>
                            );
                          })}
                        </div>

                        {getTierStats().remaining > 0 ? (
                          <div style={{ fontSize: "0.8rem", color: "var(--color-sienna)", fontWeight: "bold" }}>
                            * Need {getTierStats().remaining} more check-in stamps to upgrade to {getTierStats().next} Badge.
                          </div>
                        ) : (
                          <div style={{ fontSize: "0.8rem", color: "var(--color-gold)", fontWeight: "bold", background: "rgba(0,0,0,0.05)", padding: "0.3rem", borderRadius: "2px", textAlign: "center" }}>
                            ★ GOLD TIER MASTER LEDGER ACHIEVED ★
                          </div>
                        )}
                      </div>

                      {/* On-Chain Decoded Metadata Detail */}
                      <div style={{ marginTop: "1.5rem" }}>
                        <h4 style={{ fontSize: "0.9rem", color: "#1a251e", borderBottom: "1px solid #c0b6a2", paddingBottom: "0.3rem", marginBottom: "0.75rem" }}>
                          On-Chain NFT Record
                        </h4>
                        
                        {badgeInfo.hasBadge ? (
                          <div style={{ fontSize: "0.75rem", fontFamily: "var(--font-mono)" }}>
                            <div style={{ display: "flex", justifyContent: "space-between" }}>
                              <span>TOKEN ID:</span>
                              <span style={{ fontWeight: "bold" }}>{badgeInfo.tokenId}</span>
                            </div>
                            <div style={{ display: "flex", justifyContent: "space-between" }}>
                              <span>DESCRIPTION:</span>
                              <span>Evolving attendance record</span>
                            </div>
                            {/* Option to toggle viewing raw JSON or SVG */}
                            <div style={{ marginTop: "0.75rem", padding: "0.5rem", background: "rgba(0,0,0,0.03)", borderRadius: "2px", border: "1px dashed #c0b6a2" }}>
                              <span style={{ fontSize: "0.7rem", color: "var(--color-sienna)", cursor: "pointer", textDecoration: "underline" }} onClick={() => {
                                if (badgeInfo.svgImage) {
                                  const win = window.open();
                                  win.document.write(`<iframe src="${badgeInfo.svgImage}" frameborder="0" style="border:0; top:0px; left:0px; bottom:0px; right:0px; width:100%; height:100%;" allowfullscreen></iframe>`);
                                } else {
                                  triggerAlert("No SVG URI found.");
                                }
                              }}>
                                View raw on-chain SVG Badge Image ↗
                              </span>
                            </div>
                          </div>
                        ) : (
                          <p style={{ fontSize: "0.8rem", color: "var(--color-sienna)", fontStyle: "italic" }}>
                            To mint your badge, have the organizer check you into your first event.
                          </p>
                        )}
                      </div>

                    </div>
                  </div>
                </div>
              )}

              {/* ==================== SCREEN 3: ORGANIZER DASHBOARD (CHECK-IN DESK) ==================== */}
              {activeTab === "organizer" && !selectedEventId && (
                <div>
                  <div className="ledger-header">
                    <span style={{ fontSize: "0.8rem", color: "var(--color-sienna)", fontWeight: "bold" }}>OFFICER LEDGER CONSOLE</span>
                    <h2>CHECK-IN DESK</h2>
                    <p style={{ fontSize: "0.85rem", opacity: 0.8 }}>
                      Organizer Account: <span style={{ textDecoration: "underline" }}>{organizerAddress}</span>
                    </p>
                  </div>

                  {!isOrganizer && (
                    <div className="ledger-alert" style={{ marginBottom: "2rem" }}>
                      <span style={{ fontWeight: "bold" }}>[RESTRICTED ACCESS] </span> 
                      Only the contract Organizer ({organizerAddress.slice(0, 8)}...) is authorized to write to this desk on-chain. Actions will revert.
                      {isMockMode && (
                        <div style={{ marginTop: "0.5rem", fontSize: "0.8rem", textDecoration: "underline", color: "black", cursor: "pointer" }} onClick={() => {
                          setUserAddress(organizerAddress);
                          setIsOrganizer(true);
                          triggerSuccess("Switched to Admin mock address.");
                        }}>
                          Click here to simulate login as Organizer in Sandbox.
                        </div>
                      )}
                    </div>
                  )}

                  <div style={{ display: "grid", gridTemplateColumns: "1fr", md: "1.1fr 0.9fr", gap: "3rem" }}>
                    
                    {/* CHECK IN INTERFACES */}
                    <div>
                      <h3 style={{ borderBottom: "2px solid #1a251e", paddingBottom: "0.5rem", marginBottom: "1.5rem" }}>
                        Check-in operations
                      </h3>

                      {/* Dropdown for selecting event */}
                      <div style={{ marginBottom: "1.5rem" }}>
                        <label style={{ fontSize: "0.85rem", fontWeight: "bold", display: "block", marginBottom: "0.4rem" }}>
                          SELECT ACTIVE EVENT FROM LEDGER:
                        </label>
                        <select 
                          value={checkInEventId} 
                          onChange={(e) => setCheckInEventId(e.target.value)}
                          style={{ fontSize: "1rem" }}
                        >
                          <option value="">-- Select Event --</option>
                          {events.map((ev) => (
                            <option key={ev.id} value={ev.id}>
                              Event #{ev.id}: {ev.name} ({new Date(ev.date * 1000).toLocaleDateString()})
                            </option>
                          ))}
                        </select>
                      </div>

                      {/* Flex layout for Single and Batch */}
                      <div style={{ display: "flex", flexDirection: "column", gap: "2rem" }}>
                        
                        {/* Single Attendee Check-In Form */}
                        <form onSubmit={handleSingleCheckIn} style={{ border: "1px solid #c0b6a2", padding: "1.25rem", borderRadius: "4px", background: "rgba(0,0,0,0.01)" }}>
                          <span style={{ fontSize: "0.75rem", color: "var(--color-sienna)", fontWeight: "bold", display: "block", marginBottom: "0.5rem" }}>SINGLE ATTENDEE CERTIFICATE</span>
                          <h4 style={{ marginBottom: "1rem" }}>Apply Individual Ink Stamp</h4>
                          
                          <div style={{ display: "flex", gap: "0.75rem", flexDirection: "column" }}>
                            <input 
                              type="text" 
                              placeholder="Attendee Wallet Address (0x...)" 
                              value={singleAttendee}
                              onChange={(e) => setSingleAttendee(e.target.value)}
                            />
                            <button 
                              type="submit" 
                              className="btn-stamp" 
                              disabled={!isOrganizer || slammingStamp}
                              style={{ width: "100%", justifyContent: "center", marginTop: "0.5rem" }}
                            >
                              Slam Stamp Down
                            </button>
                          </div>
                        </form>

                        {/* Batch Check-In Form */}
                        <form onSubmit={handleBatchCheckIn} style={{ border: "1px solid #c0b6a2", padding: "1.25rem", borderRadius: "4px", background: "rgba(0,0,0,0.01)" }}>
                          <span style={{ fontSize: "0.75rem", color: "var(--color-sienna)", fontWeight: "bold", display: "block", marginBottom: "0.5rem" }}>BATCH REGISTER SHEET</span>
                          <h4 style={{ marginBottom: "1rem" }}>Apply Bulk Ink Stamps</h4>
                          
                          <div style={{ display: "flex", gap: "0.75rem", flexDirection: "column" }}>
                            <textarea 
                              placeholder="Paste addresses (comma or new-line separated)&#10;0xAddress1&#10;0xAddress2" 
                              value={batchAttendees}
                              onChange={(e) => setBatchAttendees(e.target.value)}
                              rows={4}
                              style={{ background: "rgba(255, 255, 255, 0.4)", border: "none", borderBottom: "2px dashed #8e8371", resize: "vertical", padding: "0.5rem", fontFamily: "var(--font-mono)", fontSize: "0.85rem" }}
                            />
                            <button 
                              type="submit" 
                              className="btn-stamp" 
                              disabled={!isOrganizer || slammingStamp}
                              style={{ width: "100%", justifyContent: "center", marginTop: "0.5rem" }}
                            >
                              Slam Batch Stamps
                            </button>
                          </div>
                        </form>

                      </div>
                    </div>

                    {/* EVENT REGISTRATION & LIST */}
                    <div>
                      {/* Create Event Form */}
                      <form onSubmit={handleCreateEvent} style={{ border: "1px solid #c0b6a2", padding: "1.5rem", borderRadius: "4px", background: "rgba(0,0,0,0.01)", marginBottom: "2rem" }}>
                        <span style={{ fontSize: "0.75rem", color: "var(--color-sienna)", fontWeight: "bold", display: "block", marginBottom: "0.5rem" }}>LOGBOOK REGISTRATION</span>
                        <h3 style={{ marginBottom: "1rem" }}>Create New Event</h3>
                        
                        <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                          <div>
                            <label style={{ fontSize: "0.8rem", display: "block", marginBottom: "0.25rem" }}>Event Name:</label>
                            <input 
                              type="text" 
                              placeholder="e.g. Stanford Dev Meetup" 
                              value={newEventName}
                              onChange={(e) => setNewEventName(e.target.value)}
                            />
                          </div>
                          <div>
                            <label style={{ fontSize: "0.8rem", display: "block", marginBottom: "0.25rem" }}>Event Date:</label>
                            <input 
                              type="date" 
                              value={newEventDate}
                              onChange={(e) => setNewEventDate(e.target.value)}
                              style={{ borderBottom: "2px dashed #8e8371", width: "100%", padding: "0.5rem 0.25rem", background: "rgba(255, 255, 255, 0.4)" }}
                            />
                          </div>
                          <button 
                            type="submit" 
                            className="btn-stamp secondary" 
                            disabled={!isOrganizer}
                            style={{ justifyContent: "center" }}
                          >
                            <Plus size={16} /> Register Event
                          </button>
                        </div>
                      </form>

                      {/* List of Registered Events */}
                      <div>
                        <h4 style={{ borderBottom: "1px solid #c0b6a2", paddingBottom: "0.3rem", marginBottom: "0.75rem" }}>
                          Active Event Sheets ({events.length})
                        </h4>
                        
                        {events.length === 0 ? (
                          <p style={{ fontSize: "0.8rem", fontStyle: "italic", opacity: 0.7 }}>No events logged in the ledger yet.</p>
                        ) : (
                          <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem", maxHeight: "250px", overflowY: "auto" }}>
                            {events.map((ev) => (
                              <div 
                                key={ev.id} 
                                className="event-list-item"
                                style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "0.6rem 0.8rem", background: "rgba(0,0,0,0.02)", border: "1px dashed rgba(90, 82, 70, 0.3)", borderRadius: "2px", cursor: "pointer" }}
                                onClick={() => setSelectedEventId(ev.id)}
                              >
                                <div>
                                  <div style={{ fontWeight: "bold", fontSize: "0.85rem" }}>{ev.name}</div>
                                  <div style={{ fontSize: "0.75rem", opacity: 0.6 }}>ID: #{ev.id} • {new Date(ev.date * 1000).toLocaleDateString()}</div>
                                </div>
                                <span style={{ fontSize: "0.75rem", color: "var(--color-sienna)", textDecoration: "underline" }}>
                                  Open Sheet →
                                </span>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>

                    </div>

                  </div>
                </div>
              )}

              {/* ==================== SCREEN 4: EVENT DETAIL (SIGN-IN SHEET) ==================== */}
              {selectedEventId && (
                <EventDetailSheet 
                  eventId={selectedEventId}
                  events={events}
                  isMockMode={isMockMode}
                  signer={signer}
                  provider={provider}
                  onBack={() => setSelectedEventId(null)}
                  triggerAlert={triggerAlert}
                />
              )}

              {/* Stamp slamming animation overlay */}
              {slammingStamp && (
                <div style={{
                  position: "absolute",
                  top: 0,
                  left: 0,
                  right: 0,
                  bottom: 0,
                  background: "rgba(237, 230, 214, 0.5)",
                  display: "flex",
                  justifyContent: "center",
                  alignItems: "center",
                  zIndex: 100,
                  pointerEvents: "none"
                }}>
                  <div className="slamming">
                    <StampCheckIn size={240} dateText="REGISTERED" eventId={selectedEventId || ""} />
                  </div>
                </div>
              )}

            </div>

            {/* Smart Contract Info footer */}
            <footer style={{ marginTop: "3rem", display: "flex", justifyContent: "space-between", alignItems: "center", color: "#7a8a80", fontSize: "0.75rem", flexWrap: "wrap", gap: "1rem" }}>
              <div>
                <span>ON-CHAIN CONTRACT: </span>
                <span 
                  onClick={copyAddress}
                  style={{ fontFamily: "var(--font-mono)", cursor: "pointer", textDecoration: "underline", color: copied ? "var(--color-gold)" : "#a5b5ab" }}
                >
                  {CONTRACT_ADDRESS} {copied ? "[COPIED!]" : "[COPY]"}
                </span>
              </div>
              <div>
                <span>SEPOLIA TX EXPLORER: </span>
                <a 
                  href={`https://sepolia.etherscan.io/address/${CONTRACT_ADDRESS}`} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  style={{ color: "#a5b5ab" }}
                >
                  ETHERSCAN ↗
                </a>
              </div>
            </footer>

          </div>
        )}
      </div>
    </div>
  );
}

// Subcomponent: EventDetailSheet (styled like an old field ledger sign-in book)
function EventDetailSheet({ eventId, events, isMockMode, signer, provider, onBack, triggerAlert }) {
  const [attendeeCheckedInList, setAttendeeCheckedInList] = useState({});
  const [attendeeList, setAttendeeList] = useState([]);
  const [loading, setLoading] = useState(true);
  
  const currentEvent = events.find(ev => ev.id === eventId) || { name: "Unknown Event", date: Date.now() / 1000 };

  useEffect(() => {
    loadAttendees();
  }, [eventId, isMockMode]);

  const loadAttendees = async () => {
    setLoading(true);
    if (isMockMode) {
      const mockDb = getMockData();
      
      // Collect all unique addresses that have any attendance records
      const allAddresses = Object.keys(mockDb.attendance);
      const list = [];
      const checkedInMap = {};

      allAddresses.forEach(addr => {
        const eventsAttended = mockDb.attendance[addr] || [];
        const checkedIn = eventsAttended.includes(eventId);
        checkedInMap[addr] = checkedIn;

        if (checkedIn) {
          // Determine their tier level in mock mode
          const count = eventsAttended.length;
          let tier = "Bronze";
          if (count >= 5) tier = "Gold";
          else if (count >= 3) tier = "Silver";

          list.push({
            address: addr,
            checkedIn: true,
            tier,
            count
          });
        }
      });

      setAttendeeList(list);
      setAttendeeCheckedInList(checkedInMap);
      setLoading(false);
    } else {
      try {
        const contract = getContractInstance(provider);
        
        // On blockchain, we don't have a direct listing of all users out-of-the-box in a simple mapping
        // We can inspect past events (Mint events) or we can read from standard local lists.
        // Let's scrape transfer logs or we can inspect the Mint transfer events from address(0) using ethers filter!
        // This is a super robust way to scrape all token holders dynamically:
        const filter = contract.filters.Transfer(null, null, null);
        const logs = await contract.queryFilter(filter);
        
        const holders = new Set();
        logs.forEach(log => {
          // Transfer(from, to, tokenId)
          const toAddress = log.args[1];
          if (toAddress !== ethers.ZeroAddress) {
            holders.add(toAddress.toLowerCase());
          }
        });

        const holderArray = Array.from(holders);
        const list = [];
        const checkedInMap = {};

        for (const addr of holderArray) {
          const attended = await contract.hasAttendedEvent(addr, eventId);
          checkedInMap[addr] = attended;

          if (attended) {
            const count = await contract.attendanceCount(addr);
            const tierVal = await contract.tierOf(addr);
            const countNum = Number(count);
            const tierNum = Number(tierVal);
            const tier = tierNum === 0 ? "Bronze" : tierNum === 1 ? "Silver" : "Gold";

            list.push({
              address: addr,
              checkedIn: true,
              tier,
              count: countNum
            });
          }
        }

        setAttendeeList(list);
        setAttendeeCheckedInList(checkedInMap);
      } catch (err) {
        console.error(err);
        triggerAlert("Error fetching attendee lists from Etherscan logs.");
      } finally {
        setLoading(false);
      }
    }
  };

  return (
    <div>
      <div className="ledger-header" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div>
          <button 
            onClick={onBack} 
            className="btn-stamp secondary" 
            style={{ fontSize: "0.95rem", padding: "0.4rem 1rem", marginBottom: "0.5rem" }}
          >
            <ArrowLeft size={14} /> Back to Desk
          </button>
          <h2>SIGN-IN SHEET</h2>
          <p style={{ fontSize: "1.1rem", fontFamily: "var(--font-headers)", color: "var(--color-sienna)" }}>
            EVENT #{eventId}: {currentEvent.name} — {new Date(currentEvent.date * 1000).toLocaleDateString()}
          </p>
        </div>
      </div>

      {loading ? (
        <p style={{ fontFamily: "var(--font-mono)", fontSize: "0.9rem", padding: "2rem 0" }}>
          [READING LEDGER LOGS...]
        </p>
      ) : (
        <div style={{ overflowX: "auto" }}>
          {attendeeList.length === 0 ? (
            <div style={{ textAlign: "center", padding: "3rem 0" }}>
              <p style={{ fontStyle: "italic", opacity: 0.7, marginBottom: "1.5rem" }}>
                No attendees have checked into this sheet.
              </p>
              <div style={{ display: "inline-block", border: "1px dashed rgba(181, 75, 58, 0.4)", padding: "1rem", color: "var(--color-sienna)", fontSize: "0.8rem" }}>
                STAMP ATTENDEES AT CHECK-IN DESK TO POPULATE THIS SHEET
              </div>
            </div>
          ) : (
            <table className="signin-sheet">
              <thead>
                <tr>
                  <th style={{ width: "80px" }}>NO.</th>
                  <th>WALLET ADDRESS</th>
                  <th style={{ width: "150px" }}>STAMP MARK</th>
                  <th style={{ width: "150px", textAlign: "right" }}>BADGE TIER</th>
                </tr>
              </thead>
              <tbody>
                {attendeeList.map((attendee, idx) => (
                  <tr key={attendee.address}>
                    <td style={{ fontWeight: "bold" }}>
                      {(idx + 1).toString().padStart(2, "0")}
                    </td>
                    <td>
                      <span style={{ fontSize: "0.85rem" }}>{attendee.address}</span>
                    </td>
                    <td>
                      <StampCheckIn size={65} dateText="CHECKED" eventId={eventId} />
                    </td>
                    <td style={{ textAlign: "right" }}>
                      <span style={{ 
                        fontFamily: "var(--font-headers)", 
                        fontSize: "1rem",
                        color: attendee.tier === "Gold" ? "var(--color-gold)" : attendee.tier === "Silver" ? "var(--color-silver)" : "var(--color-bronze)",
                        fontWeight: "bold",
                        background: "rgba(0,0,0,0.06)",
                        padding: "0.2rem 0.5rem",
                        borderRadius: "2px"
                      }}>
                        {attendee.tier} ({attendee.count})
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}
    </div>
  );
}
