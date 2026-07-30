// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {ERC721} from "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import {Base64} from "@openzeppelin/contracts/utils/Base64.sol";

//It's a small utility library (not a contract you inherit) for encoding raw bytes into Base64 strings on-chain — mainly used to build data URIs for on-chain NFT metadata/SVG images without needing an off-chain server.

import {Strings} from "@openzeppelin/contracts/utils/Strings.sol";

//Another utility library (not inherited, just imported and called) — mainly for converting numbers/addresses into string form, since Solidity has no built-in way to do this.

contract StreakBadge is ERC721 {
    address public immutable organizer = msg.sender;
    uint256 private nextTokenId;

    mapping(address => uint256) public tokenIdOf;

    mapping(address => uint256) public attendanceCount;

    mapping(address => mapping(uint256 => bool)) public hasAttendedEvent;

    mapping(uint256 => address) public ownerOfToken;

    error NotOrganizer();
    error AlreadyCheckedIn();

    modifier onlyOrganizer() {
        if (msg.sender != organizer) revert NotOrganizer();
        _;
    }

    enum Tier {
        Bronze,
        Silver,
        Gold
    }


    //Adding an Event struct to store event metadata
    struct Event{
        string name;
        uint256 date;
        bool exists;
    }

    // mapping eventId → Event
    mapping(uint256 =>Event) public events;
    uint256 public nextEventId;

    //Notice nextEventId — this replaces the old pattern of the organizer manually picking arbitrary event IDs. Auto-incrementing IDs prevent accidental collisions

    error EventDoesNotExist();

    function createEvent(string calldata name,uint256 date)external onlyOrganizer returns(uint256){
        nextEventId++;
        events[nextEventId] = Event({name: name, date: date, exists: true});
        return nextEventId;
    }


    constructor() ERC721("Streak Badge", "STREAK") {}

    function checkIn(address attendee, uint256 eventId) external onlyOrganizer {
        if (!events[eventId].exists) revert EventDoesNotExist();
        if (hasAttendedEvent[attendee][eventId]) revert AlreadyCheckedIn();

        hasAttendedEvent[attendee][eventId] = true;
        attendanceCount[attendee]++;

        if (tokenIdOf[attendee] == 0) {
            nextTokenId++;
            tokenIdOf[attendee] = nextTokenId;
            ownerOfToken[nextTokenId] = attendee;
            _safeMint(attendee, nextTokenId);
        }
    }

    function tierOf(address attendee) public view returns (Tier) {
        uint256 count = attendanceCount[attendee];
        if (count >= 5) return Tier.Gold;
        if (count >= 3) return Tier.Silver;
        return Tier.Bronze;
    }

    function tokenURI(uint256 tokenId) public view override returns (string memory) {
        address attendee = ownerOfToken[tokenId];
        Tier tier = tierOf(attendee);
        uint256 count = attendanceCount[attendee];

        string memory tierName = tier == Tier.Gold ? "Gold" : tier == Tier.Silver ? "Silver" : "Bronze";
        string memory color = tier == Tier.Gold ? "#FFD700" : tier == Tier.Silver ? "#C0C0C0" : "#CD7F32";

        string memory svg = string(
            abi.encodePacked(
                '<svg xmlns="http://www.w3.org/2000/svg" width="350" height="350">',
                '<rect width="350" height="350" fill="',
                color,
                '"/>',
                '<text x="175" y="160" font-size="28" text-anchor="middle" fill="black">',
                tierName,
                " Badge</text>",
                '<text x="175" y="200" font-size="18" text-anchor="middle" fill="black">Attended: ',
                Strings.toString(count),
                "</text>",
                "</svg>"
            )
        );
        string memory json = string(
            abi.encodePacked(
                '{"name": "Streak Badge #',
                Strings.toString(tokenId),
                '",',
                '"description": "An evolving attendance badge that upgrades as you attend more events.",',
                '"attributes": [{"trait_type": "Tier", "value": "',
                tierName,
                '"}, {"trait_type": "Attendance Count", "value": ',
                Strings.toString(count),
                "}],",
                '"image": "data:image/svg+xml;base64,',
                Base64.encode(bytes(svg)),
                '"}'
            )
        );

        return string(abi.encodePacked("data:application/json;base64,", Base64.encode(bytes(json))));
    }
}
