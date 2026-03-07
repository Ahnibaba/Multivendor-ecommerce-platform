import { Response, NextFunction } from "express";
import axios from "axios"
import { ValidationError } from "../../../../packages/error-handler"
import prisma from "../../../../packages/libs/prisma";
import { handleChargeCompleted, verifyFlutterwaveTransaction } from "../utils/flutterwave";

export const createFlutterwaveSubAccount = async (
    req: any,
    res: Response,
    next: NextFunction
) => {
    try {

        const {
            account_bank,
            account_number,
            business_name,
            country,    // as to be of a standard abbrev e.g NG
            currency,
            split_value, // with a value of 0.15 from the front
            business_mobile,
            business_email,
            business_contact,
            business_contact_mobile,
            split_type  //  with the value- "percentage"
        } = req.body

        const sellerId  = req.seller.id
        
        if (!sellerId) {
           return next(new ValidationError("Seller ID is required"))
        }

        const seller = await prisma.sellers.findUnique({
           where: {
             id: sellerId
           },
           include: {
             shop: true
           }
        })

        if (!seller) {
          return next(new ValidationError("Seller is not available with this id!"))
        }

        const options = {
            method: "POST",
            url: `${process.env.FLW_BASE_URL}/subaccounts`,
            headers: {
                Authorization: `Bearer ${process.env.FLW_PROD_SECRET_KEY}`,
                "Content-Type": "application/json",
                accept: "application/json"
            },
            data: {
                account_bank,
                account_number,
                business_name,
                country, 
                currency,
                split_value, 
                business_mobile,
                business_email,
                business_contact,
                business_contact_mobile,
                split_type  
            }

    }

    

    const response = await axios.request(options)
    const subaccount_id = response.data.data.subaccount_id
    

    const subaccount = await prisma.flutterwaveSubAccount.create({
        data: {
                sellerId: seller?.id!,
                shopId: seller?.shop?.id!,
                account_bank,
                account_number,
                business_name,
                country, 
                split_value, 
                business_mobile,
                business_email,
                business_contact,
                business_contact_mobile,
                split_type,
                subaccount_id,
                currency
            }
    })

    await prisma.sellers.update({
       where: { id: seller?.id },
       data: {
         flutterwaveId: subaccount_id
       }
    })

    res.status(200).json({ flutter: response.data, dB: subaccount })
    

   } catch (error) {
     console.error("Error in the createFlutterwaveSubAccount function", error);
     res.status(500).json(error)
   } 
}



export const flutterWebhook = async (
   req: any,
   res: Response,
   next: NextFunction
) => {
  try {
     const secretHash = process.env.FLUTTERWAVE_WEBHOOK_SECRET
     const signature = req.headers["verif-hash"]

     if (!signature || signature !== secretHash) {
       return res.status(401).json({
         message: "Invalid webhook signature"
       })
     }

     const { event, data } = req.body

     if (event === "charge.completed") {
       await handleChargeCompleted({ transactionId: data.id })
     }
     
     return res.status(200).json({ success: true })

  } catch (error) {
    console.log("Error in the flutterWebhook Function", error);
    return next(error)
  }
}

export const verifyFlutterwave = async (req: any, res: Response) => {
  try {
    const { transactionId } = req.body

   const result =  await verifyFlutterwaveTransaction(transactionId)

   res.status(200).json(result)
  } catch (error) {
    console.error("Error in the verifyFlutterwave function", error)
  }
}
