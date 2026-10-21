import { BrowserRouter, Route, Routes } from 'react-router-dom'
import { Landing } from './modules/auth'
import { Dashboard, EditList, PublicList } from './modules/lists'
import NotFound from './views/NotFound/NotFound'

function Home() {
  // Batch 2: true when useAuth() has a real (non-anonymous) account.
  const hasAccount = false
  return hasAccount ? <Dashboard /> : <Landing />
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/l/:slug" element={<PublicList />} />
        <Route path="/lists/:id" element={<EditList />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </BrowserRouter>
  )
}
