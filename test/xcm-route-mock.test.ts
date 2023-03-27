import { expect } from 'chai';
import { ethers } from 'hardhat';
import { gasOverride } from '../scripts/utils';
import { FeeRegistry, MockToken, MockXtokens } from '../typechain-types';
import { Factory, XcmInstructionsStruct } from '../typechain-types/src/Factory';

describe('XcmRouter', () => {
  let usdt: MockToken;
  let fee: FeeRegistry;
  let xTokens: MockXtokens;
  let factory: Factory;

  const ROUTING_FEE = 2;

  before('setup', async () => {
    /* ---------- deploy USDT ---------- */
    const MockToken = await ethers.getContractFactory('MockToken');
    usdt = await MockToken.deploy('usdt', 'USDT', gasOverride);
    await usdt.deployed();
    console.log(`usdt address: ${usdt.address}`);

    /* ---------- deploy FeeRegistry ---------- */
    const FEES = [{
      token: usdt.address,
      amount: ethers.utils.parseEther(String(ROUTING_FEE)),
    }];
    const FeeRegistry = await ethers.getContractFactory('FeeRegistry');
    fee = await FeeRegistry.deploy(FEES, gasOverride);
    await fee.deployed();
    console.log(`feeRegistry address: ${fee.address}`);

    /* ---------- deploy MockXtokens ---------- */
    const MockXtokens = await ethers.getContractFactory('MockXtokens');
    xTokens = await MockXtokens.deploy(gasOverride);
    await xTokens.deployed();
    console.log(`xTokens address: ${xTokens.address}`);

    expect(xTokens.address).to.eq(
      '0xf80A32A835F79D7787E8a8ee5721D0fEaFd78108',
      'unexpected xTokens address. Need to run this script with new local mandala node!',
    );

    /* ---------- deploy factory ---------- */
    const Factory = await ethers.getContractFactory('Factory');
    factory = await Factory.deploy(gasOverride);
    await factory.deployed();
    console.log(`factory address: ${factory.address}`);
  });

  it ('deploy xcm router and route', async () => {
    const [deployer, user, relayer] = await ethers.getSigners();

    const xcmInstruction: XcmInstructionsStruct = {
      dest: user.address,
      weight: '0x00',
    };
    const routerAddr = await factory.callStatic.deployXcmRouter(fee.address, xcmInstruction, gasOverride);
    console.log({ predictedRouterAddr: routerAddr });

    const fetchBalances = async () => {
      const [deployerB, userB, relayerB, routerB] = await Promise.all([
        usdt.balanceOf(deployer.address),
        usdt.balanceOf(user.address),
        usdt.balanceOf(relayer.address),
        usdt.balanceOf(routerAddr),
      ]);

      return {
        deployerBal: Number(ethers.utils.formatEther(deployerB)),
        userBal: Number(ethers.utils.formatEther(userB)),
        relayerBal: Number(ethers.utils.formatEther(relayerB)),
        routerBal: Number(ethers.utils.formatEther(routerB)),
      };
    };

    /* ---------- init state ---------- */
    let { deployerBal, userBal, relayerBal, routerBal } = await fetchBalances();
    expect(deployerBal).to.eq(10000);
    expect(userBal).to.eq(0);
    expect(relayerBal).to.eq(0);
    expect(routerBal).to.eq(0);

    /* ---------- after wormhole withdraw to router ---------- */
    const ROUTE_AMOUNT = 100;
    await (await usdt.connect(deployer).transfer(routerAddr, ethers.utils.parseEther(String(ROUTE_AMOUNT)), gasOverride)).wait();
    ({ deployerBal, userBal, relayerBal, routerBal } = await fetchBalances());
    expect(deployerBal).to.eq(10000 - ROUTE_AMOUNT);
    expect(userBal).to.eq(0);
    expect(relayerBal).to.eq(0);
    expect(routerBal).to.eq(ROUTE_AMOUNT);

    /* ---------- after router xcm to user ---------- */
    const tx = await factory.connect(relayer).deployXcmRouterAndRoute(fee.address, xcmInstruction, usdt.address, gasOverride);
    await tx.wait();
    ({ deployerBal, userBal, relayerBal, routerBal } = await fetchBalances());
    expect(deployerBal).to.eq(10000 - ROUTE_AMOUNT);
    expect(userBal).to.eq(ROUTE_AMOUNT - ROUTING_FEE);
    expect(relayerBal).to.eq(ROUTING_FEE);
    expect(routerBal).to.eq(0);
  });
});
