import { messageInRaw, Webhook } from "svix";
import userModel from "../models/userModel.js";
import connectDB from "../configs/mongodb.js";
import razorpay from 'razorpay'
import transactionModel from "../models/transactionModel.js";

// API Controller function to manage clerk user with db
// http://localhost:4000/api/user/webhooks

const clerkWebhooks = async (req, res) => {

    console.log("🔥 Webhook hit");
    console.log("Headers:", req.headers);

    await connectDB();

    try {
        const whook = new Webhook(process.env.CLERK_WEBHOOK_SECRET);

        // ✅ Always use raw body as string
        const payload = req.body.toString();

        console.log("Body:", payload);

        // ✅ Verify using STRING (not parsed object)
        await whook.verify(payload, {
            "svix-id": req.headers["svix-id"],
            "svix-timestamp": req.headers["svix-timestamp"],
            "svix-signature": req.headers["svix-signature"]
        });

        // ✅ Parse AFTER verification
        const parsed = JSON.parse(payload);
        const { data, type } = parsed;

        console.log("TYPE:", type);

        switch (type) {

            case "user.created": {
                const userData = {
                    clerkId: data.id,
                    email: data.email_addresses[0].email_address,
                    firstName: data.first_name,
                    lastName: data.last_name,
                    photo: data.image_url
                };

                await userModel.create(userData);
                console.log("✅ User saved");
                break;
            }

            case "user.updated": {
                const userData = {
                    email: data.email_addresses[0].email_address,
                    firstName: data.first_name,
                    lastName: data.last_name,
                    photo: data.image_url
                };

                await userModel.findOneAndUpdate(
                    { clerkId: data.id },
                    userData
                );

                console.log("✏️ User updated");
                break;
            }

            case "user.deleted": {
                await userModel.findOneAndDelete({ clerkId: data.id });
                console.log("🗑️ User deleted");
                break;
            }

            default:
                console.log("⚠️ Unhandled event type");
                break;
        }

        res.json({ success: true });

    } catch (error) {
        console.log("❌ Error:", error.message);
        res.status(400).json({ success: false, message: error.message });
    }
};



const userCredits = async(req, res) => {
    try{
        const { clerkId } = req
        
        const userData = await userModel.findOne({clerkId})

        if (!userData) {
            return res.json({ success: false, message: "User not found" })
        }

        res.json({success: true, credits: userData.creditBalance })
    }
    catch(error){
        console.log(error.message)
        res.json({success: false, message:error.message})
    }
}

// gateway initialize
const razorpayInstance = new razorpay({
    key_id: process.env.RAZORPAY_KEY_ID,
    key_secret: process.env.RAZORPAY_KEY_SECRET
})

// API to make payment for credits
const paymentRazorpay = async (req, res) => {
    try {
        const { clerkId } = req; // Ensure authUser middleware is working
        const { planId } = req.body;

        const userData = await userModel.findOne({ clerkId });

        if (!userData || !planId) {
            return res.json({ success: false, message: 'Invalid Credentials' });
        }

        let credits, plan, amount;

        switch (planId) {
            case 'Basic':
                plan = 'Basic'; credits = 100; amount = 10; break;
            case 'Advanced':
                plan = 'Advanced'; credits = 500; amount = 50; break;
            case 'Business':
                plan = 'Business'; credits = 5000; amount = 500; break;
            default:
                return res.json({ success: false, message: 'Plan not found' });
        }

        const date = Date.now();

        // 1. Create the Razorpay Order
        const options = {
            amount: amount * 100, // amount in paise
            currency: 'INR',
            receipt: `receipt_${date}`
        };

        razorpayInstance.orders.create(options, async (error, order) => {
            if (error) {
                console.log(error);
                return res.json({ success: false, message: error.message });
            }

            // 2. Save the transaction to the database
            await transactionModel.create({
                clerkId,
                plan,
                amount,
                credits,
                orderId: order.id,
                date
            });

            // 3. Send the order to frontend
            res.json({ success: true, order });
        });

    } catch (error) {
        console.log(error.message);
        res.json({ success: false, message: error.message });
    }
};

const verifyRazorpay = async (req, res) => {
    try {
        const { razorpay_order_id } = req.body;
        const orderInfo = await razorpayInstance.orders.fetch(razorpay_order_id);

        if (orderInfo.status === 'paid') {
            // Find by orderId, not by _id
            const transactionData = await transactionModel.findOne({ orderId: razorpay_order_id });

            if (!transactionData || transactionData.payment) {
                return res.json({ success: false, message: 'Transaction not found or already paid' });
            }

            const userData = await userModel.findOne({ clerkId: transactionData.clerkId });
            const creditBalance = userData.creditBalance + transactionData.credits;
            
            await userModel.findByIdAndUpdate(userData._id, { creditBalance });
            await transactionModel.findByIdAndUpdate(transactionData._id, { payment: true });

            res.json({ success: true, message: "Credits Added" });
        }
    } catch (error) {
        res.json({ success: false, message: error.message });
    }
}

export { clerkWebhooks, userCredits, paymentRazorpay, verifyRazorpay };