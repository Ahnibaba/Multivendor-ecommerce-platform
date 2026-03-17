import express from 'express';
import * as path from 'path';
import cors from "cors"
import cookieParser from "cookie-parser"
import { errorMiddleware } from "../../../packages/error-handler/error-middleware"
import orderRoutes from './routes/order.route';


const app = express();

app.use(
  cors({
     origin: ["http://localhost:3000"],
     allowedHeaders: ["Authorization", "Content-Type"],
     credentials: true
  })  
)

app.use(express.json())
app.use(cookieParser())
app.use(express.urlencoded({ extended: true }))

app.use("/api", orderRoutes)

app.use(errorMiddleware)


app.use('/assets', express.static(path.join(__dirname, 'assets')));

app.get('/api', (req, res) => {
  res.send({ message: 'Welcome to order-service!' });
});

const port = process.env.PORT || 6004;
const server = app.listen(port, () => {
  console.log(`Listening at http://localhost:${port}/api`);
});
server.on('error', console.error);
