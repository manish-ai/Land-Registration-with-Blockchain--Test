import Web3 from "web3";

// Cache the web3 instance so MetaMask is only prompted once per session.
let cachedWeb3 = null;

const getWeb3 = () =>
  new Promise((resolve, reject) => {
    if (cachedWeb3) {
      resolve(cachedWeb3);
      return;
    }

    const init = async () => {
      try {
        let web3;
        // Modern dapp browsers (MetaMask etc.)
        // Only use MetaMask if it has already approved an account for this site.
        // Otherwise fall through to direct Ganache HTTP provider.
        if (window.ethereum && window.ethereum.selectedAddress) {
          web3 = new Web3(window.ethereum);
          // Use the modern API if available, fall back to legacy enable()
          if (window.ethereum.request) {
            await window.ethereum.request({ method: "eth_requestAccounts" });
          } else {
            await window.ethereum.enable();
          }
        }
        // Fallback to localhost Ganache (also used when MetaMask is not connected to this site)
        else {
          const provider = new Web3.providers.HttpProvider("http://127.0.0.1:7545");
          web3 = new Web3(provider);
          console.log("No connected wallet - using local Ganache provider.");
        }
        cachedWeb3 = web3;
        resolve(web3);
      } catch (error) {
        reject(error);
      }
    };

    // If the page is already loaded, init immediately; otherwise wait for load event.
    if (document.readyState === "complete" || document.readyState === "interactive") {
      init();
    } else {
      window.addEventListener("load", init);
    }
  });

export default getWeb3;
