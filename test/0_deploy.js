const { loadFixture } = require("@nomicfoundation/hardhat-network-helpers")
const { expect } = require("chai")
const { BN, time } = require('@openzeppelin/test-helpers');
const { isCallTrace, isDecodedCallTrace } = require("hardhat/internal/hardhat-network/stack-traces/message-trace");
const { ethers } = require("hardhat")
const keccak256 = require('keccak256')

const initial = async () => {
    [admin, user, user2, pocAdmin] = await ethers.getSigners()
    const USDC = await ethers.getContractFactory("USDC")
    const usdc = await USDC.deploy("USDC", "USDC", ethers.utils.parseEther("1000000"))
    await usdc.deployed()

    // pocAdmin disburses USDC to SBT's with positive POC, so we need to give them some
    await usdc.approve(admin.address, ethers.utils.parseEther("1000000"))
    let tx = await usdc.transferFrom(admin.address, pocAdmin.address, ethers.utils.parseEther("100000"))
    await tx.wait()

    const MultiHonor = await ethers.getContractFactory("MultiHonor_V1")
    const multiHonor = await MultiHonor.deploy()
    await multiHonor.deployed()
    await multiHonor.initialize()
    await multiHonor.grantRole(keccak256("ROLE_ADD_POC"), pocAdmin.address)
    await multiHonor.grantRole(keccak256("ROLE_SET_POC"), pocAdmin.address)
    await multiHonor.grantRole(keccak256("ROLE_ADD_EVENT"), pocAdmin.address)
    await multiHonor.grantRole(keccak256("ROLE_SET_EVENT"), pocAdmin.address)

    const IdNFT = await ethers.getContractFactory("IDNFT_v1")
    const idNFT = await IdNFT.deploy(admin.address)
    await idNFT.deployed()

    await idNFT.setHonor(multiHonor.address)

    const ClaimBounty = await ethers.getContractFactory("claimBounty")
    const claimBounty = await ClaimBounty.deploy()
    await claimBounty.deployed()
    await claimBounty.initialize()
    await claimBounty.setIdNFT(idNFT.address)
    await claimBounty.grantRole(keccak256("ROLE_BOUNTY"), pocAdmin.address)
    await claimBounty.setPocFactor(10000)
    await claimBounty.setBountyTokenAddress(usdc.address)

    return { admin, user, user2, pocAdmin, usdc, multiHonor, idNFT, claimBounty }
}

