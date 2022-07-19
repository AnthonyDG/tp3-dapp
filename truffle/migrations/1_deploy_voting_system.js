const VotingSystem = artifacts.require("Voting");

module.exports = function (deployer) {
  deployer.deploy(VotingSystem);
};
