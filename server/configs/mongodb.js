import mongoose from "mongoose";

const connectDB = async () => {

    await mongoose.connect(process.env.MONGODB_URI, {
  dbName: "bg-removal"
});

    await mongoose.connect(`${process.env.MONGODB_URI}/bg-removal`)
}

export default connectDB