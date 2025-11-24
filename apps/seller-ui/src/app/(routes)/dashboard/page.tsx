"use client"
import React from 'react'
import { useForm } from 'react-hook-form'

const Page = () => {
  const {
    register,
    control,
    watch,
    setValue,
    handleSubmit,
    formState: { errors } } = useForm()

    const onSubmit = (data: any) => {
      console.log(data);
      
    }
  return (
    <form
      className="w-full mx-auto p-8 shadow-md rounded-lg text-white"
      onSubmit={handleSubmit(onSubmit)}
    >

    </form>
  )
}

export default Page