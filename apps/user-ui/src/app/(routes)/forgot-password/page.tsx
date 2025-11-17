"use client"
import GoogleButton from '@/app/shared/components/google-button'
import { useMutation } from '@tanstack/react-query'
import axios, { AxiosError } from 'axios'
import { Eye, EyeOff } from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import React, { useRef, useState } from 'react'
import { useForm } from "react-hook-form"

type FormData = {
  email: string,
  password: string
}

const ForgotPassword= () => {
  const [step, setStep] = useState<"email" | "otp" | "reset">("email") 
  const [otp, setOtp] = useState(["", "", "", ""]) 
  const [userEmail, setUserEmail] = useState<string | null>(null)
  const [canResend, setCanResend] = useState(true)
  const [timer, setTimer] = useState(60)
  const [serverError, setServerError] = useState<string | null>(null)
 
  const inputRefs = useRef<(HTMLInputElement | null)[]>([])
  const router = useRouter()

  const {
    register,
    handleSubmit,
    formState: { errors }
  } = useForm<FormData>()

 
  const startResendTimer = () => {
    setCanResend(false)
    setTimer(60)
    const interval = setInterval(() => {
      setTimer((prev) => {
        if (prev <= 1) {
          clearInterval(interval)
          setCanResend(true)
          return 0
        }
        return prev - 1
      })
    }, 1000)
  }

 const requestOtpMutation = useMutation({
   mutationFn: async ({ email }: { email: string }) => {
     const response = await axios.post(
      `${process.env.NEXT_PUBLIC_SERVER_URI}/api/forgot-password-user`,
      { email }
     )
     return response.data
   },
   onSuccess: (_, { email }) => {
     setUserEmail(email),
     setStep("otp"),
     setServerError(null)
     setCanResend(false)
     startResendTimer()
   },
   onError: (error: AxiosError) => {
     const errorMessage = 
       (error.response?.data as { message?: string }) ?. message || 
       "Invalid OTP. Try again!"
       setServerError(errorMessage)
   }
 })

 const verifyOtpMutation = useMutation({
   mutationFn: async () => {
     if (!userEmail) return
     const response = await axios.post(
      `${process.env.NEXT_PUBLIC_SERVER_URI}/api/verify-forgot-password-user`,
      { email: userEmail, otp: otp.join("") }
    )
    return response.data
   },
   onSuccess: () => {
     setStep("reset")
     setServerError(null)
   },
   onError: (error: AxiosError) => {
     const errorMessage = (error.response?.data as { message?: string })?.message
     setServerError(errorMessage || "Invalid OTP. Try again!")
   }
 })

const resetPasswordMutation = useMutation({
  mutationFn: async ({ password }: { password: string }) => {
    if (!password) return
    const response = await axios.post(
      `${process.env.NEXT_PUBLIC_SERVER_URI}/api/reset-forgot-password-user`,
      { email: userEmail, newPassword: password }
    )
    return response.data
  },
  onSuccess: () => {
    setStep("email")
    toast.success(
     "Password reset successfully! Please login with your new password."
    ) 
    setServerError(null)
    router.push("/login")
  },
   onError: (error: AxiosError) => {
     const errorMessage = (error.response?.data as { message?: string })?.message
     setServerError(errorMessage || "Invalid OTP. Try again!")
   }
})

const handleOtpChange = (index: number, value: string) => {
  if (!/^[0-9]?$/.test(value)) return
  const newOtp = [...otp]
  newOtp[index] = value
  setOtp(newOtp)

  if (value && index < inputRefs.current.length - 1) {
    inputRefs.current[index + 1]?.focus()
  }
}

 const handleOtpKeyDown = (index: number, e:React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus()
    }
  }

  const onSubmitEmail = ({ email }: { email: string }) => {
    requestOtpMutation.mutate({ email })
  }

  const onSubmitPassword = ({ password }: { password: string }) => {
    resetPasswordMutation.mutate({ password })
  }

  const onSubmit = (data: FormData) => {
    console.log(data);
     
  }
  return (
    <div className="w-full py-10 min-h-[85vh] bg-[#f1f1f1]">
      <h1 className="text-4xl font-Poppins font-semibold text-black text-center">
        Forgot Password
      </h1>
      <p className="text-center text-lg font-medium py-3 text-[#00000099]">
         Home   .   Forgot-password
      </p>

      <div className="w-full flex justify-center">
        <div className="md:w-[480px] p-8 bg-white shadow rounded-lg">
          <h3 className="text-3xl font-semibold text-center mb-2">
            Login to Eshop
          </h3>
          <p className="text-center text-gray-500 mb-4">
            Go back to? {" "}
            <Link href={"/login"} className="text-blue-500">
              Login
            </Link>
          </p>
          <form
           onSubmit={handleSubmit(onSubmit)}
          >
            <label className="block text-gray-700 mb-1">Email</label>
            <input
             type="email"
             placeholder="aniebietedet2025@gmail.com"
             className="w-full p-2 border border-gray-300 outline-0 !rounded mb-1"
             { ...register("email", {
               required: "Email is required",
               pattern: {
                 value: /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,4}$/,
                 message: "Invalid email address"
               }
             }) }
            />
            {errors.email && (
              <p className="text-red-500 text-sm">
                {String(errors.email.message)}
              </p>
            )}

              <button
                type="submit"
                disabled={loginMutation.isPending}
                className="w-full text-lg cursor-pointer mt-4 bg-black text-white py-2 rounded-lg"
              >
                Submit
              </button>
          </form>
        </div>
      </div>
    </div>
  )
}

export default ForgotPassword