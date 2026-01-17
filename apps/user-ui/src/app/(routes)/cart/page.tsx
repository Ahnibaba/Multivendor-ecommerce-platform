"use client"
import useDeviceTracking from '@/hooks/useDeviceTracking'
import useLocationTracking from '@/hooks/useLocationTracking'
import useUser from '@/hooks/useUser'
import { useStore } from '@/store'
import Image from 'next/image'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import React, { useState } from 'react'

const CartPage = () => {
    const { user } = useUser()

    const [loading, setLoading] = useState(false)

    const router = useRouter()
    const location = useLocationTracking()
    const deviceInfo = useDeviceTracking()

    const cart = useStore((state) => state.cart)
    const removeFromCart = useStore((state) => state.removeFromCart)



    return (
        <div className="w-full bg-white">
            <div className="md:w-[80%] w-[95%] mx-auto min-h-screen">
                <div className="pb-[50px]">
                    <h1 className="md:pt-[50px] font-medium text-[44px] leading-[1] mb-[16px] font-jost">
                        Shopping Cart
                    </h1>
                    <Link
                        href={"/"}
                        className="text-[#55585b] hover:underline"
                    >
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
                                    <tr
                                        key={item.id}
                                        className="border-b border-b-[#0000000e]"
                                    >
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
                                                                }}
                                                              />
                                                                
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

                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

        </div>
    )
}

export default CartPage