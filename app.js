import express from 'express';
import userRoute from './routes/user.js';
import chatRoute from './routes/chat.js';
import { connectDb } from './utils/features.js';
import dotenv from 'dotenv';
import cookieParser from 'cookie-parser';
import { errorMiddleware } from './middlewares/error.js';
// import {createUser} from './seeders/user.js'
dotenv.config({ path: './config/.env' });
connectDb(process.env.MONGO_URL);
// createUser(10);
const app = express();

// Use all the Middleware Here
app.use(express.json());
app.use(express.urlencoded());
app.use(cookieParser());

app.use('/user', userRoute);
app.use('/chat', chatRoute);
app.get('/', (req, res) => {
  res.send('Welcome to chitchat');
});

app.use(errorMiddleware);
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
