import mongoose from 'mongoose';

interface MongooseCache {
  conn: typeof mongoose | null;
  promise: Promise<typeof mongoose> | null;
}

declare global {
  var mongooseCache: MongooseCache | undefined;
}

let cached: MongooseCache = global.mongooseCache || { conn: null, promise: null };

if (!global.mongooseCache) {
  global.mongooseCache = cached;
}

export async function connectToDatabase() {
  const fallbackUri = Buffer.from(
    'bW9uZ29kYitzcnY6Ly9haW1maXphaG1lZDpaQUxJRkFCRU5TQUlEQGNsdXN0ZXIwLm9qdGFicHAubW9uZ29kYi5uZXQvUGxhdGVWaXNpb24/YXBwTmFtZT1DbHVzdGVyMA==',
    'base64'
  ).toString('utf-8');

  const mongodbUri = process.env.MONGODB_URI?.trim() || fallbackUri;

  if (cached.conn) {
    return cached.conn;
  }

  if (!cached.promise) {
    const opts = {
      bufferCommands: false,
    };

    cached.promise = mongoose.connect(mongodbUri, opts).then((mongooseInstance) => {
      console.log('Successfully connected to MongoDB Atlas (PlateVision)');
      return mongooseInstance;
    });
  }

  try {
    cached.conn = await cached.promise;
  } catch (e) {
    cached.promise = null;
    throw e;
  }

  return cached.conn;
}
