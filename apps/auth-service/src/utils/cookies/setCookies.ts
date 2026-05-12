import { Response } from "express"

export const setCookie = (res: Response, name: string, value: string, maxAge: number) => {
   res.cookie(
     name,
     value,
     {
        httpOnly: true,
        secure: true,
        sameSite: "none",
        maxAge
     }
   ) 
}
