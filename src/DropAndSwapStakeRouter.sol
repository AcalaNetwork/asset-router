// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.17;

import { ERC20 } from "solmate/tokens/ERC20.sol";
import { SafeTransferLib } from "solmate/utils/SafeTransferLib.sol";
import { Math } from "@openzeppelin/contracts/utils/math/Math.sol";
import { IDEX } from "@acala-network/contracts/dex/IDEX.sol";
import { LDOT } from "@acala-network/contracts/utils/AcalaTokens.sol";
import { IStakingTo } from "euphrates/IStaking.sol";

import { BaseRouter } from "./BaseRouter.sol";
import { FeeRegistry } from "./FeeRegistry.sol";

struct DropAndSwapStakeInstructions {
    address recipient;
    uint256 dropFee;
    address feeReceiver;
    ERC20 dropToken;
    address dex;
    uint256 swapAmount;
    address[] path;
    address euphrates;
    uint256 poolId;
    uint256 minShareAmount;
}

contract DropAndSwapStakeRouter is BaseRouter {
    using SafeTransferLib for ERC20;

    DropAndSwapStakeInstructions private _instructions;

    constructor(FeeRegistry fees, DropAndSwapStakeInstructions memory instructions) BaseRouter(fees) {
        _instructions = instructions;
    }

    function routeImpl(ERC20 token) internal override {
        if (token.balanceOf(address(this)) < _instructions.dropFee) {
            revert("DropAndStakeByDEXUtilRouter: cannot afford drop fee");
        }
        token.safeTransfer(_instructions.feeReceiver, _instructions.dropFee);

        require(
            _instructions.path.length >= 2 && _instructions.path[0] == address(token),
            "DropAndStakeByDEXUtilRouter: invalid path"
        );
        address targetToken = _instructions.path[_instructions.path.length - 1];
        address lpToken = IDEX(_instructions.dex).getLiquidityTokenAddress(address(token), address(targetToken));

        require(lpToken != address(0), "DropAndStakeByDEXUtilRouter: liquidity pool not exist");
        require(
            lpToken == address(IStakingTo(_instructions.euphrates).shareTypes(_instructions.poolId)),
            "DropAndStakeByDEXUtilRouter: share token is not matched the lp token"
        );

        token.safeApprove(_instructions.dex, _instructions.swapAmount);
        bool swapResult = IDEX(_instructions.dex).swapWithExactSupply(_instructions.path, _instructions.swapAmount, 0);
        require(swapResult, "DropAndStakeByDEXUtilRouter: swap failed");

        // no need to approve, IDEX transfer from directly
        bool addLiquidityResult = IDEX(_instructions.dex).addLiquidity(
            address(token),
            targetToken,
            token.balanceOf(address(this)),
            ERC20(targetToken).balanceOf(address(this)),
            _instructions.minShareAmount
        );
        require(addLiquidityResult, "DropAndStakeByDEXUtilRouter: addLiquidity failed");

        ERC20(lpToken).safeApprove(_instructions.euphrates, ERC20(lpToken).balanceOf(address(this)));
        bool stakeResult = IStakingTo(_instructions.euphrates).stakeTo(
            _instructions.poolId, ERC20(lpToken).balanceOf(address(this)), _instructions.recipient
        );
        require(stakeResult, "DropAndStakeByDEXUtilRouter: stake failed");

        // return remain assets
        uint256 LDOT_ED = 500000000;
        uint256 remainingToken = token.balanceOf(address(this));
        uint256 remainingTargetToken = ERC20(targetToken).balanceOf(address(this));

        if (address(token) == LDOT) {
            if (remainingToken >= LDOT_ED) {
                token.safeTransfer(_instructions.recipient, remainingToken);
            }
        } else {
            token.safeTransfer(_instructions.recipient, remainingToken);
        }

        if (targetToken == LDOT) {
            if (remainingTargetToken >= LDOT_ED) {
                ERC20(targetToken).safeTransfer(_instructions.recipient, remainingTargetToken);
            }
        } else {
            ERC20(targetToken).safeTransfer(_instructions.recipient, remainingTargetToken);
        }

        // transfer all dropToken to recipient
        _instructions.dropToken.safeTransfer(_instructions.recipient, _instructions.dropToken.balanceOf(address(this)));
    }

    function rescue(ERC20 token, bool isGasDrop) public {
        if (isGasDrop) {
            // require transfer full dropFee to feeReceiver
            if (token.balanceOf(address(this)) < _instructions.dropFee) {
                revert("DropAndStakeByDEXUtilRouter: cannot afford drop fee");
            }
            token.safeTransfer(_instructions.feeReceiver, _instructions.dropFee);

            // transfer all dropToken to recipient
            _instructions.dropToken.safeTransfer(_instructions.recipient, _instructions.dropToken.balanceOf(address(this)));
        } else {
            // transfer all dropToken back to feeReceiver (no gas drop)
            _instructions.dropToken.safeTransfer(_instructions.feeReceiver, _instructions.dropToken.balanceOf(address(this)));
        }

        // transfer all remainning token to recipient to avoid it stuck in this contract
        token.safeTransfer(_instructions.recipient, token.balanceOf(address(this)));

        emit RouterDestroyed(address(this));
        selfdestruct(payable(_instructions.feeReceiver));
    }
}
