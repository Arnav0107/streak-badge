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

    function _contains(string memory what, string memory needle ) internal pure returns (bool){
        bytes memory whatBytes = bytes(what);
        bytes memory needleBytes = bytes(needle);

        if(needleBytes.length > whatBytes.length) return false;

        for(uint256 i=0;i<= whatBytes.length-needleBytes.length; i++){
            bool found = true;
            for(uint256 j =0;j<needleBytes.length;j++){
                if (whatBytes[i + j] != needleBytes[j]) {
                found = false;
                break;
                }
            }
            if(found) return true;
        }
        return false;
    }

    function test_TokenURI_level1_DoesNotRevertAndHasPrefix() public {
        streakBadge.checkIn(alice,1);

        string memory uri = streakBadge.tokenURI(1);
        assertTrue(bytes(uri).length > 0);
        assertTrue(_contains(uri, "data:application/json;base64,"));
    }


    function _substring(string memory str, uint256 startIndex , uint256 endIndex) internal pure returns(string memory){
        bytes memory strBytes =bytes(str);
        bytes memory result = new bytes(endIndex -startIndex);    
        for (uint256 i = startIndex; i < endIndex; i++) {
            result[i - startIndex] = strBytes[i];
        }
        return string(result);
    }

    function _decodeBase64(string memory _data) internal pure returns (bytes memory){
        bytes memory data = bytes(_data);
        if(data.length == 0) return new bytes(0);

        bytes memory table = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";
        //This is the standard Base64 alphabet

        uint8[128] memory lookup;
        for (uint8 i = 0; i < table.length; i++) {
            lookup[uint8(table[i])] = i;
        }
        
        uint256 padding =0;

        if(data[data.length -1] == "=") padding ++;
        if (data[data.length - 2] == "=") padding++;
        //Many a  times Base64 often ends with = or == this is not the real data
        
        uint256 decodedLen =(data.length/4)*3 -padding;
        //formula comes from how base 64 works 

        bytes memory result = new bytes(decodedLen);
        //Reserve enough space for the decoded output.

        uint256 j= 0;
        for(uint256 i =0;i<data.length;i +=4){
            //Base64 always works in groups of four characters.
            uint256 b0 = lookup[uint8(data[i])];
            uint256 b1 = lookup[uint8(data[i+1])];
            uint256 b2 = data[i + 2] == "=" ? 0 : lookup[uint8(data[i + 2])];
            uint256 b3 = data[i + 3] == "=" ? 0 : lookup[uint8(data[i + 3])];
            //combining them to get three bytes of data

            uint256 triple = (b0 << 18) | (b1 << 12) | (b2 << 6) | b3;


            if (j < decodedLen)
                result[j++] = bytes1(uint8(triple >> 16));

            if (j < decodedLen)
                result[j++] = bytes1(uint8((triple >> 8) & 0xFF));

            if (j < decodedLen)
                result[j++] = bytes1(uint8(triple & 0xFF));

            //A 24-bit number contains three 8-bit bytes.

        }
        return result;
    }

    function test_TokenURI_level2_DecodedJsonHasCorrectTier() public {
        streakBadge.checkIn(alice, 1);
        streakBadge.checkIn(alice, 2);
        streakBadge.checkIn(alice, 3); // 3 check-ins -> Silver tier

        string memory uri = streakBadge.tokenURI(1);

        // "data:application/json;base64," is exactly 29 characters — strip it off
        string memory b64Json = _substring(uri, 29, bytes(uri).length);
        string memory json = string(_decodeBase64(b64Json));

        assertTrue(_contains(json, '"Tier", "value": "Silver"'));
        assertTrue(_contains(json, '"Attendance Count", "value": 3'));
    }

}

