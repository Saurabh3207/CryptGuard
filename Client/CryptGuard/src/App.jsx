import Web3Provider from './contexts/Web3Provider'
import { RouterProvider } from 'react-router-dom'
import { routes } from './routes/routes'
import ErrorBoundary from './components/ErrorBoundary'


function App() {
  
  return (
    <ErrorBoundary>
      <Web3Provider>
        <RouterProvider router = {routes}/>
      </Web3Provider> 
    </ErrorBoundary>
  )
}

export default App
