import { ethers, network } from 'hardhat';
import { ADDRESSES } from './consts';
import { gasOverride } from './utils';

const FEES = [{
  token: ADDRESSES[network.name].usdtAddr,
  amount: ethers.utils.parseEther('0.0002'),
}];

async function main() {
  const FeeRegistry = await ethers.getContractFactory('FeeRegistry');
  const fee = await FeeRegistry.deploy(FEES, gasOverride);
  await fee.deployed();

  console.log(`feeRegistry address: ${fee.address}`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
