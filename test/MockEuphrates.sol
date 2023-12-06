// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.17;

import "euphrates/IStaking.sol";
import "euphrates/Staking.sol";
import "./MockToken.sol";

contract MockEuphrates is Staking, IStakingTo {
    using SafeMath for uint256;
    using SafeERC20 for IERC20;

    function stakeTo(uint256 poolId, uint256 amount, address receiver) public override returns (bool) {
        require(amount > 0, "cannot stake 0");
        IERC20 shareType = IERC20(address(shareTypes(poolId)));
        require(address(shareType) != address(0), "invalid pool");

        _totalShares[poolId] = _totalShares[poolId].add(amount);
        _shares[poolId][receiver] = _shares[poolId][receiver].add(amount);

        shareType.safeTransferFrom(msg.sender, address(this), amount);

        emit Stake(receiver, poolId, amount);

        return true;
    }
}
