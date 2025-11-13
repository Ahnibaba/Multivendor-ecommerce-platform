import Link from 'next/link'
import React from 'react'

const Header = () => {
  return (
    <div className='w-full bg-white'>
      <div className="w-[80%] py-5 m-auto flex items-center justify-center">
        <div className="">
          <Link href={"/"}>
            <span className='text-2xl font-[500]'>Eshop</span>
          </Link>
        </div>
      </div>
      <div className="w-[50%] relative">
        
      </div>
    </div>
  )
}

export default Header