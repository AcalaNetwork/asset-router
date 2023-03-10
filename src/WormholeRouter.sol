// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.17;

import { ERC20 } from "solmate/tokens/ERC20.sol";
import { ITokenBridge } from "wormhole/bridge/interfaces/ITokenBridge.sol";

import { BaseRouter } from "./BaseRouter.sol";
import { FeeRegistry } from "./FeeRegistry.sol";

struct WormholeInstructions {
    uint16 recipientChain;
    bytes32 recipient;
    uint32 nonce;
    uint256 arbiterFee;
}

contract WormholeRouter is BaseRouter {
    // https://book.wormhole.com/reference/contracts.html#token-bridge
    ITokenBridge private constant _bridge = ITokenBridge(address(0xae9d7fe007b3327AA64A32824Aaac52C42a6E624));
    WormholeInstructions private _instructions;

    constructor(FeeRegistry fees, WormholeInstructions memory instructions) BaseRouter(fees) {
        _instructions = instructions;
    }

    function routeImpl(ERC20 token) internal override {
        _bridge.transferTokens(
            address(token),
            token.balanceOf(address(this)),
            _instructions.recipientChain,
            _instructions.recipient,
            _instructions.arbiterFee,
            _instructions.nonce
        );
    }
}
