import express from 'express'
import { isAuthenticated } from '../middlewares/auth'
const app = express.Router()

app.use(isAuthenticated)

app.post('/groupchat', newGroupChat)