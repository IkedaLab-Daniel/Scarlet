import { useState } from 'react'
import reactLogo from './assets/react.svg'
import viteLogo from './assets/vite.svg'
import heroImg from './assets/hero.png'
import './App.css'

function App() {
  const [target, setTarget] = useState('127.0.0.1')
  const [ports, setPorts] = useState('1-65535')
  const [launchError, setLaunchError] = useState('')

  const openDesktopScanner = () => {
    if (!target.trim()) {
      setLaunchError('Target is required.')
      return
    }

    setLaunchError('')
    const url = `scarlet://scan?target=${encodeURIComponent(
      target.trim(),
    )}&ports=${encodeURIComponent(ports.trim() || '1-1024')}`
    window.location.href = url
  }

  return (
    <>
      <section id="center">
        <div className="hero">
          <img src={heroImg} className="base" width="170" height="179" alt="" />
          <img src={reactLogo} className="framework" alt="React logo" />
          <img src={viteLogo} className="vite" alt="Vite logo" />
        </div>
        <div>
          <h1>Get started</h1>
          <p>
            Edit <code>src/App.jsx</code> and save to test <code>HMR</code>
          </p>
        </div>
        <div className="scan-panel">
          <div>
            <h2>Open desktop scanner</h2>
            <p>Launch the local app to scan this device only.</p>
          </div>
          <div className="scan-row">
            <label className="scan-field">
              <span>Target (this device)</span>
              <input
                type="text"
                value={target}
                onChange={(event) => setTarget(event.target.value)}
                placeholder="127.0.0.1"
                readOnly
              />
            </label>
            <label className="scan-field">
              <span>Ports</span>
              <input
                type="text"
                value={ports}
                onChange={(event) => setPorts(event.target.value)}
                placeholder="1-65535"
              />
            </label>
          </div>
          <div className="scan-actions">
            <button type="button" className="counter" onClick={openDesktopScanner}>
              Open desktop app
            </button>
            <span className="scan-note">
              If nothing opens, install or start the desktop app first.
            </span>
          </div>
          {launchError ? (
            <p className="scan-error" role="alert">
              {launchError}
            </p>
          ) : null}
        </div>
      </section>

      <div className="ticks"></div>

      <section id="next-steps">
        <div id="docs">
          <svg className="icon" role="presentation" aria-hidden="true">
            <use href="/icons.svg#documentation-icon"></use>
          </svg>
          <h2>Documentation</h2>
          <p>Your questions, answered</p>
          <ul>
            <li>
              <a href="https://vite.dev/" target="_blank">
                <img className="logo" src={viteLogo} alt="" />
                Explore Vite
              </a>
            </li>
            <li>
              <a href="https://react.dev/" target="_blank">
                <img className="button-icon" src={reactLogo} alt="" />
                Learn more
              </a>
            </li>
          </ul>
        </div>
        <div id="social">
          <svg className="icon" role="presentation" aria-hidden="true">
            <use href="/icons.svg#social-icon"></use>
          </svg>
          <h2>Connect with us</h2>
          <p>Join the Vite community</p>
          <ul>
            <li>
              <a href="https://github.com/vitejs/vite" target="_blank">
                <svg
                  className="button-icon"
                  role="presentation"
                  aria-hidden="true"
                >
                  <use href="/icons.svg#github-icon"></use>
                </svg>
                GitHub
              </a>
            </li>
            <li>
              <a href="https://chat.vite.dev/" target="_blank">
                <svg
                  className="button-icon"
                  role="presentation"
                  aria-hidden="true"
                >
                  <use href="/icons.svg#discord-icon"></use>
                </svg>
                Discord
              </a>
            </li>
            <li>
              <a href="https://x.com/vite_js" target="_blank">
                <svg
                  className="button-icon"
                  role="presentation"
                  aria-hidden="true"
                >
                  <use href="/icons.svg#x-icon"></use>
                </svg>
                X.com
              </a>
            </li>
            <li>
              <a href="https://bsky.app/profile/vite.dev" target="_blank">
                <svg
                  className="button-icon"
                  role="presentation"
                  aria-hidden="true"
                >
                  <use href="/icons.svg#bluesky-icon"></use>
                </svg>
                Bluesky
              </a>
            </li>
          </ul>
        </div>
      </section>

      <div className="ticks"></div>
      <section id="spacer"></section>
    </>
  )
}

export default App
