import { ethers } from 'hardhat';
import { gasOverride, loadSetups } from './utils';

async function main() {
  const { deployer, user, relayer, usdt, fee, factory } = await loadSetups();

  const routerAddr = await factory.callStatic.deployXcmRouter(fee.address, { dummy: user.address }, gasOverride);
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

  await (await usdt.connect(user).transfer(routerAddr, ethers.utils.parseEther('0.001'), gasOverride)).wait();
  await _printBalance('after wormhole withdraw to router');

  const tx = await factory.deployXcmRouterAndRoute(fee.address, { dummy: user.address }, usdt.address, gasOverride);
  await tx.wait();
  await _printBalance('after router xcm to user');
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
