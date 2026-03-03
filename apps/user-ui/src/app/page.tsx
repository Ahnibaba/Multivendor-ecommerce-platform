"use client"
import React from 'react'
import Hero from './shared/modules/hero'
import SectionTitle from './shared/components/section/section-title'
import { useQuery } from "@tanstack/react-query"
import axiosInstance from '@/utils/axiosInstance'
import ProductCard from './shared/components/cards/product-card'
import ShopCard from './shared/components/cards/shop.card'

const LoadingSkeleton = () => (
  <div className="grid grid-cols-1 sm:grid-cols-3 md:grid-cols-4 2xl:grid-cols-5 gap-5">
    {Array.from({ length: 10 }).map((_, index) => (
      <div key={index} className="h-[250px] bg-gray-300 animate-pulse rounded-xl" />
    ))}
  </div>
)

const Page = () => {
  const { data: products, isLoading, isError } = useQuery({
    queryKey: ["products"],
    queryFn: async () => {
      const res = await axiosInstance.get("/product/api/get-all-products?page=1&limit=10")
      return res.data.products
    },
    staleTime: 1000 * 60 * 2
  })

  const { data: latestProducts, isLoading: latestLoading } = useQuery({
    queryKey: ["latest-products"],
    queryFn: async () => {
      const res = await axiosInstance.get("/product/api/get-all-products?page=1&limit=10&type=latest")
      return res.data.products
    },
    staleTime: 1000 * 60 * 2
  })

  const { data: shops, isLoading: shopLoading } = useQuery({
    queryKey: ["shops"],
    queryFn: async () => {
      const res = await axiosInstance.get("/product/api/top-shops")
      return res.data.shops
    },
    staleTime: 2 * 60 * 1000
  })


  const { data: offers, isLoading: offersLoading } = useQuery({
     queryKey: ["offers"],
     queryFn: async () => {
        const res = await axiosInstance.get(
           "/product/api/get-all-events?page=1&limit=10"
        )
        return res.data.events
     },
     staleTime: 2 * 60 * 1000
  })

  return (
    <div className="bg-[#f5f5f5]">
      <Hero />
      <div className="md:w-[80%] w-[90%] my-10 m-auto">

        {/* Suggested Products */}
        <div className="mb-8">
          <SectionTitle title="Suggested Products" />
          {isLoading && <LoadingSkeleton />}
          {!isLoading && !isError && (
            <div className="grid grid-cols-1 sm:grid-cols-3 md:grid-cols-4 2xl:grid-cols-5 gap-5">
              {products?.map((product: any) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          )}
          {!isLoading && products?.length === 0 && (
            <p className="text-center">No Products available yet!</p>
          )}
        </div>

        {/* Latest Products */}
        <div className="mb-8">
          <SectionTitle title="Latest Products" />
          {latestLoading && <LoadingSkeleton />}
          {!latestLoading && (
            <div className="grid grid-cols-1 sm:grid-cols-3 md:grid-cols-4 2xl:grid-cols-5 gap-5">
              {latestProducts?.map((product: any) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          )}
          {!latestLoading && latestProducts?.length === 0 && (
            <p className="text-center">No products available!</p>
          )}
        </div>

        {/* Top Shops */}
        <div className="mb-8">
          <SectionTitle title="Top Shops" />
          {shopLoading && <LoadingSkeleton />}
          {!shopLoading && (
            <div className="grid grid-cols-1 sm:grid-cols-3 md:grid-cols-4 2xl:grid-cols-5 gap-5">
              {shops?.map((shop: any) => (
                <ShopCard key={shop.id} shop={shop} />
              ))}
            </div>
          )}

          {shops?.length === 0 && (
             <p className="text-center">No shops Available yet!</p>
          )}
        </div>

        {/* Top Offers */}
        <div className="my-8 block ">
           <SectionTitle title="Top offers" />

           {!offersLoading && !isError && (
             <div className="m-auto grid grid-cols-1 sm:grid-cols-3 md:grid-cols-4 2xl:grid-cols-5 gap-5">
                {offers?.map((event: any) => (
                   <ProductCard key={event?.id} product={event} />
                ))}
             </div>
           )}
        </div>

      </div>
    </div>
  )
}

export default Page