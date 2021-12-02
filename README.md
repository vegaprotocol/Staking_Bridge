# Staking_Bridge

This repository contains the smart contracts and tests for Staking VEGA tokens. This smart contract holds staked VEGA tokens that have been fully vested and withdrawn from the vesting contract. Users stake and unstake these tokens whenever they wish, as well as transfer to a new Ethereum address without unstaking the VEGA token. Like every ETH to Vega interaction This raises events on the Ethereum blockchain which is then consumed, verified, and propagated through the Vega network. This contract is meant to be simple while providing an extra layer of security to Vega, namely that in the event of validator compromise, the stake cannot be stolen or lost.

## IStake Interface
The IStake interface contains the events and a couple helper views that every staking contract must implement to be compatible.
Vega_Staking_Bridge implements this interface.

Events:
* `Stake_Deposited(address indexed user, uint256 amount, bytes32 indexed vega_public_key)`
* `Stake_Removed(address indexed user, uint256 amount, bytes32 indexed vega_public_key)`
* `Stake_Transferred(address indexed from, uint256 amount, address indexed to, bytes32 indexed vega_public_key)`

Views:
* `staking_token()` - returns the address of the token that is able to be staked in the implementing contract
* `stake_balance(address target, bytes32 vega_public_key)` - returns the number of tokens staked for that target address and vega_public_key pair
* `total_staked()` - returns the total tokens staked from all users in the implementing contract

## Vega_Staking_Bridge Contract
### Stake
This function allows a user to stake tokens. Since VEGA is a standard ERC20 token and they need to be `transferFrom` the user to the staking contract to be locked in. In order to do this a user MUST first run the `approve` on the VEGA token smart contract.

Function signature: `stake(uint256 amount, bytes32 vega_public_key) public`
Parameters:
* amount - The amount of tokens to stake
* vega_public_key - The target Vega public key that will be credited with the deposit

Emits: `Stake_Deposited` event

NOTE: users MUST run `approve()` on VEGA token contract before attempting to stake.

### Unstake
This function allows a user to unstake and withdraw previously staked tokens. The user's address must have at least the amount provided previously staked.

Function signature: `remove_stake(uint256 amount, bytes32 vega_public_key) public`
Parameters:
* amount - The amount of tokens to remove
* vega_public_key - The target Vega public key that will be unstaked and withdrawn from

Emits: `Stake_Removed` event

### Transfer Stake
This function allows a user to transfer staked tokens from one Ethereum address to another without unstaking from the target public key. The user running this function must have previously staked tokens to the target vega_public_key.

Function signature: `transfer_stake(uint256 amount, address new_address, bytes32 vega_public_key) public`
Parameters:
* amount - The amount of tokens to transfer
* new_address - The Ethereum address to own the transferred stake, which will be able to withdraw at a later time
* vega_public_key - The target Vega public key whose balance is to be transfered

Emits: `Stake_Transferred` event


## Deployments

### Mainnet 
* Staking Bridge (mainnet): `0x195064D33f09e0c42cF98E665D9506e0dC17de68`

### Ropsten
* Staking Bridge (testnet): `0xB24e0ac9199e8f4F69eF0eD8ee266b2433AF0dF0`
* Staking Bridge (stagnet): `0x7D88CD817227D599815d407D929af18Bb8D57176`
