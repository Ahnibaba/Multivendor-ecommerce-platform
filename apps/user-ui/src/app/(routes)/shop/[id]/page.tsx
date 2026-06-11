import SellerProfile from '@/app/shared/modules/seller/seller-profile'
import { Metadata } from 'next'

import axiosInstance from "@/utils/axiosInstance"

async function fetchSellerDetails(id: string) {
  const res = await axiosInstance.get(`/seller/api/get-seller/${id}`)
  return res.data
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>
}): Promise<Metadata> {
  try {
    const { id } = await params
    const data = await fetchSellerDetails(id)
    const shop = data?.shop
    const avatarUrl = shop?.avatar?.[shop.avatar.length - 1] ?? '/default-shop.png'

    return {
      title: `${shop?.name} | Eshop Marketplace`,
      description: shop?.bio ?? 'Explore products and services from trusted sellers on Eshop.',
      openGraph: {
        type: 'website',
        description: shop?.bio ?? 'Explore products and services from trusted sellers on Eshop.',
        images: [{ url: avatarUrl, width: 800, height: 600, alt: shop?.name ?? 'Shop Logo' }],
      },
      twitter: {
        card: 'summary_large_image',
        title: `${shop?.name} | Eshop Marketplace`,
        description: shop?.bio ?? 'Explore products and services from trusted sellers on Eshop.',
        images: [avatarUrl],
      },
    }
  } catch {
    return {
      title: 'Eshop Marketplace',
      description: 'Explore products and services from trusted sellers on Eshop.',
    }
  }
}

const Page = async ({ params }: { params: Promise<{ id: string }> }) => {
  const { id } = await params
  const data = await fetchSellerDetails(id)

  console.log("SELLERSDATA", data);
  

  const shop = data?.seller.shop ?? null
  const followersCount: number = data?.followersCount ?? 0

  return (
    <div>
      <SellerProfile shop={shop} followersCount={followersCount} />
    </div>
  )
}

export default Page