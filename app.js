import cookieParser from 'cookie-parser';
import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import { errorMiddleware } from './middlewares/error.js';
import adminRoute from './routes/admin.js';
import chatRoute from './routes/chat.js';
import userRoute from './routes/user.js';
import { setUpSocket } from './socket.js';
const app = express();
const server = createServer(app);
const io = new Server(server, {});

// Use all the Middleware Here
app.use(express.json());
app.use(express.urlencoded());
app.use(cookieParser());

app.use('/user', userRoute);
app.use('/chat', chatRoute);
app.use('/admin', adminRoute);
app.get('/', (req, res) => {
  res.send('Welcome to chitchat');
});

app.use(errorMiddleware);

setUpSocket(io);

export { app, server };


// to add the dummy data
// createUser(10);
// createSampleSingleChats(10);
// createSampleGroupChats(10);
// createSampleMessage(30);
// createMessagesInGroup('66263588df66cdb59d4b045e', 10);