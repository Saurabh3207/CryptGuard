import {useWeb3Context} from  "../contexts/useWeb3Context"
import { connectWallet } from "../utils/connectWallet";

const Wallet = () => {
    const web3State = useWeb3Context();

    return ( 
        <div>
            <h1>Wallet</h1>
            <button onClick = {connectWallet}>Connect Wallet</button>
            <p>Selected Account: {web3State.selectedAccount}</p>
        </div>
    )
}
 
export default Wallet;