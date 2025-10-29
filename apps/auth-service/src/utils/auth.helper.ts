import crypto from "crypto"
import { ValidationError } from "../../../../packages/error-handler"

const emailRegex = /^[\w.%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/;


export const validatedRegistrationData = (data: any, userType: "user" | "seller") => {
   const { name, email, password, phone_number, country } = data

   if (!name || !email || !password || (userType === "seller" && (!phone_number || !country))) {
     return new ValidationError(`Missing required fields!`)
   }

   if (!emailRegex.test(email)) {
     return new ValidationError("Invalid email format")
   }
}
