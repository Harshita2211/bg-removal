import mongoose, { mongo } from "mongoose";


const transactionSchema = new mongoose.Schema({
    clerkId: { type: String, required: true },
    plan: { type: String, required: true },
    amount: { type: Number, required: true },
    credits: { type: Number, required: true },
    payment: { type: Boolean, default: false },
    orderId: { type: String }, // MUST ADD THIS
    date: { type: Number }
})

const transactionModel = mongoose.models.transaction || mongoose.model('transaction', transactionSchema)

export default transactionModel