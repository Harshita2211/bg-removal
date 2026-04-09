// Final Deployment Fix
import 'dotenv/config'
import express from 'express'
import cors from 'cors'
import userRouter from './routes/UserRoutes.js'
import connectDB from './configs/mongodb.js'
import imageRouter from './routes/imageRoutes.js'



// App Config
const PORT = process.env.PORT || 4000
const app = express()
await connectDB()


//Initialize Middlewares
app.use(cors())
// Webhook route must use raw body
app.use('/api/user/webhooks', express.raw({ type: 'application/json' }))

// Other routes can use JSON
app.use(express.json())





//API routes
app.get('/', (req, res) => res.send("API Working"))
app.use('/api/user', userRouter)
app.use('/api/image', imageRouter)

app.listen(PORT, () => console.log("Server Running on port "+ PORT))