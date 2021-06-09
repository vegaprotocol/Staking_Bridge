const Migrations = artifacts.require("Migrations");
const Vega_Staking_Bridge = artifacts.require("Vega_Staking_Bridge");

module.exports = function (deployer) {
  deployer.deploy(Migrations);
    deployer.deploy(Vega_Staking_Bridge);

};
