import { useWeb3Context } from "../contexts/useWeb3Context";

const Home = () => {
    const { web3State } = useWeb3Context();
    const { selectedAccount } = web3State;

    //console.log(selectedAccount);

    return (
        <div> 
            <h1>Home</h1>
            <p>Welcome to CryptGuard</p>
            <p>Your connected account is: {selectedAccount}</p>
        </div>
    );
}

export default Home;
