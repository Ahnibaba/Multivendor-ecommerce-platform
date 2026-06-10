import SellerProfile from '@/app/shared/modules/seller/seller-profile'
import { Metadata } from 'next'

async function fetchSellerDetails(id: string) {
  const res = await fetch(
    `${process.env.NEXT_PUBLIC_SERVER_URI}/seller/api/get-seller/${id}`,
    {
      cache: 'no-store',
      headers: {
        'Content-Type': 'application/json',
      }
    }
  )

  if (!res.ok) throw new Error(`Failed to fetch seller: ${res.status}`)

  return res.json()
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

  const shop = data?.shop ?? null
  const followersCount: number = data?.followersCount ?? 0

  return (
    <div>
      <SellerProfile shop={shop} followersCount={followersCount} />
    </div>
  )
}

export default Page