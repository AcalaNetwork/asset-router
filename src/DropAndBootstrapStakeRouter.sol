// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.17;

import { ERC20 } from "solmate/tokens/ERC20.sol";
import { SafeTransferLib } from "solmate/utils/SafeTransferLib.sol";
import { Math } from "@openzeppelin/contracts/utils/math/Math.sol";
import { IDEX } from "@acala-network/contracts/dex/IDEX.sol";
import { IBootstrap } from "@acala-network/contracts/dex/IBootstrap.sol";
import { IStakingTo } from "euphrates/IStaking.sol";

import { BaseRouter } from "./BaseRouter.sol";
import { FeeRegistry } from "./FeeRegistry.sol";

struct DropAndBootstrapStakeInstructions {
    address recipient;
    ERC20 dropToken;
    uint256 dropFee;
    address feeReceiver;
    address dex;
    ERC20 otherContributionToken;
    address euphrates;
    uint256 poolId;
}

contract DropAndBootstrapStakeRouter is BaseRouter {
    using SafeTransferLib for ERC20;

    DropAndBootstrapStakeInstructions private _instructions;
    bool private _dropped;

    constructor(FeeRegistry fees, DropAndBootstrapStakeInstructions memory instructions) BaseRouter(fees) {
        _instructions = instructions;
    }

    function routeImpl(ERC20 token) internal override {
        if (!_dropped) {
            if (token.balanceOf(address(this)) < _instructions.dropFee) {
                revert("DropAndBootstrapStakeRouter: cannot afford drop fee");
            }
            token.safeTransfer(_instructions.feeReceiver, _instructions.dropFee);
        }

        // ensure bootstrap is in process and not ended
        address lpToken = IDEX(_instructions.dex).getLiquidityTokenAddress(
            address(token), address(_instructions.otherContributionToken)
        );
        require(lpToken != address(0), "DropAndBootstrapStakeRouter: bootstrap not exist");
        (uint256 rateA, uint256 rateB) = IBootstrap(_instructions.dex).getInitialShareExchangeRate(
            address(token), address(_instructions.otherContributionToken)
        );
        require(rateA == 0 && rateB == 0, "DropAndBootstrapStakeRouter: bootstrap is ended");

        // ensure bootstrap lp token is matched the share token of Euphrates pool
        require(
            lpToken == address(IStakingTo(_instructions.euphrates).shareTypes(_instructions.poolId)),
            "DropAndBootstrapStakeRouter: Euphrates pool share token is not matched the lp token"
        );

        uint256 contributionTokenAmount = token.balanceOf(address(this));
        uint256 otherContributionTokenAmount = _instructions.otherContributionToken.balanceOf(address(this));

        if (contributionTokenAmount != 0 || otherContributionTokenAmount != 0) {
            token.safeApprove(_instructions.dex, contributionTokenAmount);
            _instructions.otherContributionToken.safeApprove(_instructions.dex, otherContributionTokenAmount);

            bool result = IBootstrap(_instructions.dex).addProvision(
                address(token),
                address(_instructions.otherContributionToken),
                contributionTokenAmount,
                otherContributionTokenAmount
            );
            require(result, "DropAndBootstrapStakeRouter: addProvision failed");
        }

        if (!_dropped) {
            // transfer all dropToken to recipient
            _instructions.dropToken.safeTransfer(
                _instructions.recipient, _instructions.dropToken.balanceOf(address(this))
            );

            _dropped = true;
        }
    }

    function _destroy() private {
        emit RouterDestroyed(address(this));
        selfdestruct(payable(_instructions.feeReceiver));
    }

    function claimShareAndStakeTo(ERC20 token) public {
        // ensure bootstrap has been existed and ended
        address lpToken = IDEX(_instructions.dex).getLiquidityTokenAddress(
            address(token), address(_instructions.otherContributionToken)
        );
        require(lpToken != address(0), "DropAndBootstrapStakeRouter: bootstrap not exist");
        (uint256 rateA, uint256 rateB) = IBootstrap(_instructions.dex).getInitialShareExchangeRate(
            address(token), address(_instructions.otherContributionToken)
        );
        require(rateA != 0 && rateB != 0, "DropAndBootstrapStakeRouter: bootstrap must be ended");

        // ensure bootstrap lp token is matched the share token of Euphrates pool
        require(
            lpToken == address(IStakingTo(_instructions.euphrates).shareTypes(_instructions.poolId)),
            "DropAndBootstrapStakeRouter: Euphrates pool share token is not matched the lp token"
        );

        (uint256 contributionA, uint256 contributionB) = IBootstrap(_instructions.dex).getProvisionPoolOf(
            address(this), address(token), address(_instructions.otherContributionToken)
        );

        // there's provision still, need to claim dex share
        if (contributionA != 0 || contributionB != 0) {
            bool claimResult = IBootstrap(_instructions.dex).claimDexShare(
                address(this), address(token), address(_instructions.otherContributionToken)
            );
            require(claimResult, "DropAndBootstrapStakeRouter: claimDexShare failed");
        }

        uint256 stakeAmount = ERC20(lpToken).balanceOf(address(this));

        // there's lp token, stake to Euphrates
        if (stakeAmount > 0) {
            ERC20(lpToken).safeApprove(_instructions.euphrates, stakeAmount);
            bool stakeResult =
                IStakingTo(_instructions.euphrates).stakeTo(_instructions.poolId, stakeAmount, _instructions.recipient);
            require(stakeResult, "DropAndBootstrapStakeRouter: stakeTo failed");
        }

        _destroy();
    }

    function refundProvision(ERC20 token) public {
        // ensure bootstrap is aborted
        address lpToken = IDEX(_instructions.dex).getLiquidityTokenAddress(
            address(token), address(_instructions.otherContributionToken)
        );
        require(lpToken == address(0), "DropAndBootstrapStakeRouter: bootstrap must be aborted");
        (uint256 rateA, uint256 rateB) = IBootstrap(_instructions.dex).getInitialShareExchangeRate(
            address(token), address(_instructions.otherContributionToken)
        );
        require(rateA == 0 && rateB == 0, "DropAndBootstrapStakeRouter: bootstrap must be ended");

        // ensure exist provision
        (uint256 contributionA, uint256 contributionB) = IBootstrap(_instructions.dex).getProvisionPoolOf(
            address(this), address(token), address(_instructions.otherContributionToken)
        );

        // there's provision still, need to refund provision
        if (contributionA != 0 || contributionB != 0) {
            bool result = IBootstrap(_instructions.dex).refundProvision(
                address(this), address(token), address(_instructions.otherContributionToken)
            );
            require(result, "DropAndBootstrapStakeRouter: refund provision failed");
        }

        // refund provision to recipient
        token.safeTransfer(_instructions.recipient, token.balanceOf(address(this)));
        _instructions.otherContributionToken.safeTransfer(
            _instructions.recipient, _instructions.otherContributionToken.balanceOf(address(this))
        );

        _destroy();
    }

    function rescue(ERC20 token, bool isGasDrop) public {
        (uint256 contributionA, uint256 contributionB) = IBootstrap(_instructions.dex).getProvisionPoolOf(
            address(this), address(token), address(_instructions.otherContributionToken)
        );
        require(
            contributionA == 0 && contributionB == 0,
            "DropAndBootstrapStakeRouter: exist provision, must claim share or refund provision"
        );

        if (!_dropped) {
            if (isGasDrop) {
                // require transfer full dropFee to feeReceiver
                if (token.balanceOf(address(this)) < _instructions.dropFee) {
                    revert("DropAndBootstrapStakeRouter: cannot afford drop fee");
                }
                token.safeTransfer(_instructions.feeReceiver, _instructions.dropFee);
                // transfer all dropToken to recipient
                _instructions.dropToken.safeTransfer(
                    _instructions.recipient, _instructions.dropToken.balanceOf(address(this))
                );
            } else {
                // transfer all dropToken back to feeReceiver (no gas drop)
                _instructions.dropToken.safeTransfer(
                    _instructions.feeReceiver, _instructions.dropToken.balanceOf(address(this))
                );
            }
        }

        // transfer all remainning token to recipient to avoid it stuck in this contract
        token.safeTransfer(_instructions.recipient, token.balanceOf(address(this)));
        _instructions.otherContributionToken.safeTransfer(
            _instructions.recipient, _instructions.otherContributionToken.balanceOf(address(this))
        );

        address lpToken = IDEX(_instructions.dex).getLiquidityTokenAddress(
            address(token), address(_instructions.otherContributionToken)
        );
        if (lpToken != address(0)) {
            ERC20(lpToken).safeTransfer(_instructions.recipient, ERC20(lpToken).balanceOf(address(this)));
        }

        _destroy();
    }
}
