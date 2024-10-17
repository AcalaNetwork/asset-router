import '@acala-network/types';

import { ACA, LDOT } from '@acala-network/contracts/utils/AcalaTokens';
import { ApiPromise, WsProvider } from '@polkadot/api';
import { DEX } from '@acala-network/contracts/utils/Predeploy';
import { TransactionReceipt } from '@ethersproject/providers';
import { Wallet, constants } from 'ethers';
import { ethers } from 'hardhat';
import { parseUnits } from 'ethers/lib/utils';

import { ADDRESSES, CHAIN, ROUTER_TOKEN_INFO } from './consts';
import { DropAndBootstrapStakeFactory__factory, DropAndBootstrapStakeRouter__factory, ERC20__factory } from '../typechain-types';

const FACTORY_ADDR = '0x4972507E55e6C49820370b8823eF866fe701a1b1';
const EUPHRATES_ADDR = '0x7Fe92EC600F15cD25253b421bc151c51b0276b7D';
const JITOSOL_ADDR = ROUTER_TOKEN_INFO.jitosol.acalaAddr;
const FEE_ADDR = ADDRESSES[CHAIN.ACALA].feeAddr;

const NODE_URL = 'wss://crosschain-dev.polkawallet.io/chopsticksAcala';

(async () => {
  const api = await ApiPromise.create({
    provider: new WsProvider(NODE_URL),
  });

  const [wallet] = await ethers.getSigners();
  const aca = ERC20__factory.connect(ACA, wallet);
  const jitosol = ERC20__factory.connect(JITOSOL_ADDR, wallet);
  const factory = DropAndBootstrapStakeFactory__factory.connect(FACTORY_ADDR, wallet);

  // prepare the route instructions
  const recipient = Wallet.createRandom().address;
  const dropAmount = parseUnits(process.env.GAS_DROP ?? '0', 12);

  const insts = {
    euphrates: EUPHRATES_ADDR,
    dex: DEX,
    dropToken: ACA,
    otherContributionToken: LDOT,
    poolId: 7,
    recipient,
    dropFee: 0,
    feeReceiver: wallet.address,
  };

  if (dropAmount.gt(0)) {
    console.log('approving ACA to fatory ...');
    await (await aca.approve(FACTORY_ADDR, constants.MaxUint256)).wait();
  }

  const routerAddr = await factory.callStatic.deployDropAndBootstrapStakeRouter(
    FEE_ADDR,
    insts,
    dropAmount,
  );

  console.log({ routerAddr });

  for (let i = 0; i < 3; i++) {
    console.log('');
    console.log(`-------------------- RUN ${i} --------------------`);
    console.log('transfering jitosol to router ...');
    const transferAmount = parseUnits('0.1', 9);
    await (await jitosol.transfer(routerAddr, transferAmount)).wait();

    const _routerAddr = await factory.callStatic.deployDropAndBootstrapStakeRouter(
      FEE_ADDR,
      insts,
      dropAmount,
    );

    if (_routerAddr !== routerAddr) {
      throw new Error('router address mismatch');
    } else {
      console.log('router address match');
    }

    const receipt = await (await factory.deployDropAndBootstrapStakeRouterAndRoute(
      FEE_ADDR,
      insts,
      JITOSOL_ADDR,
      dropAmount,
    )).wait();

    console.log('querying tx info ...');
    const blockHash = receipt.blockHash;
    const apiAt = await api.at(blockHash);
    const events = await apiAt.query.system.events();
    const evmEvents = events.filter(e => e.event.section.toLocaleLowerCase() === 'evm');

    for (const evmEvent of evmEvents) {
      console.log(evmEvent.event.toHuman());
    }
  }

  await api.disconnect();
})();
