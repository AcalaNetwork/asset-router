import { ethers, run } from 'hardhat';

async function main() {
  const Factory = await ethers.getContractFactory('DropAndBootstrapStakeFactory');
  const factory = await Factory.deploy();
  await factory.deployed();

  console.log(`drop and bootstrap factory address: ${factory.address}`);

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
