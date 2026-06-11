import * as tf from "@tensorflow/tfjs"
import { fetchUserActivity } from "./fetch-user-activity"
import { preProcessData } from "../utlis/preProcessData";



const EMBEDDING_DIM = 50

interface UserAction {
    userId: string;
    productId: string;
    action: "product_view" | "add_to_cart" | "add_to_wishlist" | "purchase"
}

interface Interaction {
    userId: string;
    productId: string;
    action: UserAction["action"]
}

interface RecommendedProduct {
    productId: string;
    score: number;
}

async function fetchUserActivity(userId: string):Promise<UserAction[]> {
    const userActions = await fetchUserActivity(userId);
    return Array.isArray(userActions)
      ? (userActions as unknown as UserAction[])
      : []
}

export const recommendProducts = async (userId: string, allProducts: any): Promise<string[]> {
  const userActions:UserAction[] = await fetchUserActivity(userId)

  if (userActions.length === 0) return []

  const processedData = preProcessData(userActions, allProducts)
  if (!processedData || !processedData.interactions || !processedData.products) return []

  const { interactions } = processedData as {
      interactions: Interaction[]
  }

  const userMap:Record<string, number> = {}
  const productMap:Record<string, number> = {}
  let userCount = 0;
  let productCount = 0

  interactions.forEach(({ userId, productId }) => {
     if (!(userId in userMap)) userMap[userId] = userCount++
     if (!(productId in productMap)) productMap[productId] = productCount++
  })

  // define model input layerd
  const userInput = tf.input({
    shape: [1],
    dtype:"int32"
  }) as tf.SymbolicTensor

  const productInput = tf.input({
     shape: [1],
     dtype: "int32"
  }) as tf.SymbolicTensor

  // create embedding layer (like lookup tables) to learn the relationships
  const userEmbedding = tf.layers.embedding({
     inputDim: userCount,
     outputDim: EMBEDDING_DIM
   })
}