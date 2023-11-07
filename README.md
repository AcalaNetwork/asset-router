# asset-router

## Develop with Foundry
- install [foundry](https://book.getfoundry.sh/getting-started/installation#installation) if you haven't.

- install deps
```
foundryup
```

- build
```
forge build
```

- test
```
forge test
```

## Run with Hardhat
- install deps
```
yarn
```

- build
```
yarn build
```

### wormhole router
- deploy fee and factory
this is optional, since there already exist [deployed instances](./scripts/utils.ts)
```
$ yarn hardhat run scripts/deploy-fee.ts --network karuraTestnet
feeRegistry address: 0x109FdB5a8f3EC051C21B3482ac89599e7D76561C

$ yarn hardhat run scripts/deploy-factory.ts --network karuraTestnet
factory address: 0x6e29385677E28eE3Df7d0E87e285291F197A6FF3
remember to publish it!
// then manually publish factory contract
```

- run the wormhole routing flow on karura testnet
```
$ yarn hardhat run scripts/route-wormhole.ts --network karuraTestnet

setup finished
{
  deployerAddr: '0x75E480dB528101a381Ce68544611C169Ad7EB342',
  userAddr: '0x0085560b24769dAC4ed057F1B2ae40746AA9aAb6',
  relayerAddr: '0x0294350d7cF2C145446358B6461C1610927B3A87',
  factoryAddr: '0x6e29385677E28eE3Df7d0E87e285291F197A6FF3',
  usdtAddr: '0x478dEFc2Fc2be13a505dafBDF1e5400847E2efF6',
  feeRegistryAddr: '0x109FdB5a8f3EC051C21B3482ac89599e7D76561C',
  routerFee: '0.0002'
}

{ predictedRouterAddr: '0x694BaB061e5eBa2ad91F870f0304E471f7a237EC' }
init state { deployer: '0.7327', user: '0.096', relayer: '0.0', router: '0.0' }
user xcming token to router ...
after user xcm to router { deployer: '0.7327', user: '0.095', relayer: '0.0', router: '0.001' }
deploying router and route ...
after router deposit to wormhole { deployer: '0.7327', user: '0.095', relayer: '0.0002', router: '0.0' }
token bridged to wormhole!
Redeem at https://wormhole-foundation.github.io/example-token-bridge-ui/#/redeem with txHash 0xc3a811f9d6302f0e9a3ccd0f432acb2de84d6ab9d687ff984881493b6bae23cd
```

### xcm router

- run the xcm routing flow on karura testnet
```
$ yarn hardhat test test/xcm-route.test.ts --network karuraTestnet

  XcmRouter
usdc address: 0xE5BA1e8E6BBbdC8BbC72A58d68E74B13FcD6e4c7
feeRegistry address: 0x8dA2DebebFE5cCe133a80e7114621192780765BB
factory address: 0xfa62f1874aec14f7ba37723a65ca89a710c80f6c
xTokens address: 0x0000000000000000000000000000000000000809
token decimals: 6
router fee: 0.0002
{ predictedRouterAddr: '0x8cE61c252eCC083751f29FB13E452879307022d2' }
    ✔ predict router address (113ms)

-------------------- init state --------------------
{ deployerBal: 1.837, relayerBal: 0.0014, routerBal: 0, userBal: 0 }
    ✔ init state (338ms)

-------------------- after wormhole withdraw to router --------------------
{ deployerBal: 1.827, relayerBal: 0.0014, routerBal: 0.01, userBal: 0 }
    ✔ after wormhole withdraw to router (12927ms)

-------------------- after router xcm to user --------------------
{ deployerBal: 1.827, relayerBal: 0.0016, routerBal: 0, userBal: 0 }
    ✔ after router xcm to user (49972ms)
```

## homa router
- start a local acala fork
```
npx @acala-network/chopsticks@latest -c chopsticks/configs/acala.yml
```

- start a local rpc adapter
```
npx @acala-network/eth-rpc-adapter@latest -e ws://localhost:8000
```

- upgrade predeployed contracts with sudo (temp)

- run tests
```
yarn hardhat test test/homa-router.test.ts --network acalaFork
```
