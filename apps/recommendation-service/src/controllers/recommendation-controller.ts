import { Response, NextFunction } from "express";
import prisma from "../../../../packages/libs/prisma";


// get recommended products
export const getRecommendedProducts = async (req: any, res: Response, next: NextFunction) => {
    try {
       const userId = req.user.id 

       const products = await prisma.products.findMany({
         include: { images: true, shops: true }
       })

    //    let userAnalytics = await prisma.userAnalytics.findUnique({
    //      where: { userId },
    //      select: { actions: true, recommendations: true, lastTrained: true }
    //    })

       const now = new Date()
       let recommendedProducts = []
    } catch (error) {
        
    }
}