// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.17;

import { ERC20 } from "solmate/tokens/ERC20.sol";
import { SafeTransferLib } from "solmate/utils/SafeTransferLib.sol";
import { IHoma } from "@acala-network/contracts/homa/IHoma.sol";
import { IToken } from "@acala-network/contracts/token/IToken.sol";
import { HOMA } from "@acala-network/contracts/utils/Predeploy.sol";

import { BaseRouter } from "./BaseRouter.sol";
import { FeeRegistry } from "./FeeRegistry.sol";
import { AccountHelper } from "./AccountHelper.sol";

struct HomaInstructions {
    ERC20 stakingToken;
    ERC20 liquidToken;
    bytes32 recipient;
}

contract HomaRouter is BaseRouter {
    using SafeTransferLib for ERC20;

    HomaInstructions private _instructions;

    constructor(FeeRegistry fees, HomaInstructions memory instructions) BaseRouter(fees) {
        _instructions = instructions;
    }

    function routeImpl(ERC20 token) internal override {
        if (token == _instructions.stakingToken) {
            bool success = IHoma(HOMA).mint(token.balanceOf(address(this)));
            require(success, "HomaRouter: mint failed");
            AccountHelper.transferToken(
                _instructions.liquidToken, _instructions.recipient, _instructions.liquidToken.balanceOf(address(this))
            );
        } else {
            // received token is not staking token, transfer it to recipient to avoid it stuck in this contract
            AccountHelper.transferToken(token, _instructions.recipient, token.balanceOf(address(this)));
        }
    }
}
