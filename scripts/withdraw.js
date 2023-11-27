const { deployments, ethers } = require("hardhat");

async function main() {
  const fundMeDeployment = await deployments.get("FundMe");
  const fundMe = await ethers.getContractAt(
    "FundMe",
    fundMeDeployment?.address || ""
  );

  const transactionResponse = await fundMe.withdraw();
  await transactionResponse.wait();
  console.log("Withdrawn!");
}

// main
main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
