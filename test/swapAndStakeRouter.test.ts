import { ACA } from '@acala-network/contracts/utils/AcalaTokens';
import { BigNumber, constants } from 'ethers';
import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers';
import { ethers } from 'hardhat';
import { expect } from 'chai';
import { formatUnits, parseEther, parseUnits } from 'ethers/lib/utils';

import { ADDRESSES } from '../scripts/consts';
import { FeeRegistry, MockToken, SwapAndStakeEuphratesFactory } from '../typechain-types';
import { ONE_ACA, almostEq, toHuman } from '../scripts/utils';

const { swapAndStakeFactoryAddr, feeAddr } = ADDRESSES.ACALA_TESTNET;

describe('Stake and Swap Router', () => {
  // fixed
  let jitosol: MockToken;
  let aca: MockToken;
  let fee: FeeRegistry;
  let factory: SwapAndStakeEuphratesFactory;
  let decimals: number;
  let routingFee: BigNumber;
  let stakeAndSupplyAmount: BigNumber;
  let user: SignerWithAddress;
  let relayer: SignerWithAddress;

  // dynamic
  let routerAddr: string;
  let bal0: Awaited<ReturnType<typeof fetchTokenBalances>>;
  let bal1: Awaited<ReturnType<typeof fetchTokenBalances>>;

  const fetchTokenBalances = async () => {
    const [
      userBal,
      relayerBal,
      userBalJitoSol,
      relayerBalJitoSol,
      routerBalJitoSol,
    ] = await Promise.all([
      user.getBalance(),
      relayer.getBalance(),
      jitosol.balanceOf(user.address),
      jitosol.balanceOf(relayer.address),
      jitosol.balanceOf(routerAddr),
    ]);

    console.log({
      userBal: toHuman(userBal, 18),
      relayerBal: toHuman(relayerBal, 18),
      userBalJitoSol: toHuman(userBalJitoSol, decimals),
      relayerBalJitoSol: toHuman(relayerBalJitoSol, decimals),
      routerBalJitoSol: toHuman(routerBalJitoSol, decimals),
    });

    return {
      userBal,
      relayerBal,
      userBalJitoSol,
      relayerBalJitoSol,
      routerBalJitoSol,
    };
  };

  before('setup', async () => {
    ([user, relayer] = await ethers.getSigners());

    const Token = await ethers.getContractFactory('MockToken');
    const Fee = await ethers.getContractFactory('FeeRegistry');
    const Factory = await ethers.getContractFactory('SwapAndStakeEuphratesFactory');

    jitosol = Token.attach('0xa7fb00459f5896c3bd4df97870b44e868ae663d7');
    aca = Token.attach(ACA);
    fee = Fee.attach(feeAddr);
    factory = Factory.attach(swapAndStakeFactoryAddr).connect(relayer);
    decimals = await jitosol.decimals();
    routingFee = await fee.getFee(jitosol.address);
    stakeAndSupplyAmount = parseUnits('1', decimals);

    console.log(`jitosol address: ${jitosol.address}`);
    console.log(`feeRegistry address: ${fee.address}`);
    console.log(`factory address: ${factory.address}`);
    console.log(`user address: ${user.address}`);
    console.log(`relayer address: ${relayer.address}`);
    console.log(`token decimals: ${decimals}`);
    console.log(`router fee: ${Number(formatUnits(routingFee, decimals))}`);
  });

  describe('swap and route', async () => {
    it('works', async () => {
      const supplyAmount = parseUnits('0.1', decimals);
      const targetAmount = parseUnits('2', 12);
      const targetAmountNative = parseEther('2');
      const insts = {
        recipient: user.address,
        supplyAmount,
        maker: relayer.address,
        targetToken: ACA,
        poolId: 7,
        euphrates: '0x7Fe92EC600F15cD25253b421bc151c51b0276b7D',
      };

      // console.log('approving ...');
      // const approveTx = await aca.connect(relayer).approve(swapAndStakeFactoryAddr, constants.MaxUint256);
      // await approveTx.wait();
      // console.log('approved');

      routerAddr = await factory.callStatic.deploySwapAndStakeEuphratesRouter(fee.address, insts, targetAmount);

      console.log({ predictedRouterAddr: routerAddr });

      console.log('\n-------------------- init state --------------------');
      bal0 = await fetchTokenBalances();
      expect(bal0.userBalJitoSol).to.gte(stakeAndSupplyAmount);

      // router shouldn't exist
      let routerCode = await relayer.provider!.getCode(routerAddr);
      expect(routerCode).to.eq('0x');

      await (await jitosol.connect(user).transfer(
        routerAddr,
        stakeAndSupplyAmount,
      )).wait();

      console.log('\n-------------------- after user deposited to router --------------------');
      await fetchTokenBalances();


      const deployAndRoute = await factory.deploySwapAndStakeEuphratesRouterAndRoute(
        fee.address,
        insts,
        jitosol.address,
        targetAmount,
      );
      await deployAndRoute.wait();

      console.log('\n-------------------- after router routed and staked --------------------');
      bal1 = await fetchTokenBalances();

      // router should have no remaining balance
      expect(bal1.routerBalJitoSol).to.eq(0);

      // user should receive LDOT and swapped target token
      expect(bal0.userBalJitoSol.sub(bal1.userBalJitoSol)).to.eq(stakeAndSupplyAmount);
      almostEq(bal1.userBal.sub(bal0.userBal), targetAmountNative);

      // relayer should receive fee
      expect(bal1.relayerBalJitoSol.sub(bal0.relayerBalJitoSol)).to.eq(routingFee);

      // router should be destroyed
      routerCode = await relayer.provider!.getCode(routerAddr);
      expect(routerCode).to.eq('0x');
    });
  });

});
