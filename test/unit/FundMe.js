const { assert, expect } = require("chai");
const { deployments, ethers, getNamedAccounts, network } = require("hardhat");
const { developmentChains } = require("../../helper-hardhat-config");

console.log(network.name);

const result = !developmentChains.includes(network.name)
  ? describe.skip
  : describe("FundMe", function () {
      let deployer;
      let fundMe;
      let mockV3Aggregator;
      const sendValue = ethers.parseEther("1");
      // before must deploy contracts
      beforeEach(async () => {
        deployer = (await getNamedAccounts()).deployer;
        await deployments.fixture(["All"]);
        const fundMeDeploy = await deployments.get("FundMe");
        fundMe = await ethers.getContractAt(
          fundMeDeploy.abi,
          fundMeDeploy.address
        );
        const mockDeploy = await deployments.get("MockV3Aggregator");
        mockV3Aggregator = await ethers.getContractAt(
          mockDeploy.abi,
          mockDeploy.address
        );
      });

      describe("constructor", function () {
        it("set the aggregator addresses correctly", async () => {
          const response = await fundMe.getPriceFeed();
          assert.equal(response, mockV3Aggregator.target);
        });
      });
      describe("fund", async function () {
        // check minimum value
        it("Fails if you don't send enough ETH", async () => {
          await expect(fundMe.fund()).to.be.revertedWith(
            "You need to spend more ETH!"
          );
        });
        // check addressToAmountFunded
        it("Updates the amount funded data structure", async () => {
          await fundMe.fund({ value: sendValue });
          const response = await fundMe.getAddressToAmountFunded(deployer);
          assert.equal(response.toString(), sendValue.toString());
        });
        // check funders
        it("Updates funders", async () => {
          await fundMe.fund({ value: sendValue });
          const response = await fundMe.getFunder(0);
          assert.equal(response.toString(), deployer);
        });
      });
      describe("withdraw", function () {
        beforeEach(async () => {
          await fundMe.fund({ value: sendValue });
        });
        it("withdraws ETH from a single funder", async () => {
          const fundMeAddress = await fundMe.getAddress();
          const provider = fundMe.runner?.provider;
          // before deployer balances
          const FundMeBalance = await provider.getBalance(fundMeAddress);
          const startingDeployerBalance = await provider.getBalance(deployer);

          // withdraw
          const transactionResponse = await fundMe.withdraw();
          const transactionReceipt = (await transactionResponse.wait()) || {
            gasUsed: BigInt(0),
            gasPrice: BigInt(0),
          };
          const { gasUsed, gasPrice } = transactionReceipt;
          const gasCost = gasUsed * gasPrice;

          // after
          const endingDeployerBalance = await provider.getBalance(deployer);

          assert.equal(
            (FundMeBalance + startingDeployerBalance).toString(),
            (endingDeployerBalance + gasCost).toString()
          );
        });
        it("withdraws ETH from a multi funder", async () => {
          // funders from test account get 5 account to fund, start from 1, 0 is deployer
          const accounts = await ethers.getSigners();
          for (i = 1; i < 6; i++) {
            const fundMeConnectedContract = await fundMe.connect(accounts[i]);
            await fundMeConnectedContract.fund({ value: sendValue });
          }

          const fundMeAddress = await fundMe.getAddress();
          const provider = fundMe.runner?.provider;
          // before deployer balances
          const FundMeBalance = await provider.getBalance(fundMeAddress);
          const startingDeployerBalance = await provider.getBalance(deployer);

          // withdraw
          const transactionResponse = await fundMe.withdraw();
          const transactionReceipt = (await transactionResponse.wait()) || {
            gasUsed: BigInt(0),
            gasPrice: BigInt(0),
          };
          const { gasUsed, gasPrice } = transactionReceipt;
          const gasCost = gasUsed * gasPrice;

          // after
          const endingDeployerBalance = await provider.getBalance(deployer);

          assert.equal(
            (FundMeBalance + startingDeployerBalance).toString(),
            (endingDeployerBalance + gasCost).toString()
          );

          // Make a getter for storage variables
          await expect(fundMe.getFunder(0)).to.be.reverted;

          for (i = 1; i < 6; i++) {
            assert.equal(
              await fundMe.getAddressToAmountFunded(accounts[i].address),
              0
            );
          }
        });
        it("modifier onlyOwner", async () => {
          const accounts = await ethers.getSigners();
          const fundMeConnectedContract = await fundMe.connect(accounts[1]);
          await expect(
            fundMeConnectedContract.withdraw()
          ).to.be.revertedWithCustomError(fundMeConnectedContract, "NotOwner");
        });
      });
    });
