import mongoose from "mongoose";

let isConnected = false;

const connectDB = async () => {
  if (isConnected) return;

  try {
    const conn = await mongoose.connect(process.env.MONGODB_URI, {
      dbName: "bg-removal"
    });

    isConnected = conn.connections[0].readyState;
    console.log("Database Connected");
  } catch (error) {
    console.log(error);
  }
};

export default connectDB;