// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.17;

import { ERC20 } from "solmate/tokens/ERC20.sol";
import { SafeTransferLib } from "solmate/utils/SafeTransferLib.sol";
import { IStakingTo } from "euphrates/IStaking.sol";
import { BaseRouter } from "./BaseRouter.sol";
import { FeeRegistry } from "./FeeRegistry.sol";

struct EuphratesInstructions {
    uint256 poolId;
    address recipient;
}

contract EuphratesRouter is BaseRouter {
    using SafeTransferLib for ERC20;

    address private _euphratesAddress;
    EuphratesInstructions private _instructions;

    constructor(FeeRegistry fees, EuphratesInstructions memory instructions, address euphratesAddress)
        BaseRouter(fees)
    {
        _instructions = instructions;
        _euphratesAddress = euphratesAddress;
    }

    function routeImpl(ERC20 token) internal override {
        if (address(token) == address(IStakingTo(_euphratesAddress).shareTypes(_instructions.poolId))) {
            bool approved = token.approve(_euphratesAddress, token.balanceOf(address(this)));
            require(approved, "EuphratesRouter: approve failed");

            // This may fail due to the configurations of Euphrates.
            // That means user is doing something wrong and will revert.
            IStakingTo(_euphratesAddress).stakeTo(
                _instructions.poolId, token.balanceOf(address(this)), _instructions.recipient
            );
        } else {
            // received token is not share token, transfer it to recipient to avoid it stuck in this contract
            token.safeTransfer(_instructions.recipient, token.balanceOf(address(this)));
        }
    }
}
