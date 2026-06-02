import Web3 from "web3";

// Connect directly to the local Ganache node.
// Ganache auto-signs transactions for all its unlocked accounts,
// so no MetaMask or private key management is needed.
let cachedWeb3 = null;

const getWeb3 = () => {
  if (cachedWeb3) {
    return Promise.resolve(cachedWeb3);
  }
  const provider = new Web3.providers.HttpProvider("http://127.0.0.1:7545");
  cachedWeb3 = new Web3(provider);
  return Promise.resolve(cachedWeb3);
};

export default getWeb3;
