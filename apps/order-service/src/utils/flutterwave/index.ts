import axios from "axios"




export const getBanksHelper = async () => {
    const response = await axios.get(
      `${process.env.FLW_BASE_URL}/banks/NG`,
      {
        headers: {
           Authorization: `Bearer ${process.env.FLW_PROD_SECRET_KEY}`,
           "X-Trace-Id": crypto.randomUUID()
        }
      }
    )
    return response.data
}