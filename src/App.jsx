import React, {useEffect, useState} from 'react';
import './styles/App.css';
import twitterLogo from './assets/twitter-logo.svg';
import MoonLoader from 'react-spinners/MoonLoader'
import polygonLogo from './assets/polygonlogo.png';
import ethLogo from './assets/ethlogo.png';
import { networks } from './utils/networks';
import abi from "./abi.json"
import {ethers} from "ethers"
// Constants
const TWITTER_HANDLE = '_buildspace';
const TWITTER_LINK = `https://twitter.com/${TWITTER_HANDLE}`;

const tld = '.poly';
const CONTRACT_ADDRESS = '0x0a195489F38C4Ee5626bDEB1D5C86C33Cd533d5A';
const CONTRACT_ABI = abi.abi;

const App = () => {
  const [address, setAddress] = useState("")
  // Gotta make sure this is async.
  const [domain, setDomain] = useState('');
  const [spinner, setSpinner] = useState(false);
	const [loading, setLoading] = useState(false);
  const [flexOrNone, setFlexOrNone] = useState("none")
  const [animate, setAnimate] = useState(false);
  const [transaction, setTransaction] = useState("");
  const [network, setNetwork] = useState('');
  const [allDomains, setAllDomains] = useState([])


  const sleep = async (ms) => {
    return new Promise((resolve) => {
      const timeout = setTimeout(() => {
        resolve();
        clearTimeout(timeout)
      }, ms)
    })  
  }
  
  const checkIfWalletIsConnected = async () => {
    // First make sure we have access to window.ethereum
    setSpinner(true)
    const { ethereum } = window;
    if (!ethereum) {
      console.log("Make sure you have MetaMask!");
      await sleep(1000);
    setSpinner(false)
      return;
    } else {
      console.log("We have the ethereum object", ethereum);
      // Check if we're authorized to access the user's wallet
    const accounts = await ethereum.request({ method: 'eth_accounts' });

    // Users can have multiple authorized accounts, we grab the first one if its there!
    if (accounts.length !== 0) {
      const account = accounts[0];
      setAddress(account);
         // This is the new part, we check the user's network chain ID
    const chainId = await ethereum.request({ method: 'eth_chainId' });
      console.log(chainId)
    setNetwork(networks[chainId]);
    } else {
      console.log('No authorized account found');
    }
      await sleep(1000);
    setSpinner(false);
    }
  }
  const authenticate = async () => {
    try {
      const { ethereum } = window;

      if (!ethereum) {
        alert("Get MetaMask -> https://metamask.io/");
        return;
      }

      // Fancy method to request access to account.
      const accounts = await ethereum.request({ method: "eth_requestAccounts" });
    
      // Boom! This should print out public address once we authorize Metamask.
      console.log("Connected", accounts[0]);
      setAddress(accounts[0]);
       // This is the new part, we check the user's network chain ID
    const chainId = await ethereum.request({ method: 'eth_chainId' });
      console.log(chainId)
    setNetwork(networks[chainId]);
    } catch (error) {
      console.log(error)
    }
  }

  // Form to enter domain name and data
	const renderInputForm = () =>{
		return (
			<div className="form-container">
        <h2>Domains Shipped So Far: <span className="App--domainInfo">{allDomains.length}</span></h2>
				<div className="first-row">
					<input
						type="text"
						value={domain}
						placeholder='domain'
						onChange={e => setDomain(e.target.value)}
					/>
					<p className='tld'> {tld} </p>
				</div>
        <div className={`${flexOrNone === "flex" ? "second-row-flex":"second-row-none"} ${animate ? 'second-faded-in': 'second-faded-out'}`}>
          <p>Domain Length: <span className="App--domainInfo">{domain.length}</span></p>
          <p>Domain Cost: <span className="App--domainInfo">{domainPrice() > 0 ? domainPrice() + " MATIC": "Too Short"}</span></p>
        </div>

				<div className="button-container">
					<button className='cta-button mint-button' disabled={domain.length === 0} onClick={mintDomain}>
						Mint
					</button>  
				</div>

			</div>
		);
	}
   const renderNotConnectedContainer = () => (
    <div className="connect-wallet-container">
     <iframe src="https://giphy.com/embed/3oEduXdm2gjnrsJBOo" width="480" height="402" frameBorder="0" class="giphy-embed" allowFullScreen></iframe><p><a href="https://giphy.com/gifs/cartoon-painting-creative-3oEduXdm2gjnrsJBOo">via GIPHY</a></p>
      <button className="cta-button connect-wallet-button" onClick={authenticate}>
        Connect Wallet
      </button>
    </div>
    );

  const renderLoader = () => {
    return <div className="App__Loader">
      <h1 className="App__LoaderHeader">Loading...</h1>
    <MoonLoader color="#AB74FF" size={40} />
    </div>
  }

  const domainPrice = () => {
        if(domain.length === 3) {
          return 0.005
        } else if(domain.length >= 4) {
          return 0.003
        } else {
         return null
        }
  }

  const mintDomain = async () => {
	// Don't run if the domain is empty
	if (domain.length === 0) { return }
	// Alert the user if the domain is too short
	if (domain.length < 3) {
		alert('Domain must be at least 3 characters long');
		return;
	}
	const price = (domainPrice()).toString();
	console.log("Minting domain", domain, "with price", price);
  try {
    const { ethereum } = window;
    if (ethereum) {
      const provider = new ethers.providers.Web3Provider(ethereum);
      const signer = provider.getSigner();
      console.log('signer', signer)
      const contract = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, signer);

			console.log("Going to pop wallet now to pay gas...")
      let tx = await contract.register(domain, {value: ethers.utils.parseEther(price)});
      setSpinner(true)
      // Wait for the transaction to be mined
      setTransaction(tx.hash);
			const receipt = await tx.wait(2);

			// Check if the transaction was successfully completed
			if (receipt.status === 1) {
				alert("Domain minted! Lets gooooo");
        console.log(`View the successful mint transaction here: https://mumbai.polygonscan.com/tx/${tx.hash} `)
        setDomain("")
			}
			else {
				alert("Transaction failed! Please try again");
			}
      setTransaction("")
      setSpinner(false)
    }
  }
  catch(error){
    console.log(error);
    setSpinner(false)
  }
}

  const renderPolyScan = () => {
    return <div className="transaction">
      <div className="App__Loader">
      <h1 className="App__LoaderHeader">Confirming...</h1>
    <MoonLoader color="#AB74FF" size={40} />
    </div>
      <a className="button" href={`https://mumbai.polygonscan.com/tx/${transaction}`} target="_blank" rel="noreferrer">
      View Transaction
      </a>
    </div>
  }

  const switchNetwork = async () => {
    const provider = window.ethereum;
    const mumbai = "0x13881"
    if(!provider){
      console.log("Metamask is not installed, please install!");
    }
    try {
  await provider.request({
    method: 'wallet_switchEthereumChain',
    params: [{ chainId: mumbai}],
  });
alert("You have succefully switched to Mumbai")
} catch (switchError) {
  // This error code indicates that the chain has not been added to MetaMask.
  if (switchError.code === 4902) {
  alert("This network is not available in your metamask, please add it")
    try {
      await provider.request({
        method: 'wallet_addEthereumChain',
        params: [{chainId: mumbai, 
          chainName:'Mumbai',
         rpcUrls:['https://endpoints.omniatech.io/v1/matic/mumbai/public'],                   
         blockExplorerUrls:['https://mumbai.polygonscan.com'],  
      nativeCurrency: { 
          symbol:'MATIC',   
          decimals: 18}}  ]      
      })
    } catch (addError) {
       console.log(addError);
    }
    
  }
  console.log("Failed to switch to the network")
}
  }

  const renderNetworkSwitch = () => (
    <div className="flex-container col">
      <h1>Switch to Correct Network</h1>
      <button className="button" type="button" onClick={switchNetwork}>Switch Network</button>
    </div>
  )

  // Add this render function next to your other render functions
