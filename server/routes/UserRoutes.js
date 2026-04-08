import express from 'express'
import { clerkWebhooks, paymentRazorpay, userCredits, verifyRazorpay } from '../controllers/UserController.js'
import authUser from '../middlewares/auth.js'



const userRouter = express.Router()

userRouter.post('/webhooks', clerkWebhooks)
userRouter.get('/credits', authUser, userCredits)
// Ensure 'pay-razor' matches your frontend call
userRouter.post('/pay-razor', authUser, paymentRazorpay);
userRouter.post('/verify-razor', verifyRazorpay)

export default userRouter