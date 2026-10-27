
import mongoose from "mongoose";
import { env } from "./env.js";
import { setServers } from "node:dns/promises"

export async function connectDatabase() {
    mongoose.set("strictQuery", true);

    setServers(["1.1.1.1", "8.8.8.8"])
    await mongoose.connect(env.MONGODB_URI, {
        serverSelectionTimeoutMS: 10000,
        connectTimeoutMS: 10000,
    });

    console.log("MongoDB connected successfully.");
}

export async function disconnectDatabase() {
    await mongoose.disconnect();
    console.log("MongoDB disconnected.");
}
