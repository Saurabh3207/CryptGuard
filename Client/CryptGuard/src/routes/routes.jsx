import { createBrowserRouter } from 'react-router-dom';
import Wallet from '../pages/Wallet';
import Home from '../pages/Home';
import Vault from '../pages/Vault';

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
      // we can add more child pages later like:
      // {path: "settings", element: <Settings />},
    ],
  },
]);
