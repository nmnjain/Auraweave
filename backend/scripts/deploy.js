
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

  if (hre.network.name === "sepolia" || hre.network.name === "localhost") { // Only seed on testnets/local
    console.log("\nListing pre-pinned sample data on DataRegistry...");

    // Get the DataRegistry contract instance connected to the deployer
    const dataRegistryAsDeployer = dataRegistry.connect(deployer);

    // Sample Data 1 (JSON) - REPLACE WITH YOUR ACTUAL CIDs FROM PINATA
    const sample1_name = "Office Alpha - Temp/Humidity (Sample)";
    const sample1_desc = "A pre-pinned sample dataset (JSON) for demo.";
    const sample1_dataCID = "bafkreifysyerz2fucm62r5u3746kfukuklaj54urpcx5uy3xkbsxzrnzdq"; // YOUR CID
    const sample1_metadataCID = "bafkreideac5llvbagooiaptjc4qo7evhjg73lazj4glsklghdtlqblvrtm"; // YOUR CID
    const sample1_price = hre.ethers.parseUnits("0.25", 18); // Price: 0.25 MockUSDC (18 decimals)

    try {
        let tx = await dataRegistryAsDeployer.listData(
            sample1_name,
            sample1_desc,
            sample1_dataCID,
            sample1_metadataCID,
            sample1_price
        );
        await tx.wait();
        console.log(`SUCCESS: Listed "${sample1_name}" (Data CID: ${sample1_dataCID})`);
    } catch (e) {
        console.error(`ERROR listing "${sample1_name}":`, e.message);
    }


    // Sample Data 2 (CSV) - REPLACE WITH YOUR ACTUAL CIDs FROM PINATA
    const sample3_name = "Living Room Thermostat Schedule (Sample)";
    const sample3_desc = "Weekly temperature schedule for a smart thermostat (JSON).";
    const sample3_dataCID = "bafkreig3qj6hpnvns64jyitzq67csl4mfthqoas27dw5oik5xokn7xmwfm";
    const sample3_metadataCID = "bafkreiglhydsdctni6bo2h7vmz77pks3xyadd7ei4bsnp56cd3327z7squ";
    const sample3_price = hre.ethers.parseUnits("1.0", 18); // Price: 1.0 MockUSDC

    try {
        let tx = await dataRegistryAsDeployer.listData(
            sample3_name, sample3_desc, sample3_dataCID, sample3_metadataCID, sample3_price
        );
        await tx.wait();
        console.log(`SUCCESS: Listed "${sample3_name}" (Data CID: ${sample3_dataCID})`);
    } catch (e) {
        console.error(`ERROR listing "${sample3_name}":`, e.message);
    }

    // Sample Data 4 (AI Model Metrics) - REPLACE WITH YOUR ACTUAL CIDs
    const sample4_name = "Image Classifier v2.1 Performance (Sample)";
    const sample4_desc = "Performance metrics for an image classification AI model (JSON).";
    const sample4_dataCID = "bafkreifew7rodbqfw7norq3oyl2jxh2sejzh3ol4k6jaf6cfye5a74prpy";
    const sample4_metadataCID = "bafkreifjapmmjwpn6jhbkqhfkgcwzlyjrmvt2juzkkbfie4zmtktatd5mu";
    const sample4_price = hre.ethers.parseUnits("2.5", 18); // Price: 2.5 MockUSDC

    try {
        let tx = await dataRegistryAsDeployer.listData(
            sample4_name, sample4_desc, sample4_dataCID, sample4_metadataCID, sample4_price
        );
        await tx.wait();
        console.log(`SUCCESS: Listed "${sample4_name}" (Data CID: ${sample4_dataCID})`);
    } catch (e) {
        console.error(`ERROR listing "${sample4_name}":`, e.message);
    }

    console.log("Finished listing sample data.");
  }
}


main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});