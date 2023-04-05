import { ethers, network } from 'hardhat';
import { ADDRESSES } from './consts';
import { gasOverride } from './utils';

async function main() {
  const tokenAddr = ADDRESSES[network.name].usdcAddr;
  const Token = await ethers.getContractFactory('MockToken');
  const token = Token.attach(tokenAddr);
  const decimals = await token.decimals();

  const feeConfig = [{
    token: tokenAddr,
    amount: ethers.utils.parseUnits('0.0002', decimals),
  }];

  const FeeRegistry = await ethers.getContractFactory('FeeRegistry');
  const fee = await FeeRegistry.deploy(feeConfig, gasOverride);
  await fee.deployed();

  console.log(`feeRegistry address: ${fee.address}`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
