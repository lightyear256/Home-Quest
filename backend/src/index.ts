import express from'express'
import cors from 'cors'
import { buyerRouter } from './routes/buyerRouter.js';
import { adminRouter } from './routes/adminRouter.js';
 export const app=express();
 app.use(express.json())

app.use(cors({
    origin:"*",
    credentials:true
}))
app.use("/admin",adminRouter)
app.use("/buyer",buyerRouter)
app.get('/ping', (req, res) => {
  res.send('pong');
});