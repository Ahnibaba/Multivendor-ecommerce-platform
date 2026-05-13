"use client"

import axiosInstance from "@/utils/axiosInstance"
import Image from "next/image"
import { useEffect, useState } from "react"

const tabs = ["Categories", "Logo", "Banner"]

const Customization = () => {
    const [activeTab, setActiveTab] = useState("Categories")
    const [categories, setCategories] = useState<string[]>([])
    const [subCategories, setSubCategories] = useState<Record<string, string[]>>({})
    const [logo, setLogo] = useState<string | null>(null)
    const [banner, setBanner] = useState<string | null>(null)
    const [newCategory, setNewCategory] = useState("")
    const [newSubCategory, setNewSubCategory] = useState("")
    const [selectedCategory, setSelectedCategory] = useState("")

    useEffect(() => {
        const fetchCustomization = async () => {
            try {
                const res = await axiosInstance.get("/admin/api/get-all")
                const data = res.data
                setCategories(data.categories || [])
                setSubCategories(data.subCategories || {})
                setLogo(data.logo || null)
                setBanner(data.banner || null)
            } catch (error) {
                console.error("Failed to fetch customization data", error)
            }
        }
        fetchCustomization()
    }, [])

    const handleAddCategory = async () => {
        if (!newCategory.trim()) return
        try {
            await axiosInstance.post("/admin/api/add-category", {
                category: newCategory
            })
            setCategories((prev) => [...prev, newCategory])
            setNewCategory("")
        } catch (error) {
            console.error("Error adding category", error)
        }
    }

    const handleAddSubCategory = async () => {
        if (!newSubCategory.trim() || !selectedCategory) return 
        try {
            await axiosInstance.post("/admin/api/add-subcategory", {
                category: selectedCategory,
                subCategory: newSubCategory
            })
            setSubCategories((prev) => ({
                ...prev,
                [selectedCategory]: [...(prev[selectedCategory] || []), newSubCategory]
            }))
            setNewSubCategory("")
        } catch (error) {
            console.error("Error adding subcategory", error)
        }
    }

    return ( 
        <div className="w-full min-h-screen p-8 bg-black text-white text-sm">
            <h2 className="text-xl font-bold tracking-wide mb-6">Customization</h2>

            {/* Tabs */}
            <div className="flex gap-4 border-b border-gray-700 mb-6">
                {tabs.map((tab) => (
                    <button
                        key={tab}
                        onClick={() => setActiveTab(tab)}
                        className={`pb-2 text-sm font-medium transition ${
                            activeTab === tab
                                ? "border-b-2 border-blue-500 text-blue-400"
                                : "text-gray-400 hover:text-white"
                        }`}
                    >
                        {tab}
                    </button>
                ))}
            </div>

            {/* Tab Content */}
            <div className="mt-4 text-white">

                {/* Categories Tab */}
                {activeTab === "Categories" && (
                    <div className="space-y-6">
                        {/* Category List */}
                        <div className="space-y-4">
                            {categories.length === 0 ? (
                                <p className="text-gray-400">No categories found</p>
                            ) : (
                                categories.map((cat, idx) => (
                                    <div key={idx}>
                                        <p className="font-semibold mb-1">{cat}</p>
                                        {subCategories?.[cat]?.length > 0 ? (
                                            <ul className="ml-4 text-sm text-gray-400 list-disc">
                                                {subCategories[cat].map((sub, i) => (
                                                    <li key={i}>{sub}</li>
                                                ))}
                                            </ul>
                                        ) : (
                                            <p className="ml-4 text-xs text-gray-500 italic">
                                                No subcategories
                                            </p>
                                        )}
                                    </div>
                                ))
                            )}
                        </div>

                        {/* Add New Category */}
                        <div className="flex items-center gap-2 pt-4">
                            <input
                                type="text"
                                placeholder="New category"
                                value={newCategory}
                                onChange={(e) => setNewCategory(e.target.value)}  // ✅ fixed e
                                className="px-3 py-1 rounded-md outline-none text-sm bg-gray-800 text-white border border-gray-600"
                            />
                            <button
                                onClick={handleAddCategory}
                                className="text-sm bg-blue-600 hover:bg-blue-700 px-3 py-1 rounded-md"
                            >
                                Add Category
                            </button>
                        </div>

                        {/* Add Subcategory */}
                        <div className="flex items-center gap-2 flex-wrap pt-2">
                            <select
                                value={selectedCategory}
                                onChange={(e) => setSelectedCategory(e.target.value)}
                                className="bg-gray-800 outline-none text-white border border-gray-600 px-3 py-1 rounded-md"
                            >
                                <option value="">Select Category</option>
                                {categories.map((cat, i) => (
                                    <option key={i} value={cat}>
                                        {cat}
                                    </option>
                                ))}
                            </select>
                            <input
                                type="text"
                                placeholder="New Subcategory"
                                value={newSubCategory}
                                onChange={(e) => setNewSubCategory(e.target.value)}
                                className="px-3 py-1 rounded-md outline-none text-sm bg-gray-800 text-white border border-gray-600"
                            />
                            <button
                                onClick={handleAddSubCategory}
                                className="text-sm bg-blue-600 hover:bg-blue-700 px-3 py-1 rounded-md"
                            >
                                Add Subcategory
                            </button>
                        </div>
                    </div>
                )}

                {/* Logo Tab */}
                {activeTab === "Logo" && (
                    <div className="space-y-4">
                        {logo ? (
                            <Image
                                src={logo}
                                alt="Platform Logo"
                                width={120}        // ✅ required by Next.js Image
                                height={120}
                                className="border border-gray-600 p-2 bg-white rounded"
                            />
                        ) : (
                            <p className="text-gray-400">No logo uploaded</p>
                        )}
                        <input
                            type="file"
                            accept="image/*"
                            onChange={async (e) => {
                                const file = e.target.files?.[0]
                                if (!file) return
                                const formData = new FormData()
                                formData.append("file", file)
                                try {
                                    const res = await axiosInstance.post(
                                        "/admin/api/upload-logo",
                                        formData
                                    )
                                    setLogo(res.data.logo)
                                } catch (error) {
                                    console.error("Logo upload failed", error)
                                }
                            }}
                        />
                    </div>
                )}

                {/* Banner Tab */}
                {activeTab === "Banner" && (
                    <div className="space-y-4">
                        {banner ? (
                            <Image
                                src={banner}
                                alt="Platform Banner"
                                width={600}        // ✅ required by Next.js Image
                                height={200}
                                className="w-full max-w-[600px] h-auto border border-gray-600 rounded"
                            />
                        ) : (
                            <p className="text-gray-400">No banner uploaded</p>
                        )}
                        <input
                            type="file"
                            accept="image/*"
                            onChange={async (e) => {
                                const file = e.target.files?.[0]
                                if (!file) return
                                const formData = new FormData()
                                formData.append("file", file)
                                try {
                                    const res = await axiosInstance.post(
                                        "/admin/api/upload-banner",
                                        formData
                                    )
                                    setBanner(res.data.banner)
                                } catch (error) {
                                    console.error("Banner upload failed", error)
                                }
                            }}
                        />
                    </div>
                )}
            </div>
        </div>
    )
}

export default Customization