"use client"

import BreadCrumbs from '@/shared/breadcrumbs'
import axiosInstance from '@/utils/axiosInstance'
import { useQuery } from '@tanstack/react-query'
import React from 'react'

const Page = () => {
  const { data, isLoading } = useQuery({
     queryKey: ["notifications"],
     queryFn: async () => {
        const res = await axiosInstance.get("/seller/api/seller-notifications")
        return res.data.notifications
     }
  })  
  return (
    <div className="w-full min-h-screen p-8">
        <h2 className="text-2xl text-white font-semibold mb-2">Notifications</h2>

        <BreadCrumbs title="Notifications" />

        {!isLoading && data?.length === 0 && (
            <p className="text-center pt-24 text-white text-sm font-Poppins">
            No Notifications available yet!
        </p>
        )}
    </div>
  )
}

export default Page