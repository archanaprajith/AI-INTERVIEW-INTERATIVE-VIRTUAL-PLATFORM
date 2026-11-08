import mongoose from 'mongoose';

const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
    throw new Error('Please define the MONGODB_URI environment variable inside .env.local');
}

/**
 * Global is used here to maintain a cached connection across hot reloads
 * in development. This prevents connections growing exponentially
 * during API Route usage.
 */
// @ts-ignore
let cached = global.mongoose;

if (!cached) {
    // @ts-ignore
    cached = global.mongoose = { conn: null, promise: null };
}

async function dbConnect() {
    if (cached.conn) {
        return cached.conn;
    }

    if (!cached.promise) {
        const opts = {
            bufferCommands: false,
            serverSelectionTimeoutMS: 5000, // Timeout after 5s instead of hanging for 30s
        };

        const uri = process.env.MONGODB_URI || MONGODB_URI;

        cached.promise = mongoose.connect(uri as string, opts).then((mongoose) => {
            return mongoose;
        });
    }

    try {
        cached.conn = await cached.promise;
    } catch (e: any) {
        cached.promise = null;

        // Provide a clear explanation for Atlas IP Access List / SSL handshake errors
        if (
            e.name === 'MongooseServerSelectionError' ||
            e.name === 'MongoNetworkError' ||
            e.message?.includes('SSL alert') ||
            e.message?.includes('whitelisted')
        ) {
            throw new Error(
                'Database connection error: Could not reach MongoDB Atlas. Please ensure your current IP address is added to the IP Access List in MongoDB Atlas (Network Access > Add IP Address).'
            );
        }

        throw e;
    }

    return cached.conn;
}

export default dbConnect;