describe("Add Bounty to contract", function () {

    it("Check POC admin has 100000 USDC", async function () {
        const { admin, user, pocAdmin, usdc, multiHonor, idNFT, claimBounty } = await loadFixture(initial)

        let adminPocBalUSDC = await usdc.balanceOf(pocAdmin.address)

        expect(Number(adminPocBalUSDC)).to.equal(Number(ethers.utils.parseEther("100000")))
    })

    it("User can claim an SBT and has one(1)", async function () {
        const { admin, user, pocAdmin, usdc, multiHonor, idNFT } = await loadFixture(initial)
        const tx = await idNFT.connect(user).claim({ from: user.address })
        await tx.wait()

        let nSbt = await idNFT.balanceOf(user.address)
        expect(Number(nSbt)).to.equal(1)
    })

    it("Admin can add POC to user", async function () {
        const { admin, user, pocAdmin, usdc, multiHonor, idNFT } = await loadFixture(initial)
        const tx = await idNFT.connect(user).claim({ from: user.address })
        await tx.wait()

        await multiHonor.connect(pocAdmin).addPOC([0], [1000], { gasLimit: 100000 })
        const blockNumber = await ethers.provider.getBlockNumber()
        //const timestamp = (await ethers.provider.getBlock(blockNumber)).timestamp
        //console.log(`timestamp = ${timestamp}`)
        //let poc = await multiHonor.POC(0, timestamp)
        let poc = await multiHonor.POC(0)
        expect(Number(poc)).to.equal(1000)
    })

    it("Check POC admin can add bounty for users", async function () {
        const { admin, user, pocAdmin, usdc, multiHonor, idNFT, claimBounty } = await loadFixture(initial)
        let tx = await idNFT.connect(user).claim({ from: user.address })
        await tx.wait()

        // first tokenId = 0
        const token = 0

        await multiHonor.connect(pocAdmin).addPOC([token], [1000], { gasLimit: 100000 })

        let balBefore = await usdc.balanceOf(pocAdmin.address)
        //console.log(`bal = ${ethers.utils.formatUnits(balBefore, "ether")}`)

        tx = usdc.connect(pocAdmin).approve(claimBounty.address, ethers.utils.parseEther("1000"))

        tx = await claimBounty.connect(pocAdmin).addPOCBounty([0], [ethers.utils.parseEther("1000")], { gasLimit: 100000 })
        await tx.wait()


        let balAfter = await usdc.balanceOf(pocAdmin.address)
        expect(Number(ethers.utils.formatUnits(balAfter), "ether")).to.equal(99000)

        let bounty = await claimBounty.getBounty(token)
        expect(Number(ethers.utils.formatUnits(bounty, "ether"))).to.equal(1000)

    })


    it("Check a non POC admin cannot add bounty for users", async function () {
        const { admin, user, pocAdmin, usdc, multiHonor, idNFT, claimBounty } = await loadFixture(initial)
        let tx = await idNFT.connect(user).claim({ from: user.address })
        await tx.wait()

        // first tokenId = 0
        const token = 0

        tx = usdc.connect(pocAdmin).approve(claimBounty.address, ethers.utils.parseEther("1000"))

        await expect(claimBounty.connect(user).addPOCBounty([token], [ethers.utils.parseEther("1000")], { gasLimit: 100000 })).to.be.revertedWith("AccessControl: account 0x70997970c51812dc3a010c7d01b50e0d17dc79c8 is missing role 0xb1f0c0c2bc3e09031e0745b39ed21c8f348a26ef48836cc9351cecec3ba104bb")
    })

    it("A user can claim their bounty", async function () {
        const { admin, user, pocAdmin, usdc, multiHonor, idNFT, claimBounty } = await loadFixture(initial)
        let tx = await idNFT.connect(user).claim({ from: user.address })
        await tx.wait()

        // first tokenId = 0
        const token = 0

        await multiHonor.connect(pocAdmin).addPOC([token], [1000], { gasLimit: 100000 })

        let balBefore = await usdc.balanceOf(user.address)

        tx = usdc.connect(pocAdmin).approve(claimBounty.address, ethers.utils.parseEther("1000"))

        tx = await claimBounty.connect(pocAdmin).addPOCBounty([0], [ethers.utils.parseEther("1000")], { gasLimit: 100000 })
        await tx.wait()

        tx = await claimBounty.connect(user).claimPocBounty(token)
        await tx.wait()

        let balAfter = await usdc.balanceOf(user.address)

        expect(Number(ethers.utils.formatUnits(balAfter, "ether"))).to.equal(1000)
        let bounty = await claimBounty.getBounty(token)
        expect(Number(ethers.utils.formatUnits(bounty, "ether"))).to.equal(0)

    })

    it("A user cannot claim the bounty of another user", async function () {
        const { admin, user, user2, pocAdmin, usdc, multiHonor, idNFT, claimBounty } = await loadFixture(initial)
        let tx = await idNFT.connect(user).claim({ from: user.address })
        await tx.wait()
        tx = await idNFT.connect(user2).claim({ from: user2.address })
        await tx.wait()

        // first tokenId = 0
        const tokenUser = 0
        const tokenUser2 = 1

        tx = usdc.connect(pocAdmin).approve(claimBounty.address, ethers.utils.parseEther("2000"))

        tx = await claimBounty.connect(pocAdmin).addPOCBounty([tokenUser, tokenUser2], [ethers.utils.parseEther("1000"), ethers.utils.parseEther("1000")], { gasLimit: 200000 })
        await tx.wait()

        await expect(claimBounty.connect(user).claimPocBounty(tokenUser2)).to.be.revertedWith("claimBounty: Cannot claim POC for an SBT that is not yours")
    })


})


