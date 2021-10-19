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

    })

    describe('remove_stake()', () => {
        it('cannot remove without staking first', async () => {
            await shouldFailWithMessage(
                stakeBridge.remove_stake(parseEther('100'), stringToBytes32('accounts[1]'), {from: accounts[1]}),
                "revert"
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

        it('removing more than total staked should revert', async () => {
            await token.mint_and_issue(accounts[2], parseEther('100'))
            await token.approve(stakeBridge.address, parseEther('100'), {from: accounts[2]})
            await stakeBridge.stake(parseEther('100'), stringToBytes32('accounts[2]'), {from: accounts[2]})
            await shouldFailWithMessage(
                stakeBridge.remove_stake(parseEther('101'), stringToBytes32('accounts[2]'), {from: accounts[2]}),
                "revert"
            )
        })
    })

    describe('transfer_stake()', () => {
        it('should not transfer if amount exceeds total staked', async () => {
            await token.mint_and_issue(accounts[2], parseEther('100'))
            await token.approve(stakeBridge.address, parseEther('100'), {from: accounts[2]})
            await stakeBridge.stake(parseEther('100'), stringToBytes32('accounts[1]'), {from: accounts[2]})
            await shouldFailWithMessage(
                stakeBridge.transfer_stake(parseEther('101'), accounts[1], stringToBytes32('accounts[2]'), {from: accounts[2]}),
                "revert"
            )
        })

        it('using different vega key used to stake will result in invalid staked amount', async () => {
            await token.mint_and_issue(accounts[2], parseEther('100'))
            await token.approve(stakeBridge.address, parseEther('100'), {from: accounts[2]})
            await stakeBridge.stake(parseEther('100'), stringToBytes32('accounts[1]'), {from: accounts[2]})
            // transfer with different vega public key
            await shouldFailWithMessage(
                stakeBridge.transfer_stake(parseEther('10'), ZERO_ADDRESS, stringToBytes32('accounts[2]'), {from: accounts[2]}),
                "revert"
            )
        })

    })

    describe('staking_token()', () => {
        it('should return valid address', async () => {
            expect(await stakeBridge.staking_token()).to.be.equal(token.address)
            expect(await stakeBridge.staking_token()).to.not.be.equal(ZERO_ADDRESS)
        })

    })

    describe('stake_balance()', () => {
        it('should return correct stake balance with valid account and vega public key pair', async () => {
            await token.mint_and_issue(accounts[2], parseEther('100'))
            await token.approve(stakeBridge.address, parseEther('100'), {from: accounts[2]})
            await stakeBridge.stake(parseEther('100'), stringToBytes32('accounts[2]'), {from: accounts[2]})
            expectBignumberEqual(
                await stakeBridge.stake_balance(accounts[2], stringToBytes32('accounts[2]')),
                parseEther('100')
            )
        })

        it('should return zero balance with incorrect account and vega public key pair', async () => {
            await token.mint_and_issue(accounts[2], parseEther('100'))
            await token.approve(stakeBridge.address, parseEther('100'), {from: accounts[2]})
            await stakeBridge.stake(parseEther('100'), stringToBytes32('accounts[2]'), {from: accounts[2]})
            expectBignumberEqual(
                await stakeBridge.stake_balance(accounts[2], stringToBytes32('accounts[1]')),
                0
            )
        })
    })


    describe('total_staked()', () => {
        it('return correct total staked after one user stakes', async () => {
            await token.mint_and_issue(accounts[1], parseEther('100'))
            await token.approve(stakeBridge.address, parseEther('100'), {from: accounts[1]})
            await stakeBridge.stake(parseEther('100'), stringToBytes32('accounts[1]'), {from: accounts[1]})
            
            expectBignumberEqual(
                await stakeBridge.total_staked(),
                parseEther('100')
            )
        })

        it('return correct total staked after multiple users stake', async () => {
            await token.mint_and_issue(accounts[1], parseEther('100'))
            await token.approve(stakeBridge.address, parseEther('100'), {from: accounts[1]})
            await stakeBridge.stake(parseEther('100'), stringToBytes32('accounts[1]'), {from: accounts[1]})
            
            await token.mint_and_issue(accounts[2], parseEther('100'))
            await token.approve(stakeBridge.address, parseEther('100'), {from: accounts[2]})
            await stakeBridge.stake(parseEther('100'), stringToBytes32('accounts[2]'), {from: accounts[2]})
            
            expectBignumberEqual(
                await stakeBridge.total_staked(),
                parseEther('200')
            )
        })

        it('return correct total staked after multiple users stake and withdraw', async () => {
            await token.mint_and_issue(accounts[1], parseEther('100'))
            await token.approve(stakeBridge.address, parseEther('100'), {from: accounts[1]})
            await stakeBridge.stake(parseEther('100'), stringToBytes32('accounts[1]'), {from: accounts[1]})
            
            await token.mint_and_issue(accounts[2], parseEther('100'))
            await token.approve(stakeBridge.address, parseEther('100'), {from: accounts[2]})
            await stakeBridge.stake(parseEther('100'), stringToBytes32('accounts[2]'), {from: accounts[2]})
            expectBignumberEqual(
                await stakeBridge.total_staked(),
                parseEther('200')
            )

            await stakeBridge.remove_stake(parseEther('10'), stringToBytes32('accounts[1]'), {from: accounts[1]})
            expectBignumberEqual(
                await stakeBridge.total_staked(),
                parseEther('190')
            )

            await stakeBridge.remove_stake(parseEther('30'), stringToBytes32('accounts[2]'), {from: accounts[2]})
            expectBignumberEqual(
                await stakeBridge.total_staked(),
                parseEther('160')
            )

            await shouldFailWithMessage(
                stakeBridge.stake(parseEther('10'), stringToBytes32('accounts[1]'), {from: accounts[1]}),
                "ERC20: transfer amount exceeds allowance"
            ) 

            await token.approve(stakeBridge.address, parseEther('10'), {from: accounts[1]})
            await stakeBridge.stake(parseEther('10'), stringToBytes32('accounts[1]'), {from: accounts[1]})
            expectBignumberEqual(
                await stakeBridge.total_staked(),
                parseEther('170')
            )
        })
    })

    
})