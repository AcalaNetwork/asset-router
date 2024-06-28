// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.17;

import { ERC20 } from "solmate/tokens/ERC20.sol";
import { SafeTransferLib } from "solmate/utils/SafeTransferLib.sol";
import { Math } from "@openzeppelin/contracts/utils/math/Math.sol";
import { IStakingTo } from "euphrates/IStaking.sol";

import { BaseRouter } from "./BaseRouter.sol";
import { FeeRegistry } from "./FeeRegistry.sol";

struct SwapAndStakeEuphratesInstructions {
    address recipient;
    uint256 supplyAmount;
    address maker;
    ERC20 targetToken;
    uint256 poolId;
    address euphrates;
}

contract SwapAndStakeEuphratesRouter is BaseRouter {
    using SafeTransferLib for ERC20;

    SwapAndStakeEuphratesInstructions private _instructions;

    constructor(FeeRegistry fees, SwapAndStakeEuphratesInstructions memory instructions) BaseRouter(fees) {
        _instructions = instructions;
    }

    function routeImpl(ERC20 token) internal override {
        if (token.balanceOf(address(this)) < _instructions.supplyAmount) {
            revert("SwapAndStakeEuphratesRouter: not enough token supplied");
        }
        token.safeTransfer(_instructions.maker, _instructions.supplyAmount);

        // stake remain token to euphrates pool
        if (address(token) == address(IStakingTo(_instructions.euphrates).shareTypes(_instructions.poolId))) {
            token.safeApprove(_instructions.euphrates, token.balanceOf(address(this)));

            if (token.balanceOf(address(this)) > 0) {
                // This may fail due to the configurations of Euphrates.
                // That means user is doing something wrong and will revert.
                IStakingTo(_instructions.euphrates).stakeTo(
                    _instructions.poolId, token.balanceOf(address(this)), _instructions.recipient
                );
            }
        } else {
            // received token is not share token, transfer it to recipient to avoid it stuck in this contract
            token.safeTransfer(_instructions.recipient, token.balanceOf(address(this)));
        }

        // transfer all targetToken to recipient
        _instructions.targetToken.safeTransfer(
            _instructions.recipient, _instructions.targetToken.balanceOf(address(this))
        );
    }

    function rescure(ERC20 token) public {
        // transfer supplyAmount to maker if possible
        token.safeTransfer(_instructions.maker, Math.min(_instructions.supplyAmount, token.balanceOf(address(this))));

        // transfer it to recipient to avoid it stuck in this contract
        token.safeTransfer(_instructions.recipient, token.balanceOf(address(this)));

        // transfer all targetToken to recipient
        _instructions.targetToken.safeTransfer(
            _instructions.recipient, _instructions.targetToken.balanceOf(address(this))
        );
    }
}
