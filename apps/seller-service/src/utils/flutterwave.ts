import axios from "axios";
import prisma from "../../../../packages/libs/prisma";

const MAX_RETRIES = 5;
const RETRY_DELAY_MS = 3000;

const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export const verifyFlutterwaveTransaction = async (transactionId: string, retries = 0): Promise<any> => {
    try {
        const options = {
            method: "GET",
            url: `${process.env.FLW_BASE_URL}/transactions/${transactionId}/verify`,
            headers: {
                Authorization: `Bearer ${process.env.FLW_PROD_SECRET_KEY}`
            }
        }

        const response = await axios.request(options) // await once

        if (response.status === 503) {
            if (retries >= MAX_RETRIES) {
                throw new Error(
                    `Flutterwave is unavailable after ${MAX_RETRIES} retries.
                    Transaction ${transactionId} status is unknown. Please verify manually.`
                )
            }

            console.log(
                `Flutterwave returned 503 for transaction ${transactionId}.
                Retrying in ${RETRY_DELAY_MS / 1000}s... (attempt ${retries + 1}/${MAX_RETRIES})`
            );

            await sleep(RETRY_DELAY_MS)
            return verifyFlutterwaveTransaction(transactionId, retries + 1)
        }

        if (response.data.data.status === "pending") {
            if (retries >= MAX_RETRIES) {
                throw new Error(
                    `Transaction ${transactionId} is still pending after ${MAX_RETRIES} retries.
                    A webhook will be sent when it completes.`
                )
            }

            console.log(
                `Transaction ${transactionId} is pending. Retrying in ${RETRY_DELAY_MS / 1000}s... (attempt ${retries + 1}/${MAX_RETRIES})`
            );

            await sleep(RETRY_DELAY_MS)
            return verifyFlutterwaveTransaction(transactionId, retries + 1)
        }

        return response.data.data // return just the data you need

    } catch (error) {
        // Axios throws on 4xx/5xx, but 503 won't reach here since axios
        // throws before our status check — handle it here too
        if (axios.isAxiosError(error) && error.response?.status === 503 && retries < MAX_RETRIES) {
            console.log(
                `Axios caught 503 for transaction ${transactionId}.
                Retrying in ${RETRY_DELAY_MS / 1000}s... (attempt ${retries + 1}/${MAX_RETRIES})`
            );
            await sleep(RETRY_DELAY_MS)
            return verifyFlutterwaveTransaction(transactionId, retries + 1)
        }

        // Retry on network errors
        if (error instanceof TypeError && retries < MAX_RETRIES) {
            console.log(
                `Network error for transaction ${transactionId}. Retrying... (attempt ${retries + 1}/${MAX_RETRIES})`
            );
            await sleep(RETRY_DELAY_MS)
            return verifyFlutterwaveTransaction(transactionId, retries + 1)
        }

        throw error
    }
}

export const handleChargeCompleted = async ({ transactionId }: { transactionId: string }) => {
    const tx = await verifyFlutterwaveTransaction(transactionId)

    if (tx.status !== "successful") {
        console.log(tx);
        return
    }

    const transaction = await prisma.transaction.findUnique({
        where: {
            sessionId: tx.tx_ref
        }
    })

    if (!transaction) {
        throw new Error("Transaction not found");
    }

    // Prevent double credit
    if (transaction?.status === "SUCCESS") return

    const aligns =
        transaction.currency === tx.currency &&
        transaction.amount === tx.charged_amount



    if (!aligns) {
        throw new Error("Invalid Transaction")
    }    
        await prisma.transaction.update({
            where: {
                id: transaction.id
            },
            data: {
                event: "charge.complete",
                transactionId: tx.id.toString(),
                status: "SUCCESS",
                payment_type: tx.payment_type,
                metadata: tx,
                verified: true
            }
        })
}