import Web3Provider from './contexts/web3provider'
import { RouterProvider } from 'react-router-dom'
import { routes } from './routes/routes'


function App() {
  
  return (
    <>
      <Web3Provider>
        <RouterProvider router = {routes}/>
      </Web3Provider> 
    </>
  )
}

export default App
