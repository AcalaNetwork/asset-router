import { ethers, run } from 'hardhat';

async function main() {
  const Factory = await ethers.getContractFactory('DropAndSwapStakeFactory');
  const factory = await Factory.deploy();
  await factory.deployed();

  console.log(`swap and stake factory address: ${factory.address}`);

  if (process.env.VERIFY) {
    await run('verify:verify', {
      address: factory.address,
      constructorArguments: [],
    });
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
