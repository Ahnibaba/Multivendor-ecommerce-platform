"use server"
import { createKafka } from "../../../../packages/utils/kafka"

const kafka = createKafka()
const producer = kafka.producer()

export async function sendKafkaEvent(eventData: {
  userId?: string;
  productId?: string;
  shopId?: string;
  action: string;
  device?: string;
  country?: string;
  city?: string;
}) {
   try {
     await producer.connect()
     await producer.send({
       topic: "users-events",
       messages: [{ value: JSON.stringify(eventData) }]
     })
   } catch (error) {
     console.log("Error in sendKafkaEvent", error);  
   } finally {
     await producer.disconnect()
   }
}