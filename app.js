import cookieParser from 'cookie-parser';
import express from 'express';
import { errorMiddleware } from './middlewares/error.js';
import chatRoute from './routes/chat.js';
import userRoute from './routes/user.js';
// createUser(10);
// createSampleSingleChats(10);
// createSampleGroupChats(10);
// createSampleMessage(30);
// createMessagesInGroup('66263588df66cdb59d4b045e', 10);
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

export { app };

