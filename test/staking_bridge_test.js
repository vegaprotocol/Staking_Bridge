
const Vega_Staking_Bridge = artifacts.require("Vega_Staking_Bridge");
const Vega_2_TEST_STANDIN_DO_NOT_DEPLOY = artifacts.require("Vega_2_TEST_STANDIN_DO_NOT_DEPLOY");
const IStake = artifacts.require("IStake");


var abi = require('ethereumjs-abi');
var crypto = require("crypto");
var ethUtil = require('ethereumjs-util');
const { assert } = require('console');
const BN = web3.utils.BN;

let wallets = []
let new_asset_id = crypto.randomBytes(32);

contract("ERC20_Staking_Bridge",  (accounts) => {
    before(async()=>{

        wallets = await web3.eth.getAccounts();

    });

    it("Staking Bridge accepts and locks deposited VEGA tokens and emits Stake_Deposited event (0071-STAK-001)", async () => {
        
        let staking_bridge_instance = await Vega_Staking_Bridge.deployed();
        let vega_token_instance = await Vega_2_TEST_STANDIN_DO_NOT_DEPLOY.deployed();
        let initial_balance = (await vega_token_instance.balanceOf(wallets[0]))
        let initial_staking_bridge_balance = (await vega_token_instance.balanceOf(staking_bridge_instance.address))
        
        let initial_staking_bridge_stake_total = (await staking_bridge_instance.total_staked())
        let vega_public_key = crypto.randomBytes(32);
        let initial_staking_bridge_stake_balance = (await staking_bridge_instance.stake_balance(wallets[0], vega_public_key))
        
        let deposit_amount = new BN("1000000000000000000");

        await vega_token_instance.approve(staking_bridge_instance.address, deposit_amount, {from: wallets[0]});
        let stake_receipt = await staking_bridge_instance.stake(deposit_amount, vega_public_key, {from: wallets[0]});
        // ensure Stake_Deposited event is emitted
        
        if(stake_receipt.logs[0].event !== "Stake_Deposited"){
            throw "Stake_Deposited event not emitted";
        }

        let final_balance = (await vega_token_instance.balanceOf(wallets[0]))
        let final_staking_bridge_balance = (await vega_token_instance.balanceOf(staking_bridge_instance.address))
        let final_staking_bridge_stake_total = (await staking_bridge_instance.total_staked())
        let final_staking_bridge_stake_balance = (await staking_bridge_instance.stake_balance(wallets[0], vega_public_key))

        let n = initial_balance.sub(deposit_amount);

        if(final_balance.toString() !== n.toString()){
            throw "Wallet balance not updated after stake";
        }

        let m = initial_staking_bridge_balance.add(deposit_amount);

        if(final_staking_bridge_balance.toString() !== m.toString()){
            throw "Staking bridge balance not updated after stake";
        }

        let o = initial_staking_bridge_stake_total.add(deposit_amount);

        if(final_staking_bridge_stake_total.toString() !== o.toString()){
            throw "Staking bridge stake total not updated after stake";
        }

        let p = initial_staking_bridge_stake_balance.add(deposit_amount);

        if(final_staking_bridge_stake_balance.toString() !== p.toString()){
            throw "Staking bridge stake balance not updated after stake";
        }

    })


    it("Staking Bridge allows only stakers to remove their staked tokens and emits Stake_Removed event (0071-STAK-002)", async () => {
        let vega_public_key = crypto.randomBytes(32);

        let staking_bridge_instance = await Vega_Staking_Bridge.deployed();
        let vega_token_instance = await Vega_2_TEST_STANDIN_DO_NOT_DEPLOY.deployed();
        
        let deposit_amount = new BN("1000000000000000000");

        await vega_token_instance.approve(staking_bridge_instance.address, deposit_amount, {from: wallets[0]});
        await staking_bridge_instance.stake(deposit_amount, vega_public_key, {from: wallets[0]});

        let initial_balance = (await vega_token_instance.balanceOf(wallets[0]))
        let initial_staking_bridge_balance = (await vega_token_instance.balanceOf(staking_bridge_instance.address))        
        let initial_staking_bridge_stake_total = (await staking_bridge_instance.total_staked())        
        let initial_staking_bridge_stake_balance = (await staking_bridge_instance.stake_balance(wallets[0], vega_public_key))

        let remove_receipt = await staking_bridge_instance.remove_stake(deposit_amount, vega_public_key, {from: wallets[0]});

        // ensure Stake_Removed event is emitted

        if(remove_receipt.logs[0].event !== "Stake_Removed"){
            throw "Stake_Removed event not emitted";
        }

        let final_balance = (await vega_token_instance.balanceOf(wallets[0]))
        let final_staking_bridge_balance = (await vega_token_instance.balanceOf(staking_bridge_instance.address))
        let final_staking_bridge_stake_total = (await staking_bridge_instance.total_staked())
        let final_staking_bridge_stake_balance = (await staking_bridge_instance.stake_balance(wallets[0], vega_public_key))

        let n = initial_balance.add(deposit_amount);

        if(final_balance.toString() !== n.toString()){
            throw "Wallet balance not updated after stake removal";
        }

        let m = initial_staking_bridge_balance.sub(deposit_amount);

        if(final_staking_bridge_balance.toString() !== m.toString()){
            throw "Staking bridge balance not updated after stake removal";
        }

        let o = initial_staking_bridge_stake_total.sub(deposit_amount);

        if(final_staking_bridge_stake_total.toString() !== o.toString()){
            throw "Staking bridge stake total not updated after stake removal";
        }

        let p = initial_staking_bridge_stake_balance.sub(deposit_amount);

        if(final_staking_bridge_stake_balance.toString() !== p.toString()){
            throw "Staking bridge stake balance not updated after stake removal";
        }
    })

    it("Staking Bridge allows users with staked balance to transfer ownership of stake to new ethereum address that only the new address can remove (0071-STAK-003)", async () => {
        let vega_public_key = crypto.randomBytes(32);

        let staking_bridge_instance = await Vega_Staking_Bridge.deployed();
        let vega_token_instance = await Vega_2_TEST_STANDIN_DO_NOT_DEPLOY.deployed();
        
        let deposit_amount = new BN("1000000000000000000");

        await vega_token_instance.approve(staking_bridge_instance.address, deposit_amount, {from: wallets[0]});
        await staking_bridge_instance.stake(deposit_amount, vega_public_key, {from: wallets[0]});

        let initial_staking_bridge_stake_balance_0 = (await staking_bridge_instance.stake_balance(wallets[0], vega_public_key))

        let initial_staking_bridge_stake_balance_1 = (await staking_bridge_instance.stake_balance(wallets[1], vega_public_key))

        let transfer_receipt = await staking_bridge_instance.transfer_stake(deposit_amount, wallets[1], vega_public_key, {from: wallets[0]});

        // ensure Stake_Transferred event is emitted

        if(transfer_receipt.logs[0].event !== "Stake_Transferred"){
            throw "Stake_Transferred event not emitted";
        }

        let final_staking_bridge_stake_balance_0 = (await staking_bridge_instance.stake_balance(wallets[0], vega_public_key))
        let final_staking_bridge_stake_balance_1 = (await staking_bridge_instance.stake_balance(wallets[1], vega_public_key))

        let expected_0 = initial_staking_bridge_stake_balance_0.sub(deposit_amount);
        let expected_1 = initial_staking_bridge_stake_balance_1.add(deposit_amount);

        if(final_staking_bridge_stake_balance_0.toString() !== expected_0.toString()){
            throw "Staking bridge stake balance not updated after stake transfer";
        }

        if(final_staking_bridge_stake_balance_1.toString() !== expected_1.toString()){
            throw "Staking bridge stake balance not updated after stake transfer";
        }
        
    })
})