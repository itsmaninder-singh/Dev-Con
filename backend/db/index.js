import mongoose from 'mongoose';

const MAX_RETRIES = 5;
const RETRY_DELAY_MS = 3000;

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const connectDB = async () => {
  const uri = process.env.MONGO_URI;

  if (!uri) {
    console.error('\n============================================================');
    console.error(' [database] FATAL: MONGO_URI environment variable is missing!');
    console.error(' Please define MONGO_URI in your backend/.env file.');
    console.error(' Example: MONGO_URI=mongodb+srv://<user>:<password>@cluster.mongodb.net/devconnect');
    console.error('============================================================\n');
    process.exit(1);
  }

  // Prevent duplicate connections if already connected or connecting
  if (mongoose.connection.readyState === 1) {
    console.log('[database] MongoDB already connected.');
    return mongoose.connection;
  }

  // Attach lifecycle event listeners once
  if (!mongoose.connection._hasRegisteredListeners) {
    mongoose.connection.on('connected', () => {
      console.log(`[database] MongoDB connection established successfully.`);
    });

    mongoose.connection.on('error', (err) => {
      console.error(`[database] MongoDB runtime error: ${err.message}`);
    });

    mongoose.connection.on('disconnected', () => {
      console.warn('[database] MongoDB disconnected.');
    });

    mongoose.connection.on('reconnected', () => {
      console.log('[database] MongoDB reconnected successfully.');
    });

    mongoose.connection._hasRegisteredListeners = true;
  }

  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    try {
      console.log(`[database] Connecting to MongoDB (attempt ${attempt}/${MAX_RETRIES})...`);
      const conn = await mongoose.connect(uri, {
        serverSelectionTimeoutMS: 5000,
        socketTimeoutMS: 45000,
        maxPoolSize: 20,
      });

      console.log(`[database] MongoDB Connected successfully: host="${conn.connection.host}", db="${conn.connection.name}"`);
      return conn;
    } catch (error) {
      console.error(`[database] Connection attempt ${attempt} failed: ${error.message}`);

      if (attempt < MAX_RETRIES) {
        console.log(`[database] Retrying in ${RETRY_DELAY_MS / 1000}s...`);
        await sleep(RETRY_DELAY_MS);
      } else {
        console.error('\n============================================================');
        console.error(' [database] FATAL: Could not connect to MongoDB after maximum retry attempts.');
        console.error(' Please verify:');
        console.error('  1. Your internet connection and DNS resolution');
        console.error('  2. MongoDB Atlas Network Access IP Whitelist (add 0.0.0.0/0 for testing)');
        console.error('  3. Username & password credentials in your MONGO_URI');
        console.error('============================================================\n');
        process.exit(1);
      }
    }
  }
};

export const disconnectDB = async () => {
  try {
    await mongoose.connection.close();
    console.log('[database] MongoDB connection closed gracefully.');
  } catch (err) {
    console.error(`[database] Error closing MongoDB connection: ${err.message}`);
  }
};

export default connectDB;