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
**NOTE**: current node version has [a bug with CREATE2](https://github.com/AcalaNetwork/Acala/pull/2497), so it's recommended to use a chopstick fork of karura testnet，and restart after every run. Otherwise routing for the second time will fail.

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
NOTE: current version uses **mocked xtokens**

- run the xcm routing flow on local mandala
need to start a new local mandala node + rpc adapter
```
$ yarn hardhat test test/xcm-route.test.ts --network mandala

  XcmRouter
usdt address: 0x3d3593927228553b349767ABa68d4fb1514678CB
feeRegistry address: 0xD26e19913ca16B5B59aF7f07472f97cC9eA3f12B
xTokens address: 0xf80A32A835F79D7787E8a8ee5721D0fEaFd78108
factory address: 0x217b896620AfF6518B9862160606695607A63442
{ predictedRouterAddr: '0xa22b39dc81332C47c5911F980928f495Cdadb189' }
    ✔ deploy xcm router and route (607ms)
```
