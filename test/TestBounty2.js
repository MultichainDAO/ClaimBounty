const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("Test DAO contracts V1", function () {
  it("Test Bounty", async function () {
    const [owner] = await ethers.getSigners();
    console.log("owner " + owner.address);

    console.log("\ndeploy bounty monthlyBounty");
    let TestToken = await ethers.getContractFactory("USDC");
    let bountyToken = await TestToken.deploy("USD Coin", "USDC", "1000000000000000000000000000000");

    console.log("\ndeploy proxy admin");
    let ProxyAdmin = await ethers.getContractFactory("ProxyAdmin");
    let proxyAdmin = await ProxyAdmin.deploy();

    console.log("\ndeploy idnft");
    let IDNFT_v1 = await ethers.getContractFactory("IDNFT_v1");
    let idnft_logic = await IDNFT_v1.deploy(owner.address);
    await idnft_logic.deployed();
    console.log(`idnft_logic ${idnft_logic.address}`);

    let i_init = new ethers.utils.Interface(["function initialize()"]);
    let initdata = i_init.encodeFunctionData("initialize");

    console.log("\ndeploy proxy");
    let TransparentUpgradeableProxy = await ethers.getContractFactory("TransparentUpgradeableProxy");
    let idnft_proxy = await TransparentUpgradeableProxy.deploy(idnft_logic.address, proxyAdmin.address, initdata);

    let idnft = await ethers.getContractAt("IDNFT_v1", idnft_proxy.address);

    console.log("\ndeploy multi honor");
    let MultiHonor = await ethers.getContractFactory("MultiHonor_V1");
    let multiHonor_logic = await MultiHonor.deploy();
    let multiHonor_proxy = await TransparentUpgradeableProxy.deploy(multiHonor_logic.address, proxyAdmin.address, initdata);
    await multiHonor_proxy.deployed();

    let multiHonor = await ethers.getContractAt("MultiHonor_V1", multiHonor_proxy.address);
    console.log(`k : ${await multiHonor.k()}\n`);

    let role_add_poc = await multiHonor.ROLE_ADD_POC();
    await multiHonor.grantRole(role_add_poc, owner.address);
    expect(await multiHonor.hasRole(role_add_poc, owner.address)).to.equal(true);

    console.log("\ndeploy monthlyBounty");
    let MonthlyBounty = await ethers.getContractFactory("MonthlyBounty");
    let monthlyBounty = await MonthlyBounty.deploy(bountyToken.address, idnft.address, multiHonor.address, 10000, 0);

    expect(await monthlyBounty.bountyToken()).to.equal(bountyToken.address);
    expect(await monthlyBounty.idnft()).to.equal(idnft.address);
    expect(await monthlyBounty.multiHonor()).to.equal(multiHonor.address);

    await idnft.claim();
    expect(await idnft.ownerOf(0)).to.equal(owner.address);

    console.log("\nallocate POC");
    await multiHonor.addPOC([0], [100]);
    let totalPoint1 = await multiHonor.TotalPoint(0);
    console.log("total point " + totalPoint1);
    expect(totalPoint1).to.equal(60);

    console.log("\ndeposit in monthlyBounty");
    await bountyToken.transfer(monthlyBounty.address, 10000000000);
    expect(await bountyToken.balanceOf(monthlyBounty.address)).to.equal(10000000000);

    console.log("\nburn the rest balance");
    await bountyToken.transfer("0x000000000000000000000000000000000000dead", await bountyToken.balanceOf(owner.address));
    expect(await bountyToken.balanceOf(owner.address)).to.equal(0);

    console.log("\nclaim bounty");
    await monthlyBounty.claimBounty(0, owner.address);

    let bal1 = await bountyToken.balanceOf(owner.address);
    console.log("bounty bal1 " + bal1);
    expect(bal1).to.equal(100000000);

    console.log("\nwithdraw bounty token");
    await monthlyBounty.withdraw(await bountyToken.balanceOf(monthlyBounty.address), owner.address);
    let bal_dist = await bountyToken.balanceOf(monthlyBounty.address);
    console.log("bal_dist " + bal_dist);
    expect(bal_dist).to.equal(0);
    let bal3 = await bountyToken.balanceOf(owner.address)
    console.log("bal3 " + bal3);
    expect(bal3).to.equal(10000000000);
  });
});