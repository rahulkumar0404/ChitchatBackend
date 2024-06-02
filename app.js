import cookieParser from 'cookie-parser';
import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import { errorMiddleware } from './middlewares/error.js';
import adminRoute from './routes/admin.js';
import chatRoute from './routes/chat.js';
import userRoute from './routes/user.js';
import { setUpSocket } from './socket.js';
import { corsOptions } from './constants/config.js';
import cors from 'cors';
import bodyParser from 'body-parser'
const app = express();
const server = createServer(app);
const io = new Server(server, { cors: corsOptions });
app.set("io", io)
// Use all the Middleware Here
app.use(express.urlencoded());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: false}))
app.use(cookieParser());
app.use(cors(corsOptions));
app.use('/api/v1/user', userRoute);
app.use('/api/v1/chat', chatRoute);
app.use('/api/v1/admin', adminRoute);
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
