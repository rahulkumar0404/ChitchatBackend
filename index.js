import {app, server} from './app.js'
import { connectDb } from './utils/features.js';
import dotenv from 'dotenv';
dotenv.config({ path: './config/.env' });
const PORT = process.env.PORT || 3000;

connectDb(process.env.MONGO_URL);

server.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});