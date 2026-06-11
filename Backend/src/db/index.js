import mongoose from "mongoose";
import { DB_NAME } from "../constants.js";
  

export const connectDB= async () => {
    try {
const connectionInst = await mongoose.connect(`${process.env.MONGODB_URI}/${DB_NAME}`);
        console.log(`\n MOngo DB connected ${connectionInst.connection.host} on ${process.env.MONGODB_URI}/${DB_NAME}`)
    } catch (error) {
        console.log("Mongo DB connection Error",error) 
        process.exit(1)
    }
}