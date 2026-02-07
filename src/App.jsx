import { useEffect, useMemo, useState } from 'react'
import './App.css'

const API_BASE = import.meta.env.VITE_API_BASE || ''

function App() {
  const [expression, setExpression] = useState('')
  const [display, setDisplay] = useState('0')
  const [history, setHistory] = useState([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')

  const buttons = useMemo(
    () => [
      '7',
      '8',
      '9',
      '*',
      '4',
      '5',
      '6',
      '-',
      '1',
      '2',
      '3',
      '+',
      '0',
      '.',
      '=',
    ],
    []
  )

  async function loadHistory() {
    setIsLoading(true)
    setError('')
    try {
      const res = await fetch(`${API_BASE}/api/calculations`)
      if (!res.ok) throw new Error('Failed to load history')
      const data = await res.json()
      setHistory(data)
    } catch (err) {
      setError(err.message || 'Something went wrong')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    loadHistory()
  }, [])

  function appendValue(value) {
    if (value === '=') return
    const nextExpression =
      display === '0' && value !== '.' ? value : `${expression}${value}`
    setExpression(nextExpression)
    setDisplay(nextExpression)
  }

  function clearAll() {
    setExpression('')
    setDisplay('0')
    setError('')
  }

  function backspace() {
    if (!expression) return
    const nextExpression = expression.slice(0, -1)
    setExpression(nextExpression)
    setDisplay(nextExpression || '0')
  }

  async function evaluateExpression() {
    if (!expression) return
    setError('')
    try {
      // eslint-disable-next-line no-new-func
      const result = Function(`"use strict"; return (${expression})`)()
      const resultString = String(result)
      setDisplay(resultString)
      setExpression(resultString)

      const res = await fetch(`${API_BASE}/api/calculations`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ expression, result: resultString }),
      })
      if (!res.ok) throw new Error('Failed to store calculation')
      await loadHistory()
    } catch (err) {
      setError('Invalid expression')
    }
  }

  return (
    <div className="app">
      <header className="header">
        <h1>Shared Calculator</h1>
        <p>Your calculations are stored and shared through a public URL.</p>
      </header>

      <main className="layout">
        <section className="calculator">
          <div className="display">{display}</div>
          <div className="controls">
            <button className="secondary" onClick={clearAll}>
              AC
            </button>
            <button className="secondary" onClick={backspace}>
              ⌫
            </button>
            <button className="secondary" onClick={() => appendValue('%')}>
              %
            </button>
            <button
              className="primary"
              onClick={() => appendValue('/')}
            >
              ÷
            </button>

            {buttons.map((label) => (
              <button
                key={label}
                className={label === '=' ? 'primary equal' : 'key'}
                onClick={() =>
                  label === '=' ? evaluateExpression() : appendValue(label)
                }
              >
                {label}
              </button>
            ))}
          </div>
          {error && <div className="error">{error}</div>}
        </section>

        <section className="history">
          <div className="history-header">
            <h2>History</h2>
            <button onClick={loadHistory} disabled={isLoading}>
              {isLoading ? 'Refreshing...' : 'Refresh'}
            </button>
          </div>
          {history.length === 0 && !isLoading ? (
            <p className="muted">No calculations yet.</p>
          ) : (
            <ul>
              {history.map((item) => (
                <li key={item.id}>
                  <span className="expr">{item.expression}</span>
                  <span className="result">= {item.result}</span>
                  <span className="time">{item.created_at}</span>
                </li>
              ))}
            </ul>
          )}
        </section>
      </main>
    </div>
  )
}

export default App
