const { deployments, ethers } = require("hardhat");

async function main() {
  const fundMeDeployment = await deployments.get("FundMe");
  const fundMe = await ethers.getContractAt(
    "FundMe",
    fundMeDeployment?.address || ""
  );

  const transactionResponse = await fundMe.fund({
    value: ethers.parseEther("0.03"),
  });
  await transactionResponse.wait();
  console.log("Funded!");
}

// main
main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
