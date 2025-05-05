import { createBrowserRouter } from 'react-router-dom';
import Wallet from '../pages/Wallet';
import Home from '../pages/Home';
import Vault from '../pages/Vault';
import HelpSupport from '../components/helpsupport'; 

export const routes = createBrowserRouter([
  {
    path: "/",
    element: <Wallet />,
  },
  {
    path: "/home",
    element: <Home />,
    children: [
      {
        path: "vault",
        element: <Vault />,
      },
      {
        path: "support",  
        element: <HelpSupport />,
      },
   
    ],
  },
]);
