const { assert, expect } = require("chai");
const { deployments, ethers, getNamedAccounts, network } = require("hardhat");
const { developmentChains } = require("../../helper-hardhat-config");

console.log(network.name);

const result = developmentChains.includes(network.name)
  ? describe.skip
  : describe("FundMe", function () {
      let deployer;
      let fundMe;
      const sendValue = ethers.parseEther("0.1");
      beforeEach(async () => {
        deployer = (await getNamedAccounts()).deployer;
        const fundMeDeployment = await deployments.get("FundMe");

        fundMe = await ethers.getContractAt(
          "FundMe",
          fundMeDeployment?.address || ""
        );
      });

      it("allows people to fund and withdraw", async function () {
        const provider = fundMe.runner?.provider;
        const fundMeAddress = await fundMe.getAddress();

        const fundTransactionResponse = await fundMe.fund({ value: sendValue });
        await fundTransactionResponse.wait(1);

        const withdrawTransactionResponse = await fundMe.withdraw();
        await withdrawTransactionResponse.wait(1);

        const endingFundMeBalance =
          (await provider?.getBalance(fundMeAddress)) || BigInt(0);
        assert.equal(endingFundMeBalance.toString(), "0");
      });
    });
