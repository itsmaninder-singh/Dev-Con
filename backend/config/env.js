/**
 * Validates and exports all environment variables used in DevConnect backend.
 * Provides clear, early failure messages if critical environment variables are missing.
 */

export const validateEnv = () => {
  const errors = [];
  const warnings = [];

  // 1. Critical Database URI
  if (!process.env.MONGO_URI) {
    errors.push("MONGO_URI is required. Example: mongodb+srv://user:pass@cluster.mongodb.net/devconnect");
  } else if (!/^mongodb(\+srv)?:\/\/.+/i.test(process.env.MONGO_URI.trim())) {
    errors.push("MONGO_URI must be a valid connection string starting with 'mongodb://' or 'mongodb+srv://'");
  }

  // 2. Critical JWT Secret
  if (!process.env.JWT_SECRET) {
    errors.push("JWT_SECRET is required. Generate one with: node -e \"console.log(require('crypto').randomBytes(64).toString('hex'))\"");
  } else if (process.env.JWT_SECRET.length < 16) {
    errors.push("JWT_SECRET is too short (must be at least 16 characters for security)");
  }

  // 3. Security checks in production
  const isProduction = process.env.NODE_ENV === "production";
  if (isProduction) {
    if (!process.env.MESSAGE_ENCRYPTION_KEY || process.env.MESSAGE_ENCRYPTION_KEY.includes("default_dev_key")) {
      errors.push("MESSAGE_ENCRYPTION_KEY must be set to a secure unique key in production mode");
    }
    if (!process.env.REDIS_URL) {
      warnings.push("REDIS_URL is not set; running with in-memory presence/cache in production is not recommended for multiple instances");
    }
  }

  // 4. Feature warnings
  if (!process.env.GROQ_API_KEY) {
    warnings.push("GROQ_API_KEY is not set. AI features (team fit, idea generation) will be disabled or return mock/fallback data.");
  }

  if (!process.env.GOOGLE_CLIENT_ID) {
    warnings.push("GOOGLE_CLIENT_ID is not set. Google Sign-In will be unavailable.");
  }

  if (!process.env.GITHUB_CLIENT_ID || !process.env.GITHUB_CLIENT_SECRET) {
    warnings.push("GITHUB_CLIENT_ID or GITHUB_CLIENT_SECRET is not set. GitHub OAuth login will be unavailable.");
  }

  if (!process.env.CLOUDINARY_CLOUD_NAME || !process.env.CLOUDINARY_API_KEY || !process.env.CLOUDINARY_API_SECRET) {
    warnings.push("Cloudinary credentials (CLOUDINARY_CLOUD_NAME, API_KEY, API_SECRET) are not set. Profile image uploads will fail.");
  }

  // Report warnings
  if (warnings.length > 0) {
    console.log("\n--- [config] Environment Warnings (Non-blocking) ---");
    warnings.forEach((w) => console.warn(` [!] ${w}`));
    console.log("----------------------------------------------------\n");
  }

  // Fatal errors
  if (errors.length > 0) {
    console.error("\n====================================================");
    console.error(" [FATAL CONFIGURATION ERROR] Missing Required Variables:");
    errors.forEach((e) => console.error(` [x] ${e}`));
    console.error("\n Please create or update your .env file in the backend directory.");
    console.error(" Refer to .env.example for a list of required variables.");
    console.error("====================================================\n");
    process.exit(1);
  }
};
