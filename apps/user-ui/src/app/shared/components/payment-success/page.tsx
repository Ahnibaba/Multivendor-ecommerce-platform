"use client"

import { useStore } from '@/store'
import React, { useEffect } from 'react'
import confetti from "canvas-confetti"
import { CheckCircle, Truck } from 'lucide-react'
import { useRouter } from 'next/navigation'

const PaymentSuccess = ({ sessionId }: { sessionId: string }) => {
  const router = useRouter()
  
  useEffect(() => {
    useStore.setState({ cart: [] })
    // Confetti should be inside useEffect, not outside
    confetti({
      particleCount: 120,
      spread: 90,
      origin: { y: 0.6 }
    })
  }, []) 
  
  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4">
      <div className="bg-white shadow-sm border border-gray-200 rounded-2xl max-w-md w-full p-8 text-center">
        <div className="text-green-500 mb-4">
           <CheckCircle className="size-16 mx-auto" />
        </div>
        <h2 className="text-2xl font-semibold text-gray-800 mb-2">
          Payment Successful 🎉
        </h2>
        <p className="text-sm text-gray-600 mb-6">
           Thank you for your purchase. Your order has been placed successfully!
        </p>

        <button
          onClick={() => router.push(`/profile?active=My+Orders`)}
          className="inline-flex items-center gap-2 bg-blue-600 text-white px-5 py-2.5 rounded-lg hover:bg-blue-700 transition"
         >
           <Truck className="w-4 h-4" />
           Track Order
        </button>

        <div className="mt-8 text-xs text-gray-400">
            Payment Session ID: <span className="font-mono">{sessionId}</span>
        </div>
      </div>
    </div>
  )
}

export default PaymentSuccess