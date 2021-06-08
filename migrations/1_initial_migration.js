const Migrations = artifacts.require("Migrations");
const Vega_Staking_Bridge = artifacts.require("Vega_Staking_Bridge");
const Vega_2_TEST_STANDIN_DO_NOT_DEPLOY = artifacts.require("Vega_2_TEST_STANDIN_DO_NOT_DEPLOY");
const IStake = artifacts.require("IStake");

const fs = require('fs');

module.exports = async function (deployer) {
    await deployer.deploy(Migrations);
    await deployer.deploy(Vega_2_TEST_STANDIN_DO_NOT_DEPLOY, "64000000000000000000000000", "VEGA", "VEGA");
    await deployer.deploy(Vega_Staking_Bridge, Vega_2_TEST_STANDIN_DO_NOT_DEPLOY.address);


    fs.writeFileSync('ABIS/IStake_ABI.json',  JSON.stringify( IStake.abi));
    fs.writeFileSync('ABIS/Vega_Staking_Bridge_ABI.json',  JSON.stringify( Vega_Staking_Bridge.abi));
};
