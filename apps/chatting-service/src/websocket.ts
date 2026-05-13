import redis from "../../../packages/libs/redis";
import { Server as HttpServer } from "http";
import { createKafka } from "../../../packages/utils/kafka";
import { WebSocketServer, WebSocket } from "ws"


const kafka = createKafka()

const producers = kafka.producer()
const connectedUsers: Map<string, WebSocket> = new Map()
const unSeenCounts : Map<string, number> = new Map()


type IncomingMessage = {
    type?: string;
    fromUserId: string;
    toUserId: string;
    messageBody: string;
    conversationId: string;
    senderType: string;
}

export async function createWebSocketServer(server: HttpServer) {
    const wss = new WebSocketServer({ server })

    await producers.connect()
    console.log("Kafka producer connected!");

    wss.on("connection", (ws: WebSocket) => {
       console.log("New Websocket connection!");

       let registeredUserId: string | null = null

       ws.on("message", async (rawMessage) => {
          try {
             const messageStr = rawMessage.toString()

             // Register the user on first plain message (non-JSON)
             if (!registeredUserId && !messageStr.startsWith("{")) {
                registeredUserId = messageStr
                connectedUsers.set(registeredUserId, ws)
                console.log(`registered websocket for userId: ${registeredUserId}`);
                

                const isSeller = registeredUserId.startsWith("seller_")
                const redisKey = isSeller 
                     ? `online:seller:${registeredUserId.replace("seller_", "")}`
                     : `online:user:${registeredUserId}`
                     await redis.set(redisKey, "1")
                
             }
          } catch (error) {
            
          }
       })
    })
    
}