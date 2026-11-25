import { BrowserRouter } from 'react-router-dom'
import AppProviders from './app/providers/AppProviders.jsx'
import AppRoutes from './routes/index.jsx'

function App() {
  return (
    <AppProviders>
      <BrowserRouter>
        <AppRoutes />
      </BrowserRouter>
    </AppProviders>
  )
}

export default App
