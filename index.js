import { ethers } from "./ethers-6.7.esm.min.js";
import { contractAddress, abi } from "./constants.js";

const connectButton = document.getElementById("connectButton");
const fundButton = document.getElementById("fundButton");
const balanceButton = document.getElementById("balanceButton");
const withdrawButton = document.getElementById("withdrawButton");
connectButton.onclick = connect;
fundButton.onclick = fund;
balanceButton.onclick = getBalance;
withdrawButton.onclick = withdraw;

//console.log(ethers);

async function connect() {
  if (typeof window.ethereum !== "undefined") {
    //console.log("I see a metamask!");
    try {
      await ethereum.request({ method: "eth_requestAccounts" });
    } catch (error) {
      console.log(error);
    }
    //console.log("Connected!");
    connectButton.innerHTML = "Connected!";
  } else {
    connectButton.innerHTML = "Please install metamask first!";
  }
}

async function fund() {
  const ethAmount = document.getElementById("ethAmount").value;
  if (typeof window.ethereum !== "undefined") {
    console.log(`Funding with ${ethAmount} ETH...`);

    //the following line means: I found the HTTP endpoint inside metamask, that is what we are going to use as a provider
    const provider = new ethers.BrowserProvider(window.ethereum);

    //this will return the metamask account that we are using to connect to this app
    //if we are using account 1, it will return account 1
    const signer = await provider.getSigner(); //contract runner does not support sending transactions (operation="sendTransaction", code=UNSUPPORTED_OPERATION //this error was due to a missing 'await' on this line
    const contract = new ethers.Contract(contractAddress, abi, signer);
    try {
      const transactionResponse = await contract.fund({
        value: ethers.parseEther(ethAmount),
      });
      await listenForTxMined(transactionResponse, provider); //after we kick of the listener: listenForTxMined(...), it will run the next line of code
      console.log("Done!");
      console.log("Funded Successfully!");
    } catch (error) {
      console.log(error);
    }
  }
}

async function getBalance() {
  if (typeof window.ethereum != "undefined") {
    const provider = new ethers.BrowserProvider(window.ethereum);
    const balance = await provider.getBalance(contractAddress);
    console.log(ethers.formatEther(balance));
  }
}

async function withdraw() {
  if (typeof window.ethereum != "undefined") {
    console.log("Withdrawing...");
    const provider = new ethers.BrowserProvider(window.ethereum);
    const signer = await provider.getSigner();
    const contract = new ethers.Contract(contractAddress, abi, signer);
    try {
      const transactionResponse = await contract.withdraw();
      await listenForTxMined(transactionResponse, provider);
    } catch (error) {
      console.log(error);
    }
  }
}

//this function will finish before provider.once finishes
function listenForTxMined(transactionResponse, provider) {
  console.log(`Mining ${transactionResponse.hash}...`);

  //listen for this transaction to finish
  //we want to adjust our code for the listener to finish listening, which is why we wrap the whole thing into a promise
  return new Promise((resolve, reject) => {
    // we add provider.once onto the event queue, and our front end is periodically going to check back to see if its finished
    //once transactionResponse.hash is found, run the anonymous function in the following line
    provider.once(transactionResponse.hash, (transactionReceipt) => {
      console.log(
        `Completed with ${transactionReceipt.confirmations} confirmations. `
        /*provider.once(transactionResponse.hash, (transactionReceipt) => {
      console.log(
        `Completed with ${transactionReceipt.confirmations} confirmations!`*/
      );
      resolve(); //and only once this transaction gets fired, are we going to resolve this promise //we are telling it to only reolve and only finish when the function finishes
    });
  });
}
