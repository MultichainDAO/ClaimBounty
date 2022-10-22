const { artifacts } = require("hardhat")

const USDC = artifacts.require("USDC")
const multiHonor = artifacts.require("MultiHonor_V1")
const idnft = artifacts.require("IDNFT_v1")
const bounty = artifacts.require("claimBounty")

var usdc, usdcAddress, claimBounty, claimBountyAddress, honorAddress, honor, IDNFT, IDNFTAddress

const deployment = async () => {

    var tokenId, tx

    const [ admin, user ] = await web3.eth.getAccounts();

    usdc = await USDC.new("USDC", "USDC", web3.utils.toWei("100000000", "ether"))
    usdcAddress = usdc.address
    console.log("USDC: ", usdcAddress)

    honor = await multiHonor.new()
    honorAddress = honor.address
    console.log("multiHonor: ", honorAddress)

    honor.initialize()


    IDNFT = await idnft.new(admin)
    IDNFTAddress = IDNFT.address
    console.log("IDNFT: ", IDNFTAddress)

    IDNFT.setHonor(honorAddress)

    tx = await IDNFT.claim()
    //console.log("tokenId : ", tokenId)


    claimBounty = await bounty.new()
    claimBountyAddress = claimBounty.address
    console.log("claimBounty: ", claimBountyAddress)

}

deployment()