
const hre = require("hardhat");
const fs = require('fs');
const path = require('path');

async function main() {
  const [deployer] = await hre.ethers.getSigners(); 
  console.log("Deploying contracts with the account:", deployer.address);
  console.log("Account balance:", (await hre.ethers.provider.getBalance(deployer.address)).toString());

  const ContractFactory = await hre.ethers.getContractFactory("DataRegistry");
  const contractInstance = await ContractFactory.deploy(); // Add constructor arguments here if your contract has them

  await contractInstance.waitForDeployment();


  const contractAddress = await contractInstance.getAddress();

  console.log("DataRegistry deployed to:", contractAddress);

  const contractArtifact = hre.artifacts.readArtifactSync("DataRegistry");

  const deploymentInfo = {
    DataRegistry: { 
      address: contractAddress,
      abi: contractArtifact.abi,
      network: hre.network.name,
      deployedBy: deployer.address,
      timestamp: new Date().toISOString()
    }
  };

  const deploymentsDir = path.join(__dirname, '..', 'deployments');
  if (!fs.existsSync(deploymentsDir)){
      fs.mkdirSync(deploymentsDir, { recursive: true });
  }
  const filePath = path.join(deploymentsDir, `${hre.network.name}.json`);
  fs.writeFileSync(filePath, JSON.stringify(deploymentInfo, null, 2));
  console.log(`Deployment info saved to ${filePath}`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});