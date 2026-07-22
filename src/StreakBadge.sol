// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {ERC721} from "@openzeppelin/contracts/token/ERC721/ERC721.sol";

contract StreakBadge is ERC721 {
    address public immutable organizer = msg.sender;
    uint256 private nextTokenId;

    mapping(address => uint256) public tokenIdOf;

    mapping(address => uint256) public attendanceCount;

    mapping(address => mapping(uint256 => bool)) public hasAttendedEvent;

    error NotOrganizer();
    error AlreadyCheckedIn();

    modifier onlyOrganizer() {
        if (msg.sender != organizer) revert NotOrganizer();
        _;
    }

    constructor() ERC721("Streak Badge", "STREAK") {}

    function checkIn(address attendee, uint256 eventId) external onlyOrganizer {
        if (hasAttendedEvent[attendee][eventId]) revert AlreadyCheckedIn();

        hasAttendedEvent[attendee][eventId] = true;
        attendanceCount[attendee]++;

        if (tokenIdOf[attendee] == 0) {
            nextTokenId++;
            tokenIdOf[attendee] = nextTokenId;
            _safeMint(attendee, nextTokenId);
        }
    }
}
