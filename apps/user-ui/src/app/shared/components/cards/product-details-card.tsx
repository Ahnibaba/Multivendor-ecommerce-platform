import React from 'react'

const ProductDetailsCard = ({ data, setOpen }: { data: any, setOpen: (open: boolean) => void }) => {
  return (
    <div
      className="fixed flex items-center justify-center top-0 left-0 h-screen w-full bg-[#0000001d] z-50"
      onClick={() => setOpen(false)}
    >
      <div className="w-[90%] md:w-[70%] md:mt-14 2xl:mt-0 h-max overlow-scroll min-h-[70vh] p-4 md:p-6 bg-white shadow-md rounded-lg"></div>  
    </div>
  )
}

export default ProductDetailsCard