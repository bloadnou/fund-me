// deploy/00_deploy_mock-chainlink.js
const DECIMAL = "8";
const INITIAL_PRICE = "200000000000"; // 2000

module.exports = async ({ getNamedAccounts, deployments }) => {
  const { deploy, log } = deployments;
  const { deployer } = await getNamedAccounts();
  const chainId = network.config.chainId;

  if (chainId == 31337) {
    log("Local network detected! Deploying mocks...");
    log(
      "Deploying MockV3Aggregator smart contract and waiting for confirmations..."
    );
    const Mock = await deploy("MockV3Aggregator", {
      from: deployer,
      args: [DECIMAL, INITIAL_PRICE],
      log: true,
    });
    log(`Deploying MockV3Aggregator contract address ${Mock.address}`);
    log("Mocks Deployed!");
    log("------------------------------------------------");
    log(
      "You are deploying to a local network, you'll need a local network running to interact"
    );
    log(
      "Please run `yarn hardhat console` to interact with the deployed smart contracts!"
    );
    log("------------------------------------------------");
  }
};
module.exports.tags = ["All", "Mock"];
