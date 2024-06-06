// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.17;

import { ERC20 } from "solmate/tokens/ERC20.sol";
import { SafeTransferLib } from "solmate/utils/SafeTransferLib.sol";
import { Math } from "@openzeppelin/contracts/utils/math/Math.sol";

import { BaseRouter } from "./BaseRouter.sol";
import { FeeRegistry } from "./FeeRegistry.sol";

struct SwapInstructions {
    address recipient;
    uint256 supplyAmount;
    address maker;
    ERC20 targetToken;
}

contract SwapRouter is BaseRouter {
    using SafeTransferLib for ERC20;

    SwapInstructions private _instructions;

    constructor(FeeRegistry fees, SwapInstructions memory instructions) BaseRouter(fees) {
        _instructions = instructions;
    }

    function routeImpl(ERC20 token) internal override {
        // transfer supplyAmount to maker if possible
        token.safeTransfer(_instructions.maker, Math.min(_instructions.supplyAmount, token.balanceOf(address(this))));

        // transfer remain token to recipient
        token.safeTransfer(_instructions.recipient, token.balanceOf(address(this)));

        // transfer all targetToken to recipient
        _instructions.targetToken.safeTransfer(
            _instructions.recipient, _instructions.targetToken.balanceOf(address(this))
        );
    }
}
