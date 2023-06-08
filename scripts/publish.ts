import { ethers } from 'hardhat';
import { EVM as EVM_ADDR } from '@acala-network/contracts/utils/Predeploy';
import EVM_JSON from '@acala-network/contracts/build/contracts/EVM.json';
import { Contract } from 'ethers';

const targetContract = '0xFa0e2F000Fd07f1820383528357dF6aa50E44586';

async function main() {
  const [deployer] = await ethers.getSigners();
  const evm = new Contract(EVM_ADDR, EVM_JSON.abi, deployer);
  const developerStatus = evm.developerStatus(deployer.address);
  if (!developerStatus) {
    console.log('enabling developer status ...');
    await (await evm.developerEnable()).wait();
  }

  console.log(`publishing contract ${targetContract} ...`);
  await (await evm.publishContract(targetContract)).wait();

  console.log('done 🎉')
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
