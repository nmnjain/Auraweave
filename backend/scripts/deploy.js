
const hre = require("hardhat");
const fs = require('fs');
const path = require('path');

async function main() {
  const [deployer] = await hre.ethers.getSigners();
  console.log("Deploying contracts with the account:", deployer.address);
  console.log("Account balance:", (await hre.ethers.provider.getBalance(deployer.address)).toString());


  const mockErc20Name = "Mock USD Coin";
  const mockErc20Symbol = "MUSDC";
  const MockERC20Factory = await hre.ethers.getContractFactory("MockERC20");
  const mockERC20 = await MockERC20Factory.deploy(mockErc20Name, mockErc20Symbol, deployer.address);
  await mockERC20.waitForDeployment();
  const mockERC20Address = await mockERC20.getAddress();
  console.log(`MockERC20 (${mockErc20Symbol}) deployed to:`, mockERC20Address);
  const mockERC20Artifact = hre.artifacts.readArtifactSync("MockERC20");


  const DataRegistryFactory = await hre.ethers.getContractFactory("DataRegistry");
  const dataRegistry = await DataRegistryFactory.deploy(mockERC20Address);
  await dataRegistry.waitForDeployment();
  const dataRegistryAddress = await dataRegistry.getAddress();
  console.log("DataRegistry deployed to:", dataRegistryAddress, "using token:", mockERC20Address);
  const dataRegistryArtifact = hre.artifacts.readArtifactSync("DataRegistry");


  const deploymentInfo = {
    MockERC20: {
      name: mockErc20Name,
      symbol: mockErc20Symbol,
      address: mockERC20Address,
      abi: mockERC20Artifact.abi,
    },
    DataRegistry: {
      address: dataRegistryAddress,
      abi: dataRegistryArtifact.abi,
    },
    
    network: hre.network.name,
    deployedBy: deployer.address,
    timestamp: new Date().toISOString()
  };

  const deploymentsDir = path.join(__dirname, '..', 'deployments');
  if (!fs.existsSync(deploymentsDir)){
      fs.mkdirSync(deploymentsDir, { recursive: true });
  }
  const filePath = path.join(deploymentsDir, `${hre.network.name}.json`);
  fs.writeFileSync(filePath, JSON.stringify(deploymentInfo, null, 2));
  console.log(`Deployment info saved to ${filePath}`);

  if (hre.network.name === "localhost" || hre.network.name === "sepolia") {
      console.log(`\nMinting initial MockUSDC tokens to deployer (${deployer.address})...`);
      const producerAddress = new hre.ethers.Wallet(process.env.PRODUCER_PRIVATE_KEY).address;
      const consumerAddress = new hre.ethers.Wallet(process.env.CONSUMER_PRIVATE_KEY).address;
      

      const amountToMint = hre.ethers.parseUnits("10000", 18); 

      let tx = await mockERC20.connect(deployer).mint(deployer.address, amountToMint);
      await tx.wait();
      console.log(`Minted ${hre.ethers.formatUnits(amountToMint, 18)} MUSDC to Deployer: ${deployer.address}`);

      if (process.env.PRODUCER_PRIVATE_KEY) {
        tx = await mockERC20.connect(deployer).mint(producerAddress, amountToMint);
        await tx.wait();
        console.log(`Minted ${hre.ethers.formatUnits(amountToMint, 18)} MUSDC to Producer: ${producerAddress}`);
      }
      if (process.env.CONSUMER_PRIVATE_KEY) {
        tx = await mockERC20.connect(deployer).mint(consumerAddress, amountToMint);
        await tx.wait();
        console.log(`Minted ${hre.ethers.formatUnits(amountToMint, 18)} MUSDC to Consumer: ${consumerAddress}`);
      }
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});