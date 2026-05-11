import app from './src/app.js'
import { initDb } from './src/initDb.js'

const PORT = process.env.PORT || 3000

const startServer = async () => {
  try {
    await initDb()

    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`)
    })
  } catch (err) {
    console.error('Failed to start server:', err)
    process.exit(1)
  }
}

startServer()