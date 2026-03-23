"use client"

import { useEffect, useState } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import axiosInstance from "@/utils/axiosInstance"
import PaymentSuccess from "@/app/shared/components/payment-success/page"

export default function PaymentCallbackPage() {
    const searchParams = useSearchParams()
    const router = useRouter()
    const [status, setStatus] = useState<"loading" | "success" | "failed">("loading")


    const txRef = searchParams.get("tx_ref")
    const txStatus = searchParams.get("status")
    const transactionId = searchParams.get("transaction_id")


    useEffect(() => {
        const verifyPayment = async () => {
            if (!txRef || !txStatus) {
                setStatus("failed")
                return
            }

            if (txStatus === "cancelled") {
                setStatus("failed")
                router.push("/cart?cancelled=true")
                return
            }

            try {
                // optional: notify backend of redirect
                // webhook already handles order creation
                // this is just for UI feedback
                if (txStatus === "successful") {
                    setStatus("success")
                    setTimeout(() => router.push("/orders"), 3000)
                } else {
                    setStatus("failed")
                    setTimeout(() => router.push("/cart?failed=true"), 3000)
                }
            } catch (error) {
                setStatus("failed")
            }
        }

        verifyPayment()
    }, [searchParams])

    return (
        <div className="flex flex-col items-center justify-center min-h-screen">
            {status === "loading" && (
                <div>
                    <p className="text-lg">Verifying your payment...</p>
                </div>
            )}
            {status === "success" && (
                // <PaymentSuccess sessionId={txRef!} />
                 <div>
                    <h1 className="text-2xl font-bold text-green-600">Payment successful🎉</h1>
                </div>
            )}
            {status === "failed" && (
                <div>
                    <h1 className="text-2xl font-bold text-red-600">Payment Failed!</h1>
                    <p className="text-gray-500">Redirecting back to Cart...</p>
                </div>
            )}
        </div>
    )
}