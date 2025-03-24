import { useWeb3Context } from "../contexts/useWeb3Context";
import UploadFile from "../components/UploadFile";
import GetFile from "../components/GetFile";


const Home = () => {
    const { web3State } = useWeb3Context();
    const { selectedAccount } = web3State;

    //console.log(selectedAccount);

    return (
        <div> 
            <h1>Home</h1>
            <p>Welcome to CryptGuard</p>
            <p>Your connected account is: {selectedAccount}</p>

            <UploadFile />
        </div>
    );
}

export default Home;
