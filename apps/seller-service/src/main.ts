import dotenv from "dotenv"
dotenv.config()

import express from 'express';
import * as path from 'path';
import cookieParser from "cookie-parser"
import sellerRoutes from './routes/seller.route';

const app = express();

app.use(express.json())
app.use(express.urlencoded({ extended: true }))
app.use(cookieParser())

app.use('/assets', express.static(path.join(__dirname, 'assets')));

app.get('/api', (req, res) => {
  res.send({ message: 'Welcome to seller-service!' });
});

// routes
app.use("/api", sellerRoutes)

const port = process.env.PORT || 6004;
const server = app.listen(port, () => {
  console.log(`Listening at http://localhost:${port}/api`);
});
server.on('error', console.error);
