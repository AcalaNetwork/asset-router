import { network as curNetwork } from 'hardhat';
import { CHAIN_ID_BSC, tryNativeToHexString } from '@certusone/wormhole-sdk';
import { WormholeInstructionsStruct } from '../typechain-types/src/Factory';
import { getNetworNameFromHardhatNetwork, loadSetups } from './utils';
import { formatUnits, parseUnits } from 'ethers/lib/utils';

async function main() {
  const { deployer, user, relayer, usdc, fee, factory, tokenBridgeAddr, portalUrl, isMainnet } = await loadSetups();

  const targetRecepient = Buffer.from(tryNativeToHexString(user.address, CHAIN_ID_BSC), 'hex');
  const wormholeInstructions: WormholeInstructionsStruct = {
    recipientChain: CHAIN_ID_BSC,
    recipient: targetRecepient,
    nonce: 0,
    arbiterFee: 0,
  };

  const routerAddr = await factory.callStatic.deployWormholeRouter(
    fee.address,
    wormholeInstructions,
    tokenBridgeAddr,
  );
  console.log({ predictedRouterAddr: routerAddr });

  const _printBalance = async (msg: string) => {
    const [deployerBal, userBal, relayerBal, routerBal] = await Promise.all([
      usdc.balanceOf(deployer.address),
      usdc.balanceOf(user.address),
      usdc.balanceOf(relayer.address),
      usdc.balanceOf(routerAddr),
    ]);

    console.log(msg, {
      deployer: formatUnits(deployerBal, 6),
      user: formatUnits(userBal, 6),
      relayer: formatUnits(relayerBal, 6),
      router: formatUnits(routerBal, 6),
    });
  };
  await _printBalance('init state usdc balance:');

  const amount = isMainnet ? '0.06' : '0.001';
  console.log(`user xcming ${amount} usdc to router ...`);
  await (await usdc.connect(user).transfer(routerAddr, parseUnits(amount, 6))).wait();
  await _printBalance('after user xcm to router');

  console.log('deploying router and route ...');
  const tx = await factory.deployWormholeRouterAndRoute(
    fee.address,
    wormholeInstructions,
    tokenBridgeAddr,
    usdc.address,
  );
  const receipt = await tx.wait();
  await _printBalance('after router deposit to wormhole');

  console.log(`token bridged to wormhole! \nRedeem at ${portalUrl} with txHash ${receipt.transactionHash} and network ${getNetworNameFromHardhatNetwork(curNetwork) }`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
