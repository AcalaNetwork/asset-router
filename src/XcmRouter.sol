// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.17;

import { ERC20 } from "solmate/tokens/ERC20.sol";

import { BaseRouter } from "./BaseRouter.sol";
import { FeeRegistry } from "./FeeRegistry.sol";

struct XcmInstructions {
    address dummy;
}

contract XcmRouter is BaseRouter {
    XcmInstructions private _instructions;

    constructor(FeeRegistry fees, XcmInstructions memory instructions) BaseRouter(fees) {
        _instructions = instructions;
    }

    function routeImpl(ERC20 token) internal override {
        token.transfer(_instructions.dummy, token.balanceOf(address(this)));
    }
}
