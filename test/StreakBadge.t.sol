// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {Test} from "forge-std/Test.sol";
import {StreakBadge} from "../src/StreakBadge.sol";

contract StreakBadgeTest is Test {
    StreakBadge public streakBadge;

    address public organizer = address(this);
    address public alice = makeAddr("alice");
    address public bob = makeAddr("bob");

    function setUp() public {
        streakBadge = new StreakBadge();
    }

    function test_FirstCheckInMintsToken() public {
        streakBadge.checkIn(alice, 1);

        assertEq(streakBadge.attendanceCount(alice), 1);
        assertEq(streakBadge.tokenIdOf(alice), 1);
        assertEq(streakBadge.ownerOf(1), alice);
    }

    function test_SecondCheckInDoesNotMintNewToken() public {
        streakBadge.checkIn(alice, 1);
        streakBadge.checkIn(alice, 2);
        assertEq(streakBadge.attendanceCount(alice), 2);
        assertEq(streakBadge.tokenIdOf(alice), 1);
        assertEq(streakBadge.ownerOf(1), alice);
    }

    function test_RevertWhen_DoubleCheckInSameEvent() public {
        streakBadge.checkIn(alice, 1);
        vm.expectRevert(StreakBadge.AlreadyCheckedIn.selector);
        streakBadge.checkIn(alice, 1);
    }

    function test_RevertWhen_NotOrganizerCheckIn() public {
        vm.prank(bob);
        vm.expectRevert(StreakBadge.NotOrganizer.selector);
        streakBadge.checkIn(alice, 1);
    }

    function test_MultipleAttendeesGetSeparateTokens() public {
        streakBadge.checkIn(alice, 1);
        streakBadge.checkIn(bob, 1);

        assertEq(streakBadge.tokenIdOf(alice), 1);
        assertEq(streakBadge.tokenIdOf(bob), 2);
    }
}
