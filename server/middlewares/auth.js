import { verifyToken } from '@clerk/backend'

const authUser = async(req, res, next) => {
    try{

        const {token} = req.headers

        if(!token){
            return res.json({success:false, message: 'Not Authorized Login Again'})
        }

        // Actually verify the token's signature against Clerk (jwt.decode() never did this,
        // and it never had a "clerkId" claim anyway — Clerk puts the user id in "sub").
        const payload = await verifyToken(token, {
            secretKey: process.env.CLERK_SECRET_KEY,
        })

        req.clerkId = payload.sub
        next()
    }
    catch(error){
        console.log(error.message)
        res.json({ success: false, message: 'Not Authorized Login Again' })
    }
}

export default authUser