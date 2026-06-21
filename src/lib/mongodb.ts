/**
 * EduFlow — MongoDB connection helper (Mongoose)
 *
 * Usage (server components / API routes):
 *   import { connectDB } from "@/lib/mongodb"
 *   await connectDB()
 *
 * Requires MONGODB_URI in .env.local:
 *   MONGODB_URI=mongodb://localhost:27017/eduflow
 *   # or Atlas:
 *   MONGODB_URI=mongodb+srv://<user>:<pass>@cluster0.xxxxx.mongodb.net/eduflow?retryWrites=true&w=majority
 */

import mongoose from "mongoose"

const MONGODB_URI = process.env.MONGODB_URI as string

/**
 * Global cached connection — prevents creating new connections on every
 * hot-reload in development (Next.js keeps the module cache across reloads).
 */
declare global {
  // next-hot-reload keeps module cache; suppress global var lint warning
  var _mongooseCache: { conn: typeof mongoose | null; promise: Promise<typeof mongoose> | null }
}

let cached = global._mongooseCache

if (!cached) {
  cached = global._mongooseCache = { conn: null, promise: null }
}

export async function connectDB(): Promise<typeof mongoose> {
  if (!process.env.MONGODB_URI) throw new Error("MONGODB_URI is not set. Add it to .env.local before starting the server.")

  if (cached.conn) return cached.conn

  if (!cached.promise) {
    cached.promise = mongoose.connect(MONGODB_URI, {
      bufferCommands: false,
    })
  }

  cached.conn = await cached.promise
  return cached.conn
}

/** Raw MongoClient for operations that don't need Mongoose models */
export { mongoose }
