const hre = require("hardhat");

const usdc = {
    "polygon": "0x2791bca1f2de4661ed88a30c99a7a9449aa84174",
    "bsc": "0x8ac76a51cc950d9822d68b83fe1ad97b32cd580d"
}

const idnft = {
    "polygon": "0x7a02492bAa66B0b8266a6d25Bbd6D8BA169296CC",
    "bsc": "0x3E05584358f0Fbfc1909aDE5aCfFBAB7842BdfDc"
}

const multihonor = {
    "polygon": "0xDd98B79b36c77Ee1F23f37B61e58A61cc3D5aceF",
    "bsc": "0x0550082C40C6A04096B62116f227D110A699967B"
}

const pocFactor = {
    "polygon": 10000,
    "bsc": 10000
}

async function main() {
    const [owner] = await ethers.getSigners();
    console.log("owner " + owner.address);

    console.log("\ndeploy MonthlyBounty");
    let MonthlyBounty = await ethers.getContractFactory("MonthlyBounty");
    let monthlyBounty = await MonthlyBounty.deploy(usdc[hre.network.name], idnft[hre.network.name], multihonor[hre.network.name], pocFactor[hre.network.name]);
    await monthlyBounty.deployed();
    console.log(`monthlyBounty : ${monthlyBounty.address}`);
}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});
