import { ethers } from 'hardhat';
import { EVM as EVM_ADDR } from '@acala-network/contracts/utils/KaruraAddress';
import EVM_JSON from '@acala-network/contracts/build/contracts/EVM.json';
import { Contract } from 'ethers';
import { gasOverride } from './utils';

async function main() {
  const Factory = await ethers.getContractFactory('Factory');
  const factory = await Factory.deploy(gasOverride);
  await factory.deployed();

  console.log(`factory address: ${factory.address}`);
  console.log('remember to publish it!');

  // evm precomile doesn't seem to work on karura testnet
  // use manual publish instead

  // const [deployer] = await ethers.getSigners();
  // const evm = new Contract(EVM_ADDR, EVM_JSON.abi, deployer);
  // await (await evm.developerEnable()).wait();
  // await (await evm.publishFree(factory.address)).wait();
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
