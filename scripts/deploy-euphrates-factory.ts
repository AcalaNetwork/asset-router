import { ethers, run } from 'hardhat';

async function main() {
    const Factory = await ethers.getContractFactory('EuphratesFactory');
    const factory = await Factory.deploy();
    await factory.deployed();

    console.log(`euphrates factory address: ${factory.address}`);
    console.log('remember to publish it!');

    await run('verify:verify', {
        address: factory.address,
        constructorArguments: [],
    });
}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});
