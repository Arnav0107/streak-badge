// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {Script, console} from "forge-std/Script.sol";
import {StreakBadge} from "../src/StreakBadge.sol";

contract DeployStreakBadge is Script {
    function run() external returns (StreakBadge) {
        vm.startBroadcast();

        StreakBadge streakBadge = new StreakBadge();

        vm.stopBroadcast();

        console.log("StreakBadge deployed to:", address(streakBadge));

        return streakBadge;
    }
}