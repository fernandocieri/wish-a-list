import { BrowserRouter, Route, Routes } from 'react-router-dom'
import Layout from './components/Layout'
import { Landing, RequireAuth, useAuth } from './modules/auth'
import { Dashboard, EditList, PublicList } from './modules/lists'
import NotFound from './views/NotFound/NotFound'
import Privacy from './views/Privacy/Privacy'

function Home() {
  const { hasAccount, isLoading } = useAuth()
  // Render nothing until the session is known, so owners never see the landing flash.
  if (isLoading) return null
  return hasAccount ? <Dashboard /> : <Landing />
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<Layout />}>
          <Route path="/" element={<Home />} />
          <Route path="/l/:slug" element={<PublicList />} />
          <Route
            path="/lists/:id"
            element={
              <RequireAuth>
                <EditList />
              </RequireAuth>
            }
          />
          <Route path="/privacy" element={<Privacy />} />
          <Route path="*" element={<NotFound />} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}
