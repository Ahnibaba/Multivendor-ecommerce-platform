"use client"
import Link from 'next/link'
import React, { useState } from 'react'
import { Search } from "lucide-react"
import ProfileIcon from '@/assets/svgs/profile-icon'
import HeartIcon from '@/assets/svgs/heart-icon'
import CartIcon from '@/assets/svgs/cart-icon'
import HeaderBottom from './header-bottom'
import useUser from '@/hooks/useUser'
import axiosInstance from '@/utils/axiosInstance'
import { useStore } from '@/store'

const Header = () => {
  const { user, isLoading } = useUser()

  const wishlist = useStore((state) => state.wishlist)
  const cart = useStore((state) => state.cart)

  const [searchQuery, setSearchQuery] = useState("")
  const [suggestions, setSuggestions] = useState<any[]>([])
  const [loadingSuggestions, setLoadingSuggestions] = useState(false)


  const handleSearchClick = async () => {
     if (!searchQuery.trim()) return
     setLoadingSuggestions(true)
     try {
       const res = await axiosInstance.get(
         `/product/api/search-products?q=${encodeURIComponent(searchQuery)}`
       )
       setSuggestions(res.data.products.slice(0, 10))
     } catch (error) {
       console.log(error);
       
     }
  }

  return (
    <div className='w-full bg-white'>
      <div className="w-[80%] py-5 m-auto flex items-center justify-between">
        <div className="">
          <Link href={"/"}>
            <span className='text-2xl font-[500]'>Eshop</span>
          </Link>
        </div>
        <div className="w-[50%] relative">
          <input
            type="text"
            placeholder="Search for products..."
            className="w-full px-4 font-Poppins font-medium border-[2.5px] border-[#3489FF] outline-none h-[55px]"
          />
          <div className="w-[60px] cursor-pointer flex items-center justify-center h-[55px] bg-[#3489FF] absolute top-0 right-0">
            <Search color='#fff' />
          </div>
        </div>
        <div className="flex items-center gap-8">
          <div className="flex items-center gap-2">
            {!isLoading && user ? (
              <>
                <Link
                  href={"/profile"}
                  className="border-2 w-[50px] h-[50px] flex items-center justify-center rounded-full border-[#010f1c1a]"
                >
                  <ProfileIcon />
                </Link>
                <Link href={"/profile"}>
                  <span className="block font-medium">Hello,</span>
                  <span className="font-semibold">{user?.name?.split(" ")[0]}</span>
                </Link>
              </>
            ) : (
              <>
                <Link
                  href={"/login"}
                  className="border-2 w-[50px] h-[50px] flex items-center justify-center rounded-full border-[#010f1c1a]"
                >
                  <ProfileIcon />
                </Link>
                <Link href={"/login"}>
                  <span className="block font-medium">Hello,</span>
                  <span className="font-semibold">{isLoading ? "..." : "Sign In"}</span>
                </Link>
              </>
            )}

          </div>
          <div className="flex items-center gap-5">
            <Link
              href={"/wishlist"}
              className="relative"
            >
              <HeartIcon />
              <div className="w-6 h-6 border-2 border-white bg-red-500 rounded-full flex items-center justify-center absolute top-[-10px] right-[-10px]">
                <span className="text-white font-medium text-sm">
                  {wishlist?.length}
                </span>
              </div>
            </Link>
            <Link
              href={"/cart"}
              className="relative"
            >
              <CartIcon />
              <div className="w-6 h-6 border-2 border-white bg-red-500 rounded-full flex items-center justify-center absolute top-[-10px] right-[-10px]">
                <span className="text-white font-medium text-sm">
                  {cart?.length}
                </span>
              </div>
            </Link>
          </div>
        </div>
      </div>
      <div className="border-b border-b-[#99999938]" />
      <HeaderBottom />
    </div>
  )
}

export default Header