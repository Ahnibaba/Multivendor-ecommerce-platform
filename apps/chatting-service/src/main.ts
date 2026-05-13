
import express from 'express';
import cookieParser from "cookie-parser"

const app = express();

app.use(express.json())
app.use(cookieParser())

app.get('/', (req, res) => {
  res.send({ message: 'Welcome to chatting-service!' });
});

const port = process.env.PORT || 6006;

// Websocket server


const server = app.listen(port, () => {
  console.log(`Listening at http://localhost:${port}/api`);
});
server.on('error', console.error);
