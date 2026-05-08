import { useEffect, useMemo, useState } from 'react'
import reactLogo from './assets/react.svg'
import viteLogo from './assets/vite.svg'
import heroImg from './assets/hero.png'
import './App.css'

const DEFAULT_TARGET = '192.168.1.0/24'
const DEFAULT_PORTS = '1-1024'

function App() {
  const [target, setTarget] = useState(DEFAULT_TARGET)
  const [ports, setPorts] = useState(DEFAULT_PORTS)
  const [consentOpen, setConsentOpen] = useState(false)
  const [pendingRequest, setPendingRequest] = useState(null)
  const [scanResult, setScanResult] = useState(null)
  const [serverResult, setServerResult] = useState(null)
  const [scanError, setScanError] = useState('')
  const [scanLoading, setScanLoading] = useState(false)
  const desktopApi = typeof window !== 'undefined' ? window.desktopApi : null

  const isPrivateTarget = useMemo(() => {
    const value = target.trim().toLowerCase()
    if (!value) {
      return false
    }

    const host = value.split('/')[0].split(':')[0]
    return (
      host === 'localhost' ||
      host.startsWith('10.') ||
      host.startsWith('192.168.') ||
      /^172\.(1[6-9]|2\d|3[0-1])\./.test(host) ||
      host.startsWith('127.')
    )
  }, [target])

  useEffect(() => {
    if (!desktopApi?.onDeepLink) {
      return undefined
    }

    const unsubscribe = desktopApi.onDeepLink((payload) => {
      setPendingRequest(payload)
      setTarget(payload.target || DEFAULT_TARGET)
      setPorts(payload.ports || DEFAULT_PORTS)
      setConsentOpen(true)
    })

    return () => unsubscribe?.()
  }, [desktopApi])

  const runScan = async () => {
    if (!desktopApi?.runScan) {
      setScanError('Desktop API not available. Start the Electron app.')
      return
    }

    setScanLoading(true)
    setScanError('')
    setScanResult(null)
    setServerResult(null)

    try {
      const data = await desktopApi.runScan({ target, ports })
      setScanResult(data?.scanResult || null)
      setServerResult(data?.serverResult || null)
    } catch (error) {
      setScanError(error instanceof Error ? error.message : 'Request failed')
    } finally {
      setScanLoading(false)
    }
  }

  const requestConsent = (source) => {
    setPendingRequest({ source })
    setConsentOpen(true)
  }

  const approveConsent = () => {
    setConsentOpen(false)
    setPendingRequest(null)
    runScan()
  }

  const cancelConsent = () => {
    setConsentOpen(false)
    setPendingRequest(null)
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
          <h1>Scarlet Desktop Scanner</h1>
          <p>
            Approve local network scans triggered from the web UI.
          </p>
        </div>

        <div className="agent-panel">
          <div>
            <h2>Local scan</h2>
            <p>Only private network targets are allowed.</p>
          </div>
          <div className="agent-row">
            <label className="agent-field">
              <span>Target</span>
              <input
                type="text"
                value={target}
                onChange={(event) => setTarget(event.target.value)}
                placeholder="127.0.0.1"
              />
            </label>
            <label className="agent-field">
              <span>Ports</span>
              <input
                type="text"
                value={ports}
                onChange={(event) => setPorts(event.target.value)}
                placeholder="1-1024"
              />
            </label>
          </div>
          <div className="agent-row agent-options">
            {desktopApi ? (
              <span className="agent-note">
                Waiting for web trigger or run manually.
              </span>
            ) : (
              <span className="agent-note">
                Desktop API unavailable. Start Electron to run scans.
              </span>
            )}
          </div>
          <div className="agent-actions">
            <button
              type="button"
              className="counter"
              onClick={() => requestConsent('manual')}
              disabled={scanLoading || !isPrivateTarget}
            >
              {scanLoading ? 'Scanning...' : 'Request scan'}
            </button>
            {!isPrivateTarget ? (
              <span className="agent-error">Use a private target.</span>
            ) : null}
          </div>
          {scanError ? (
            <p className="agent-error" role="alert">
              {scanError}
            </p>
          ) : null}
          {scanResult ? (
            <pre className="agent-result">
              {JSON.stringify(scanResult, null, 2)}
            </pre>
          ) : null}
          {serverResult ? (
            <pre className="agent-result">
              {JSON.stringify(serverResult, null, 2)}
            </pre>
          ) : null}
        </div>
      </section>

      {consentOpen ? (
        <div className="modal-backdrop" role="presentation">
          <div className="modal" role="dialog" aria-modal="true">
            <h2>Allow local scan?</h2>
            <p>
              Target: <strong>{target}</strong>
            </p>
            <p>
              Ports: <strong>{ports}</strong>
            </p>
            {pendingRequest?.rawUrl ? (
              <p className="agent-note">Source: {pendingRequest.rawUrl}</p>
            ) : null}
            {!isPrivateTarget ? (
              <p className="agent-error">Target must be private.</p>
            ) : null}
            <div className="modal-actions">
              <button
                type="button"
                className="counter"
                onClick={approveConsent}
                disabled={!isPrivateTarget || scanLoading}
              >
                Approve
              </button>
              <button type="button" className="counter" onClick={cancelConsent}>
                Cancel
              </button>
            </div>
          </div>
        </div>
      ) : null}

      <div className="ticks"></div>

      <section id="next-steps">
        <div id="docs">
          <svg className="icon" role="presentation" aria-hidden="true">
            <use href="/icons.svg#documentation-icon"></use>
          </svg>
          <h2>Documentation</h2>
          <p>Desktop scan MVP</p>
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
          <h2>Scan status</h2>
          <p>{scanLoading ? 'Scanning...' : 'Idle'}</p>
        </div>
      </section>
    </>
  )
}

export default App
