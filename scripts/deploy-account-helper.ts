import { ethers, run } from 'hardhat';

async function main() {
  const AccountHelper = await ethers.getContractFactory('AccountHelper');
  const ac = await AccountHelper.deploy();
  await ac.deployed();

  if (process.env.VERIFY) {
    await run('verify:verify', {
      address: '0x0252340cC347718f9169d329CEFf8B15A92badf8',
      constructorArguments: [],
    });
  }

  console.log(`AccountHelper address: ${ac.address}`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
