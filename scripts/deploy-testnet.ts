import { CHAIN_ID_ETH, tryNativeToHexString } from '@certusone/wormhole-sdk';
import { ethers } from 'hardhat';
import { EVM as EVM_ADDR } from '@acala-network/contracts/utils/KaruraAddress';
import EVM_JSON from '@acala-network/contracts/build/contracts/EVM.json';
import { WormholeInstructionsStruct } from '../typechain-types/src/Factory';
import { Contract } from 'ethers';

const gasOverride = {
  gasPrice: '0x33a70303ea',
  gasLimit: '0x329b140',
};

const KARURA_TESTNET_USDT_ADDRESS = '0x478dEFc2Fc2be13a505dafBDF1e5400847E2efF6';
const KARURA_TESTNET_TOKEN_BRIDGE_ADDRESS = '0xd11De1f930eA1F7Dd0290Fe3a2e35b9C91AEFb37';
const KARURA_TESTNET_FACTORY_ADDRESS = '0x2f0EA25f12963784B9cd8ae93975d1126d1e4089';
const KARURA_TESTNET_FEE_ADDRESS = '0x8af989e00782bcb8d837590b88c2968454e7b6aa';

async function main() {
  const [deployer, user] = await ethers.getSigners();
  const FeeRegistry = await ethers.getContractFactory('FeeRegistry');
  const Factory = await ethers.getContractFactory('Factory');
  const Token = await ethers.getContractFactory('MockToken');
  const WormholeRouter = await ethers.getContractFactory('WormholeRouter');

  const usdt = Token.attach(KARURA_TESTNET_USDT_ADDRESS);
  const fee = FeeRegistry.attach(KARURA_TESTNET_FEE_ADDRESS);
  const factory = Factory.attach(KARURA_TESTNET_FACTORY_ADDRESS);

  // const usdt = await Token.deploy('tk1', 'TK', gasOverride);
  // await usdt.deployed();

  // const fee = await FeeRegistry.deploy([{
  //   token: usdt.address,
  //   amount: ethers.utils.parseEther('0.0002'),
  // }], gasOverride);
  // await fee.deployed();

  // const factory = await Factory.deploy(gasOverride);
  // await factory.deployed();

  // const evm = new Contract(EVM_ADDR, EVM_JSON.abi, deployer);
  // const res = await evm.developerEnable();
  // await res.wait();
  // await (await evm.publishFree(factory.address)).wait();

  console.log(`factory address: ${factory.address}`);
  console.log(`deployer address: ${deployer.address}`);
  console.log(`user address: ${user.address}`);
  console.log(`usdt address: ${KARURA_TESTNET_USDT_ADDRESS}`);
  console.log(`feeRegistry address: ${fee.address}`);
  console.log(`router fee: ${ethers.utils.formatEther(await fee.getFee(KARURA_TESTNET_USDT_ADDRESS))}`);

  const targetRecepient = Buffer.from(tryNativeToHexString(user.address, 'ethereum'), 'hex');
  const wormholeInstructions: WormholeInstructionsStruct = {
    recipientChain: CHAIN_ID_ETH,
    recipient: targetRecepient,
    nonce: 0,
    arbiterFee: 0,
  };

  // console.log({ wormholeInstructions });
  const routerAddr = await factory.callStatic.deployWormholeRouter(fee.address, wormholeInstructions, KARURA_TESTNET_TOKEN_BRIDGE_ADDRESS, gasOverride);
  const allowrance = await usdt.allowance(routerAddr, KARURA_TESTNET_TOKEN_BRIDGE_ADDRESS);
  console.log({ routerAddr, allowrance });

  const _printBalance = async (msg:string) => {
    const [deployerBal, userBal, routerBal] = await Promise.all([
      usdt.balanceOf(deployer.address),
      usdt.balanceOf(user.address),
      usdt.balanceOf(routerAddr),
    ]);

    console.log(msg, {
      deployer: ethers.utils.formatEther(deployerBal),
      user: ethers.utils.formatEther(userBal),
      router: ethers.utils.formatEther(routerBal),
    });
  };
  await _printBalance('init state');

  await (await usdt.connect(user).transfer(routerAddr, ethers.utils.parseEther('0.001'), gasOverride)).wait();
  await _printBalance('after user xcm to router');

  console.log('deploying router and route ...');
  const tx = await factory.deployWormholeRouterAndRoute(
    fee.address,
    wormholeInstructions,
    KARURA_TESTNET_TOKEN_BRIDGE_ADDRESS,
    usdt.address,
    gasOverride
  );
  const receipt = await tx.wait();
  // console.log(JSON.stringify(receipt, null, 2));
  await _printBalance('after router deposit to wormhole');

  console.log(`token bridged to wormhole! Redeem at https://wormhole-foundation.github.io/example-token-bridge-ui/#/redeem with txHash ${receipt.transactionHash}`);

}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
