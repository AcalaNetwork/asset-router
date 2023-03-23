import { ethers } from 'hardhat';

const gasOverride = {
  gasPrice: '0x33a70303ea',
  gasLimit: '0x329b140',
};

async function main() {
  const [deployer, user] = await ethers.getSigners();
  const FeeRegistry = await ethers.getContractFactory('FeeRegistry');
  const Factory = await ethers.getContractFactory('Factory');
  const Token = await ethers.getContractFactory('MockToken');

  const token = await Token.deploy('tk1', 'TK', gasOverride);
  await token.deployed();

  const factory = await Factory.deploy(gasOverride);
  await factory.deployed();

  const fee = await FeeRegistry.deploy([{
    token: token.address,
    amount: ethers.utils.parseEther('1'),
  }], gasOverride);

  await fee.deployed();

  console.log(`token address: ${token.address}`);
  console.log(`factory address: ${factory.address}`);
  console.log(`feeRegistry address: ${fee.address}`);

  const xcmRouterAddr = await factory.callStatic.deployXcmRouter(fee.address, { dummy: user.address }, gasOverride);
  console.log({ xcmRouterAddr });

  const _printBalance = async (msg:string) => {
    console.log(msg, {
      deployer: ethers.utils.formatEther(await token.balanceOf(deployer.address)),
      user: ethers.utils.formatEther(await token.balanceOf(user.address)),
      router: ethers.utils.formatEther(await token.balanceOf(xcmRouterAddr)),
    });
  };
  await _printBalance('init state');

  await token.transfer(xcmRouterAddr, ethers.utils.parseEther('10'), gasOverride);
  await _printBalance('after wormhole withdraw to router');

  await factory.deployXcmRouterAndRoute(fee.address, { dummy: user.address }, token.address, gasOverride);
  await _printBalance('after router withdraw to user');
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
