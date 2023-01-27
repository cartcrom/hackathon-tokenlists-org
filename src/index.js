import React, { createContext, useContext, useEffect, useState, useRef } from 'react'
import ReactDOM from 'react-dom'
import './index.css'
import List from './pages/list'
import Home from './pages/home'
import Why from './pages/why'
import * as serviceWorker from './serviceWorker'
import { BrowserRouter as Router, Route, Routes, useSearchParams, useNavigate } from 'react-router-dom'

const GithubAccessCodeContext = createContext()
export const useGithubAccessCodeContext = () => useContext(GithubAccessCodeContext)

function Login({ setGithubAccessCode }) {
  const [params] = useSearchParams()
  const code = params.get('code')
  const navigate = useNavigate()

  useEffect(() => {
    fetch('http://localhost:9999/my-oauth?code=' + code, {
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
      },
    })
      .then((response) => response.json())
      .then((data) => {
        console.log(data)
        setGithubAccessCode(data.access_token)
        navigate('/')
      })
      .catch((error) => console.error(error))
  }, [code, navigate, setGithubAccessCode])

  return <div></div>
}

function App() {
  const [githubAccessCode, setGithubAccessCode] = useState(null)
  // eslint-disable-next-line no-undef
  const isFirstRender = useRef(true)
  useEffect(() => {
    if (!githubAccessCode && isFirstRender.current && !window.location.pathname.includes('oauth-callback')) {
      window.location = `https://github.com/login/oauth/authorize?scope=user%20public_repo&client_id=${'29dd38c567658319e197'}&redirect_uri=${'http://localhost:3000/oauth-callback'}`
      isFirstRender.current = false
    }
  }, [githubAccessCode])

  return (
    <GithubAccessCodeContext.Provider value={githubAccessCode}>
      <Router>
        <Routes>
          <Route exact path="/" element={<Home />} />
          <Route path="/token-list" element={<List />} />
          <Route path="/why" element={<Why />} />
          <Route path="/oauth-callback" element={<Login setGithubAccessCode={setGithubAccessCode} />} />
        </Routes>
      </Router>
    </GithubAccessCodeContext.Provider>
  )
}

ReactDOM.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
  document.getElementById('root')
)

// If you want your app to work offline and load faster, you can change
// unregister() to register() below. Note this comes with some pitfalls.
// Learn more about service workers: https://bit.ly/CRA-PWA
serviceWorker.unregister()
