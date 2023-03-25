import { CHAIN_ID_ETH, tryNativeToHexString } from '@certusone/wormhole-sdk';
import { ethers } from 'hardhat';
import { WormholeInstructionsStruct } from '../typechain-types/src/Factory';
import { gasOverride, loadSetups } from './utils';

async function main() {
  const { deployer, user, relayer, usdt, fee, factory, tokenBridgeAddr } = await loadSetups();

  const targetRecepient = Buffer.from(tryNativeToHexString(user.address, 'ethereum'), 'hex');
  const wormholeInstructions: WormholeInstructionsStruct = {
    recipientChain: CHAIN_ID_ETH,
    recipient: targetRecepient,
    nonce: 0,
    arbiterFee: 0,
  };

  const routerAddr = await factory.callStatic.deployWormholeRouter(
    fee.address,
    wormholeInstructions,
    tokenBridgeAddr,
    gasOverride,
  );
  console.log({ predictedRouterAddr: routerAddr });

  const _printBalance = async (msg: string) => {
    const [deployerBal, userBal, relayerBal, routerBal] = await Promise.all([
      usdt.balanceOf(deployer.address),
      usdt.balanceOf(user.address),
      usdt.balanceOf(relayer.address),
      usdt.balanceOf(routerAddr),
    ]);

    console.log(msg, {
      deployer: ethers.utils.formatEther(deployerBal),
      user: ethers.utils.formatEther(userBal),
      relayer: ethers.utils.formatEther(relayerBal),
      router: ethers.utils.formatEther(routerBal),
    });
  };
  await _printBalance('init state');

  console.log('user xcming token to router ...');
  await (await usdt.connect(user).transfer(routerAddr, ethers.utils.parseEther('0.001'), gasOverride)).wait();
  await _printBalance('after user xcm to router');

  console.log('deploying router and route ...');
  const tx = await factory.deployWormholeRouterAndRoute(
    fee.address,
    wormholeInstructions,
    tokenBridgeAddr,
    usdt.address,
    gasOverride
  );
  const receipt = await tx.wait();
  await _printBalance('after router deposit to wormhole');

  console.log(`token bridged to wormhole! \nRedeem at https://wormhole-foundation.github.io/example-token-bridge-ui/#/redeem with txHash ${receipt.transactionHash}`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
