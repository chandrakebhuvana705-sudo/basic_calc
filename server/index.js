import express from 'express'
import cors from 'cors'
import { open } from 'sqlite'
import sqlite3 from 'sqlite3'
import path from 'path'
import { fileURLToPath } from 'url'
import fs from 'fs'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const PORT = process.env.PORT || 5174
const DB_DIR = path.join(__dirname, 'data')
const DB_PATH = path.join(DB_DIR, 'calculator.db')

if (!fs.existsSync(DB_DIR)) {
  fs.mkdirSync(DB_DIR, { recursive: true })
}

const app = express()
app.use(cors())
app.use(express.json())

const db = await open({
  filename: DB_PATH,
  driver: sqlite3.Database,
})

await db.exec(`
  CREATE TABLE IF NOT EXISTS calculations (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    expression TEXT NOT NULL,
    result TEXT NOT NULL,
    created_at TEXT NOT NULL
  )
`)

app.get('/api/calculations', async (_req, res) => {
  const rows = await db.all(
    'SELECT id, expression, result, created_at FROM calculations ORDER BY id DESC LIMIT 50'
  )
  res.json(rows)
})

app.post('/api/calculations', async (req, res) => {
  const { expression, result } = req.body || {}
  if (!expression || result === undefined) {
    return res.status(400).json({ error: 'expression and result are required' })
  }

  const createdAt = new Date().toISOString()
  const stmt = await db.run(
    'INSERT INTO calculations (expression, result, created_at) VALUES (?, ?, ?)',
    [expression, result, createdAt]
  )

  res.status(201).json({
    id: stmt.lastID,
    expression,
    result,
    created_at: createdAt,
  })
})

if (process.env.NODE_ENV === 'production') {
  const clientPath = path.join(__dirname, '..', 'dist')
  app.use(express.static(clientPath))
  app.get('*', (_req, res) => {
    res.sendFile(path.join(clientPath, 'index.html'))
  })
}

app.listen(PORT, () => {
  console.log(`Calculator API running on http://localhost:${PORT}`)
})
