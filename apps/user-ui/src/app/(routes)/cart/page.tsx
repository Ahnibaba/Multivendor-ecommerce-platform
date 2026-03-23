"use client"
import useDeviceTracking from '@/hooks/useDeviceTracking'
import useLocationTracking from '@/hooks/useLocationTracking'
import useUser from '@/hooks/useUser'
import { useStore } from '@/store'
import axiosInstance from '@/utils/axiosInstance'
import { useMutation, useQuery } from '@tanstack/react-query'
import { AxiosError } from 'axios'
import { Loader2 } from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import React, { useEffect, useState } from 'react'
import toast from 'react-hot-toast'

const CartPage = () => {
    const { user } = useUser()

    const [loading, setLoading] = useState(false)
    const [discountedProductId, setDiscountedProductId] = useState("")
    const [discountPercent, setDiscountPercent] = useState(0)
    const [discountAmount, setDiscountAmount] = useState(0)
    const [couponCode, setCouponCode] = useState("")
    const [coupon, setCoupon] = useState("")
    const [selectedAddressId, setSelectedAddressId] = useState("")
    const [serverError, setServerError] = useState<string | null>(null)

    const router = useRouter()
    const location = useLocationTracking()
    const deviceInfo = useDeviceTracking()

    const cart = useStore((state) => state.cart)
    const removeFromCart = useStore((state) => state.removeFromCart)

    const createPaymentSession = async () => {
        setLoading(true)
        try {
            const sessionRes = await axiosInstance.post("/order/api/create-payment-intent", {
                cart,
                shippingAddressId: selectedAddressId,
                coupon: {
                    code: coupon,
                    discountPercent,
                    discountAmount,
                    discountedProductId
                }
            })

            console.log(sessionRes.data.cart);

            const paymentRes = await axiosInstance.post("/order/api/create-payment-session", {
                sessionId: sessionRes.data.sessionId
            })

      
            window.location.href = paymentRes.data.paymentLink
        } catch (error) {
            toast.error("Error processing payment")
        } finally {
            setLoading(false)
        }
    }

    const decreaseQuantity = (id: string) => {
        useStore.setState((state: any) => ({
            cart: state.cart.map((item: any) =>
                item.id === id && item.quantity > 1
                    ? { ...item, quantity: item.quantity - 1 }
                    : item
            )
        }))
    }

    const increaseQuantity = (id: string) => {
        useStore.setState((state: any) => ({
            cart: state.cart.map((item: any) =>
                item.id === id
                    ? { ...item, quantity: (item.quantity ?? 1) + 1 }
                    : item
            )
        }))
    }

    const removeItem = (id: string) => {
        removeFromCart(id, user, location, deviceInfo)
    }

    // ✅ Subtotal recalculates when discount is applied
    const subtotal = cart.reduce(
        (total: number, item: any) => {
            const itemPrice = item.id === discountedProductId
                ? (item.sale_price * (100 - discountPercent)) / 100
                : item.sale_price
            return total + item.quantity * itemPrice
        }, 0
    )

    // ✅ Original subtotal before discount
    const originalSubtotal = cart.reduce(
        (total: number, item: any) => total + item.quantity * item.sale_price, 0
    )

    const savedAmount = originalSubtotal - subtotal

    // Get addresses
    const { data: addresses = [] } = useQuery<any[], Error>({
        queryKey: ["shipping-addresses"],
        queryFn: async () => {
            const res = await axiosInstance.get("/api/shipping-addresses")
            return res.data.addresses
        }
    })

    // ✅ Auto-clear server error after 3 seconds
    useEffect(() => {
        if (serverError) {
            const timer = setTimeout(() => {
                setServerError(null)
            }, 3000)
            return () => clearTimeout(timer)
        }
        return
    }, [serverError])

    const couponMutation = useMutation({
        mutationFn: async (couponCode: string) => {
            const response = await axiosInstance.post(
                `${process.env.NEXT_PUBLIC_SERVER_URI}/order/api/verify-coupon-code`,
                { couponCode }
            )
            return response.data
        },
        onSuccess: (data) => {
            setServerError(null)
            setDiscountedProductId(data.coupon.discountedProductId)
            setDiscountAmount(data.coupon.discountAmount)
            setDiscountPercent(data.coupon.discountPercent)
            setCoupon(data.coupon.code)
            setCouponCode("")
        },
        onError: (error: AxiosError) => {
            const errorMessage = (error.response?.data as { message?: string })?.message ||
                "Invalid coupon code";
            setServerError(errorMessage)
        }
    })

    useEffect(() => {
        if (addresses.length > 0 && !selectedAddressId) {
            const defaultAddr = addresses.find((addr: any) => addr.isDefault)
            if (defaultAddr) {
                setSelectedAddressId(defaultAddr.id)
            }
        }
    }, [addresses, selectedAddressId])


    return (
        <div className="w-full bg-white">
            <div className="md:w-[80%] w-[95%] mx-auto min-h-screen">
                <div className="pb-[50px]">
                    <h1 className="md:pt-[50px] font-medium text-[44px] leading-[1] mb-[16px] font-jost">
                        Shopping Cart
                    </h1>
                    <Link href={"/"} className="text-[#55585b] hover:underline">
                        Home
                    </Link>
                    <span className="inline-block p-[1.5px] mx-1 bg-[#a8acb0] rounded-full"></span>
                    <span className="text-[#55585b]">Cart</span>
                </div>

                {cart?.length === 0 ? (
                    <div className="text-center text-gray-600 text-lg">
                        Your cart is empty! Start adding products.
                    </div>
                ) : (
                    <div className="lg:flex items-start gap-10">
                        <table className="w-full lg:w-[70%] border-collapse">
                            <thead className="bg-[#f1f3f4] rounded">
                                <tr>
                                    <th className="py-3 text-left pl-6 align-middle">Product</th>
                                    <th className="py-3 text-left align-middle">Price</th>
                                    <th className="py-3 text-left align-middle">Quantity</th>
                                    <th className="py-3 text-left align-middle"></th>
                                </tr>
                            </thead>
                            <tbody>
                                {cart?.map((item: any) => (
                                    <tr key={item.id} className="border-b border-b-[#0000000e]">
                                        <td className="flex items-center gap-4 p-4">
                                            <Image
                                                src={item?.images[0]?.url}
                                                alt={item.title}
                                                width={80}
                                                height={80}
                                                className="rounded"
                                            />
                                            <div className="flex flex-col">
                                                <span className="font-medium">{item.title}</span>
                                                {item?.selectedOptions && (
                                                    <div className="text-sm text-gray-500">
                                                        {item?.selectedOptions?.color && (
                                                            <span>
                                                                Color: { }
                                                                <span style={{
                                                                    backgroundColor: item?.selectedOptions?.color,
                                                                    width: "12px",
                                                                    height: "12px",
                                                                    borderRadius: "100%",
                                                                    display: "inline-block"
                                                                }} />
                                                            </span>
                                                        )}
                                                        {item?.selectedOptions.size && (
                                                            <span className="ml-2">
                                                                Size: {item?.selectedOptions?.size}
                                                            </span>
                                                        )}
                                                    </div>
                                                )}
                                            </div>
                                        </td>
                                        <td className="px-6 text-lg text-center">
                                            {item?.id === discountedProductId ? (
                                                <div className="flex flex-col items-center">
                                                    <span className="line-through text-gray-500 text-sm">
                                                        ${item.sale_price.toFixed(2)}
                                                    </span>
                                                    <span className="text-green-600 font-semibold">
                                                        ${((item.sale_price * (100 - discountPercent)) / 100).toFixed(2)}
                                                    </span>
                                                    <span className="text-xs text-green-700">
                                                        Discount Applied
                                                    </span>
                                                </div>
                                            ) : (
                                                <span>${item?.sale_price.toFixed(2)}</span>
                                            )}
                                        </td>
                                        <td>
                                            <div className="flex justify-center items-center border border-gray-200 rounded-[20px] w-[90px] p-[2px]">
                                                <button
                                                    className="text-black cursor-pointer text-xl"
                                                    onClick={() => decreaseQuantity(item.id)}
                                                >
                                                    -
                                                </button>
                                                <span className="px-4">{item?.quantity}</span>
                                                <button
                                                    className="text-black cursor-pointer text-xl"
                                                    onClick={() => increaseQuantity(item.id)}
                                                >
                                                    +
                                                </button>
                                            </div>
                                        </td>
                                        <td className="text-center">
                                            <button
                                                className="text-[#818487] cursor-pointer hover:text-[#ff1826] transition duration-200"
                                                onClick={() => removeItem(item?.id)}
                                            >
                                                x Remove
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>

                        <div className="p-6 shadow-md w-full lg:w-[30%] bg-[#f9f9f9] rounded-lg">

                            {/* ✅ Show original price + savings when coupon is applied */}
                            {savedAmount > 0 && (
                                <>
                                    <div className="flex justify-between items-center text-base pb-1">
                                        <span className="font-jost text-gray-500">Original</span>
                                        <span className="line-through text-gray-400">
                                            ${originalSubtotal.toFixed(2)}
                                        </span>
                                    </div>
                                    <div className="flex justify-between items-center text-base font-medium pb-1">
                                        <span className="font-jost text-green-600">
                                            Discount ({discountPercent}%)
                                        </span>
                                        <span className="text-green-600">
                                            - ${savedAmount.toFixed(2)}
                                        </span>
                                    </div>
                                </>
                            )}

                            {/* ✅ Subtotal now reflects discounted price */}
                            <div className="flex justify-between items-center text-[#010f1c] text-[20px] font-[550] pb-3">
                                <span className="font-jost">Subtotal</span>
                                <span>${subtotal.toFixed(2)}</span>
                            </div>
                            <hr className="my-4 text-slate-200" />

                            <div className="mb-4">
                                <h4 className="mb-[7px] font-[500] text-[15px]">
                                    Have a Coupon?
                                </h4>
                                <div>
                                    <div className="flex">
                                        <input
                                            type="text"
                                            value={couponCode}
                                            onChange={(e: any) => setCouponCode(e.target.value)}
                                            placeholder="Enter coupon code"
                                            className="w-full p-2 border border-gray-200 rounded-l-md focus:outline-none focus:border-blue-500"
                                        />
                                        <button
                                            className="bg-blue-500 cursor-pointer text-white px-4 rounded-r-md hover:bg-blue-600 transition-all disabled:opacity-60"
                                            onClick={() => couponMutation.mutate(couponCode)}
                                            disabled={couponMutation.isPending}
                                        >
                                            {couponMutation.isPending ? "Applying..." : "Apply"}
                                        </button>
                                    </div>
                                    {serverError && (
                                        <p className="text-sm pt-2 text-red-500">{serverError}</p>
                                    )}
                                    {/* ✅ Success message when coupon is applied */}
                                    {discountPercent > 0 && !serverError && (
                                        <p className="text-sm pt-2 text-green-600">
                                            ✓ Coupon applied! {discountPercent}% off
                                        </p>
                                    )}
                                </div>
                                <hr className="my-4 text-slate-200" />

                                <div className="mb-4">
                                    <h4 className="mb-[7px] font-medium text-[15px]">
                                        Select Shipping Address
                                    </h4>
                                    {addresses?.length !== 0 && (
                                        <select
                                            className="w-full p-2 border border-gray-200 rounded-md focus:outline-none focus:border-blue-500"
                                            value={selectedAddressId}
                                            onChange={(e) => setSelectedAddressId(e.target.value)}
                                        >
                                            {addresses?.map((address: any) => (
                                                <option key={address.id} value={address.id}>
                                                    {address.label} - {address.city}, {address.country}
                                                </option>
                                            ))}
                                        </select>
                                    )}
                                    {addresses?.length === 0 && (
                                        <p className="text-sm text-slate-800">
                                            Please add an address from profile to create an order
                                        </p>
                                    )}
                                </div>
                                <hr className="my-4 text-slate-200" />

                                <div className="mb-4">
                                    <h4 className="mb-[7px] font-[500] text-[15px]">
                                        Select Payment Method
                                    </h4>
                                    <select className="w-full p-2 border border-gray-200 rounded-md">
                                        <option value="credit_card">Online Payment</option>
                                        <option value="cash_on_delivery">Cash on Delivery</option>
                                    </select>
                                </div>
                                <hr className="my-4 text-slate-200" />

                                {/* ✅ Total reflects updated subtotal */}
                                <div className="flex justify-between items-center text-[#010f1c] text-[20px] font-[550] pb-3">
                                    <span className="font-jost">Total</span>
                                    <span>${subtotal.toFixed(2)}</span>
                                </div>

                                <button
                                    onClick={createPaymentSession}
                                    disabled={loading}
                                    className="w-full flex items-center justify-center gap-2 cursor-pointer mt-4 py-3 bg-[#010f1c] text-white hover:bg-[#0989FF] transition-all rounded-lg"
                                >
                                    {loading && <Loader2 className="animate-spin w-5 h-5" />}
                                    {loading ? "Redirecting..." : "Proceed to Checkout"}
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    )
}

export default CartPage