const renderMints = () => {
  if (address.length > 0 && allDomains.length > 0) {
    return (
      <div className="mint-container">
        <p className="subtitle"> Recently minted domains!</p>
        <div className="mint-list">
          { allDomains.map((mint, index) => {
            return (
              <div className="mint-item" key={index}>
                <div className='mint-row'>
                  <a className="link" href={`https://testnets.opensea.io/assets/mumbai/${CONTRACT_ADDRESS}/${index}`} target="_blank" rel="noopener noreferrer">
                    <p className="underlined">{' '}{mint}{tld}{' '}</p>
                  </a>
                  {/* If mint.owner is currentAccount, add an "edit" button*/}
                  {/* mint.owner.toLowerCase() === currentAccount.toLowerCase() ?
                    <button className="edit-button" onClick={() => editRecord(mint.name)}>
                      <img className="edit-icon" src="https://img.icons8.com/metro/26/000000/pencil.png" alt="Edit button" />
                    </button>
                    :
                    null
                  */}
                </div>
          <p> {mint.record} </p>
        </div>)
        })}
      </div>
    </div>);
  }
};
  
  
  // This runs our function when the page loads.
  useEffect(() => {
    checkIfWalletIsConnected();
    const {ethereum} = window;
    if(ethereum){     
    ethereum.on('chainChanged', (chainId) => {
      setNetwork(networks[chainId])
    })
    ethereum.on('accountsChanged', (accounts) => {
      if (accounts.length === 0) {
    // MetaMask is locked or the user has not connected any accounts
    alert('Successfully Disconnected');
        setAddress("")
        setNetwork("")
        setDomain("")
        setAllDomains([])
        
  } 
    });
    }
  }, [])

  useEffect(() => {
    const setAnimation = async () => {
     if(domain.length > 0 && !animate) {
       setFlexOrNone("flex")
       await sleep(200)
       setAnimate(true)
     } else if(domain.length === 0 && animate){
        setAnimate(false)
       await sleep(500)
       setFlexOrNone("none")
       
     }
    }
    setAnimation();
  }, [domain, animate])

  useEffect(() => {
    if(address.length > 0) {
      (async () => {
        const provider = new ethers.providers.Web3Provider(ethereum);
      const signer = provider.getSigner();
      console.log('signer', signer)
      const contract = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, signer);
        const domains = await contract.getAllNames();
        console.log("domain names ", domains)
        setAllDomains(domains)
      })()
    }
  }, [address, transaction, network])

  

  return (
    <div className="App">
      <div className="container">
        <div className="header-container">
  <header>
    <div className="left">
      <p className="title">🐱‍👤 Poly Name Service</p>
      <p className="subtitle">Your immortal API on the blockchain!</p>
    </div>
    {/* Display a logo and wallet connection status*/}
    <div className="right">
      <img alt="Network logo" className="logo" src={ network.includes("Polygon") ? polygonLogo : ethLogo} />
      { address ? <p> Wallet: {address.slice(0, 6)}...{address.slice(-4)} </p> : <p> Not connected </p> }
    </div>
  </header>
</div>

        {/* Add your render method here */}
        {address.length <= 0 && !spinner ? renderNotConnectedContainer():address.length > 0 && !spinner && network === "Polygon Mumbai Testnet" ? renderInputForm(): spinner && transaction.length === 0 ? renderLoader(): spinner && transaction.length > 0 && network === "Polygon Mumbai Testnet" ? renderPolyScan(): network !== "Polygon Mumbai Testnet" && address.length > 0 ? renderNetworkSwitch():null}
        {allDomains && network === "Polygon Mumbai Testnet"  && renderMints()}
        <div className="footer-container">
          <img alt="Twitter Logo" className="twitter-logo" src={twitterLogo} />
          <a className="footer-text" 
            href={TWITTER_LINK} 
            target="_blank"
            rel="noreferrer">
              {`built with @${TWITTER_HANDLE}`}
          </a>
        </div>
      </div>
    </div>
  );
}

export default App;
