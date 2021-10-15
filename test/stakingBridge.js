const VegaStakingBridge = artifacts.require('Vega_Staking_Bridge')
const VegaToken = artifacts.require('Vega_2_TEST_STANDIN_DO_NOT_DEPLOY');

const { expect } = require('chai');
const { ethers } = require('ethers');
const { ZERO_ADDRESS } = require('../helpers/address')
const {expectBignumberEqual} = require('../helpers/index')
const {findEventInTransaction} = require('../helpers/events')
const {parseEther, increase, shouldFailWithMessage, toBN, stringToBytes32} = require('../helpers/utils');

describe('Staking Bridge contract', () => {
    let accounts

    let stakeBridge;
    let token;

    before(async () => {
        accounts = await web3.eth.getAccounts()
    })

    beforeEach(async () => {
        // deploy token and staking bridge
        token = await VegaToken.new(parseEther('100'), 'test token', 'TT')
        stakeBridge = await VegaStakingBridge.new(token.address)
    })

    describe('stake()', () => {
        it('should not stake without approval', async () => {
            await token.mint_and_issue(accounts[1], parseEther('100'))
            await shouldFailWithMessage(
                stakeBridge.stake(parseEther('100'), stringToBytes32('accounts[1]'), {from: accounts[1]}),
                "ERC20: transfer amount exceeds allowance"
            )
        })

        it('should stake with valid approval', async () => {
            await token.mint_and_issue(accounts[1], parseEther('100'))
            await token.approve(stakeBridge.address, parseEther('100'), {from: accounts[1]})
            await stakeBridge.stake(parseEther('100'), stringToBytes32('accounts[1]'), {from: accounts[1]})
            expectBignumberEqual(await token.balanceOf(stakeBridge.address), parseEther('100'))
        })

        it('should emit correct event and parameters after valid stake', async () => {
            await token.mint_and_issue(accounts[1], parseEther('100'))
            await token.approve(stakeBridge.address, parseEther('100'), {from: accounts[1]})
            const tx = await stakeBridge.stake(parseEther('100'), stringToBytes32('accounts[1]'), {from: accounts[1]})
            const {args} = await findEventInTransaction(tx, "Stake_Deposited")
            expect(args.user).to.be.equal(accounts[1])
            expect(args.vega_public_key).to.be.equal(ethers.utils.formatBytes32String('accounts[1]'))
            expectBignumberEqual(args.amount, parseEther('100'))
        })

        it('staking zero amount works', async () => {
            await token.mint_and_issue(accounts[1], parseEther('100'))
            await token.approve(stakeBridge.address, parseEther('100'), {from: accounts[1]})
            const tx = await stakeBridge.stake(0, stringToBytes32('accounts[1]'), {from: accounts[1]})
            const {args} = await findEventInTransaction(tx, "Stake_Deposited")
            expect(args.user).to.be.equal(accounts[1])
            expect(args.vega_public_key).to.be.equal(ethers.utils.formatBytes32String('accounts[1]'))
            expectBignumberEqual(args.amount, 0)

        })
    })

    describe('remove_stake()', () => {
        it('cannot remove without staking first', async () => {
            await shouldFailWithMessage(
                stakeBridge.remove_stake(parseEther('100'), stringToBytes32('accounts[1]'), {from: accounts[1]}),
                "revert" // todo check error message
            )
        })

        it('should remove stake succesfully after staking', async () => {
            await token.mint_and_issue(accounts[1], parseEther('100'))
            await token.approve(stakeBridge.address, parseEther('100'), {from: accounts[1]})
            const tx = await stakeBridge.stake(parseEther('100'), stringToBytes32('accounts[1]'), {from: accounts[1]})
            await stakeBridge.remove_stake(parseEther('10'), stringToBytes32('accounts[1]'), {from: accounts[1]})
            expectBignumberEqual(await token.balanceOf(accounts[1]), parseEther('10'))
            expectBignumberEqual(await token.balanceOf(stakeBridge.address), parseEther('90'))
        })

        it('should emit correct event and parameters after removing stake', async () => {
            await token.mint_and_issue(accounts[2], parseEther('100'))
            await token.approve(stakeBridge.address, parseEther('100'), {from: accounts[2]})
            await stakeBridge.stake(parseEther('100'), stringToBytes32('accounts[1]'), {from: accounts[2]})
            const tx = await stakeBridge.remove_stake(parseEther('10'), stringToBytes32('accounts[1]'), {from: accounts[2]})
            const {args} = await findEventInTransaction(tx, "Stake_Removed")
            expect(args.user).to.be.equal(accounts[2])
            expect(args.vega_public_key).to.be.equal(ethers.utils.formatBytes32String('accounts[1]'))
            expectBignumberEqual(args.amount, parseEther('10'))
        })
    })

    describe('transfer_stake()', () => {
        it('', async () => {
            
        })
    })

    describe('staking_token()', () => {
        it('', async () => {
            
        })
    })

    describe('stake_balance()', () => {
        it('', async () => {
            
        })
    })


    describe('total_staked()', () => {
        it('', async () => {
            
        })
    })

    
})