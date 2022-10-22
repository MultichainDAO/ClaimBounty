#! /bin/bash

gnome-terminal -- npx hardhat node
npx hardhat run --network localhost scripts/deploy-test.js

