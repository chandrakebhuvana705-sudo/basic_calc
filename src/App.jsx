import { useEffect, useMemo, useState } from 'react'
import { evaluate } from 'mathjs'
import './App.css'

const API_BASE = import.meta.env.VITE_API_BASE || ''

function App() {
  const [expression, setExpression] = useState('')
  const [display, setDisplay] = useState('0')
  const [history, setHistory] = useState([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [isScientific, setIsScientific] = useState(true)
  const [angleMode, setAngleMode] = useState('rad')

  const basicButtons = useMemo(
    () => [
      { label: '7', value: '7' },
      { label: '8', value: '8' },
      { label: '9', value: '9' },
      { label: '/', value: '/' },
      { label: '4', value: '4' },
      { label: '5', value: '5' },
      { label: '6', value: '6' },
      { label: '*', value: '*' },
      { label: '1', value: '1' },
      { label: '2', value: '2' },
      { label: '3', value: '3' },
      { label: '-', value: '-' },
      { label: '0', value: '0' },
      { label: '.', value: '.' },
      { label: '+', value: '+' },
      { label: '=', value: '=' },
    ],
    []
  )

  const scientificButtons = useMemo(
    () => [
      { label: 'sin', value: 'sin(' },
      { label: 'cos', value: 'cos(' },
      { label: 'tan', value: 'tan(' },
      { label: 'asin', value: 'asin(' },
      { label: 'acos', value: 'acos(' },
      { label: 'atan', value: 'atan(' },
      { label: 'log', value: 'log(' },
      { label: 'ln', value: 'ln(' },
      { label: 'sqrt', value: 'sqrt(' },
      { label: 'abs', value: 'abs(' },
      { label: 'exp', value: 'exp(' },
      { label: 'x^y', value: '^' },
      { label: 'x^2', value: '^2' },
      { label: '1/x', value: '^-1' },
      { label: 'pi', value: 'pi' },
      { label: 'e', value: 'e' },
      { label: '%', value: '*0.01' },
      { label: '!', value: '!' },
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
    const shouldReplaceZero =
      expression === '' && display === '0' && /^[0-9]/.test(value)
    const nextExpression = shouldReplaceZero
      ? value
      : `${expression}${value}`
    setExpression(nextExpression)
    setDisplay(nextExpression)
  }

  function insertFunction(value) {
    const nextExpression =
      expression === '' && display === '0' ? value : `${expression}${value}`
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
      const toRadians = (value) =>
        angleMode === 'deg' ? (value * Math.PI) / 180 : value
      const fromRadians = (value) =>
        angleMode === 'deg' ? (value * 180) / Math.PI : value

      const scope = {
        pi: Math.PI,
        e: Math.E,
        sin: (x) => Math.sin(toRadians(x)),
        cos: (x) => Math.cos(toRadians(x)),
        tan: (x) => Math.tan(toRadians(x)),
        asin: (x) => fromRadians(Math.asin(x)),
        acos: (x) => fromRadians(Math.acos(x)),
        atan: (x) => fromRadians(Math.atan(x)),
        log: (x) => Math.log10(x),
        ln: (x) => Math.log(x),
        sqrt: (x) => Math.sqrt(x),
        abs: (x) => Math.abs(x),
        exp: (x) => Math.exp(x),
      }

      const result = evaluate(expression, scope)
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
          <div className="display">
            <div className="display-expression">{expression || '0'}</div>
            <div className="display-result">{display}</div>
          </div>
          <div className="mode-row">
            <button
              className={isScientific ? 'primary' : 'secondary'}
              onClick={() => setIsScientific((prev) => !prev)}
            >
              Scientific
            </button>
            <div className="angle-toggle">
              <button
                className={angleMode === 'rad' ? 'primary' : 'secondary'}
                onClick={() => setAngleMode('rad')}
              >
                Rad
              </button>
              <button
                className={angleMode === 'deg' ? 'primary' : 'secondary'}
                onClick={() => setAngleMode('deg')}
              >
                Deg
              </button>
            </div>
          </div>
          {isScientific && (
            <div className="controls scientific-controls">
              {scientificButtons.map((button) => (
                <button
                  key={button.label}
                  className="key"
                  onClick={() => insertFunction(button.value)}
                >
                  {button.label}
                </button>
              ))}
            </div>
          )}
          <div className="controls">
            <button className="secondary" onClick={clearAll}>
              AC
            </button>
            <button className="secondary" onClick={backspace}>
              DEL
            </button>
            <button className="secondary" onClick={() => appendValue('(')}>
              (
            </button>
            <button className="secondary" onClick={() => appendValue(')')}>
              )
            </button>

            {basicButtons.map((button) => (
              <button
                key={button.label}
                className={button.label === '=' ? 'primary equal' : 'key'}
                onClick={() =>
                  button.label === '='
                    ? evaluateExpression()
                    : appendValue(button.value)
                }
              >
                {button.label}
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
