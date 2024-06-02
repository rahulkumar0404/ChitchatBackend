import { app, server } from './app.js';
import { connectDb } from './utils/features.js';
import { v2 as cloudinary } from 'cloudinary';
import dotenv from 'dotenv';
dotenv.config({ path: './config/.env' });
const PORT = process.env.PORT || 3000;

connectDb(process.env.MONGO_URL);

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});
server.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
