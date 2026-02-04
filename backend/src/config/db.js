import mongoose from 'mongoose';

export async function connectDb() {
  const uri = process.env.MONGODB_URI;

  if (!uri) {
    console.error('MONGODB_URI is not set in environment variables');
    process.exit(1);
  }

  const dbName = process.env.MONGODB_DB_NAME;
  const options = { autoIndex: true };
  if (dbName) options.dbName = dbName;

  try {
    await mongoose.connect(uri, options);
    console.log('MongoDB connected' + (dbName ? ` (db: ${dbName})` : ''));
  } catch (err) {
    console.error('MongoDB connection error', err);
    throw err;
  }
}

