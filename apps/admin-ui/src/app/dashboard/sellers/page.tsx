"use client"
import axiosInstance from '@/utils/axiosInstance';
import { useMutation, useQuery, useQueryClient, UseQueryResult } from '@tanstack/react-query';
import { flexRender, getCoreRowModel, getFilteredRowModel, getSortedRowModel, useReactTable } from '@tanstack/react-table';
import { Ban, Download, Search } from 'lucide-react';
import Image from 'next/image';
import React, { useDeferredValue, useMemo, useState } from 'react'

type Seller = {
    id: string;
    name: string;
    email: string;
    role: string;
    createdAt: string;
}

type SellersResponse = {
    data: Seller[];
    meta: {
        totalSellers: number;
    }
}

const SellerPage = () => {
    const [globalFilter, setGlobalFilter] = useState("")
    const [page, setPage] = useState(1)
    const [roleFilter, setRoleFilter] = useState("")
    const [selectedUser, setSelectedUser] = useState<Seller | null>(null)  // ✅ Fix 3
    const [isModalOpen, setIsModalOpen] = useState(false)
    const deferredGlobalFilter = useDeferredValue(globalFilter)
    const limit = 10

    const queryClient = useQueryClient()

    const { data, isLoading }: UseQueryResult<SellersResponse, Error> = useQuery<
        SellersResponse,
        Error,
        SellersResponse,
        [string, number]
    >({
        queryKey: ["sellers-list", page],
        queryFn: async () => {
            const res = await axiosInstance.get(
                `/admin/api/get-all-sellers?page=${page}&limit=${limit}`
            )
            return res.data
        },
        placeholderData: (previousData: any) => previousData,
        staleTime: 1000 * 60 * 5
    })

    const banUserMutation = useMutation({
        mutationFn: async (userId: string) => {
            await axiosInstance.put(`/admin/api/ban-user/${userId}`)
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["sellers-list"] })
            setIsModalOpen(false)
            setSelectedUser(null)
        }
    })

    const allSellers = data?.data || []
    const filteredSellers = useMemo(() => {
        return allSellers.filter((seller) => {
            const matchesRole = roleFilter
                ? seller.role.toLowerCase() === roleFilter.toLowerCase()
                : true
            const matchesGlobal = deferredGlobalFilter
                ? Object.values(seller)
                    .join(" ")
                    .toLowerCase()
                    .includes(deferredGlobalFilter.toLowerCase())
                : true
            return matchesRole && matchesGlobal
        })
    }, [allSellers, roleFilter, deferredGlobalFilter])

    const totalSellers = Math.ceil((data?.meta?.totalSellers ?? 0) / limit)

    const columns = useMemo(
        () => [
            {
                accessorKey: "shop.avatar",
                header: "Avatar",
                cell: ({ row }: any) => (
                    <Image
                      src={row.original.shop?.avatar[0] || "/default-avatar.png"}
                      alt={row.original.name}
                      width={40}
                      height={40}
                      className="rounded-full w-10 h-10 object-cover"
                    />
                )
            },
            {
                accessorKey: "name",
                header: "Name",
            },
            {
                accessorKey: "email",
                header: "Email",
            },
            {
               accessorKey: "shop.name",
               header: "Shop Name",
               cell: ({ row }: any) => {
                  const shopName = row.original.shop?.name
                  return shopName ? (
                     <a
                       href={`${process.env.NEXT_PUBLIC_USER_UI_LINK}/shop/${row.original.id}`}
                       target="_blank"
                       rel='noopener noreferrer'
                       className="text-blue-400 hover:underline"
                      >
                         {shopName}
                     </a>
                  ) : (
                     <span className="text-gray-400">No Shop</span>
                  )
               }
            },
            {
                accessorKey: "shop.address",
                header: "Address",
            },
            {
                accessorKey: "createdAt",
                header: "Joined",
                cell: ({ row }: any) => (
                    <span className="text-gray-400">
                        {new Date(row.original.createdAt).toLocaleDateString()}
                    </span>
                )
            },
          
        ],
        []
    )

    const table = useReactTable({
        data: filteredSellers,
        columns,
        getCoreRowModel: getCoreRowModel(),
        getSortedRowModel: getSortedRowModel(),
        getFilteredRowModel: getFilteredRowModel(),
        state: { globalFilter },
        onGlobalFilterChange: setGlobalFilter
    })

    const saveAs = (blob: Blob, filename: string) => {
        const url = URL.createObjectURL(blob)
        const link = document.createElement("a")
        link.href = url
        link.download = filename
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
        URL.revokeObjectURL(url)
    }

    const exportCSV = () => {
        const csvData = filteredSellers.map(
            (seller: any) =>
                `${seller.name},${seller.email},${seller.role},${seller.createdAt}`
        )
        const blob = new Blob(
            [`Name,Email,Role,Joined\n${csvData.join("\n")}`],
            { type: "text/csv;charset=utf-8" }
        )
        saveAs(blob, `sellers-page-${page}.csv`)
    }

    return (
        <div className="w-full min-h-screen p-8 bg-black text-white text-sm">

            <h2 className="text-xl font-bold tracking-wide">All Sellers</h2>

            <div className="flex justify-end gap-2 items-center mb-3">
                
                <button
                    onClick={exportCSV}
                    className="px-3 py-1 bg-green-600 hover:bg-green-700 text-white rounded-md flex items-center gap-2"  // ✅ Fix 2
                >
                    <Download size={16} /> Export CSV
                </button>

                <select
                    className="bg-gray-800 border border-gray-700 outline-none text-white px-3 py-1 rounded-md"
                    value={roleFilter}
                    onChange={(e) => setRoleFilter(e.target.value)}
                >
                    <option value="">All Roles</option>
                    <option value="admin">Admin</option>
                    <option value="user">User</option>
                </select>
            </div>

            {/* Search Bar */}
            <div className="mb-4 flex items-center bg-gray-900 p-2 rounded-md flex-1">
                <Search size={18} className="text-gray-400 mr-2" />
                <input
                    type="text"
                    placeholder="Search sellers..."
                    className="w-full bg-transparent text-white outline-none"
                    value={globalFilter}
                    onChange={(e) => setGlobalFilter(e.target.value)}
                />
            </div>

            <div className="overflow-x-auto bg-gray-900 rounded-lg p-4">
                {isLoading ? (
                    <p className="text-center text-white">Loading sellers...</p>
                ) : (
                    <table className="w-full text-white">
                        <thead>
                            {table.getHeaderGroups().map((headerGroup) => (
                                <tr key={headerGroup.id} className="border-b border-gray-800">
                                    {headerGroup.headers.map((header) => (
                                        <th key={header.id} className={`p-3 text-left ${header.id === "action" ? "text-center" : ""}`}>
                                            {header.isPlaceholder
                                                ? null
                                                : flexRender(
                                                    header.column.columnDef.header,
                                                    header.getContext()
                                                )
                                            }
                                        </th>
                                    ))}
                                </tr>
                            ))}
                        </thead>
                        <tbody>
                            {table.getRowModel().rows.map((row) => (
                                <tr
                                    key={row.id}
                                    className="border-b border-gray-800 hover:bg-gray-800 transition"
                                >
                                    {row.getVisibleCells().map((cell) => (
                                        <td key={cell.id} className="p-3">
                                            {flexRender(
                                                cell.column.columnDef.cell,
                                                cell.getContext()
                                            )}
                                        </td>
                                    ))}
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}

                <div className="flex justify-between items-center mt-4">
                    <button
                        className="px-4 py-2 bg-blue-600 rounded text-white hover:bg-blue-700 disabled:opacity-50"
                        onClick={() => setPage((prev) => Math.max(prev - 1, 1))}
                        disabled={page === 1}
                    >
                        Previous
                    </button>
                    <span className="text-gray-300">
                        Page {page} of {totalSellers || 1}
                    </span>
                    <button
                        className="px-4 py-2 bg-blue-600 rounded text-white hover:bg-blue-700 disabled:opacity-50"
                        onClick={() => setPage((prev) => prev + 1)}
                        disabled={page === totalSellers}
                    >
                        Next
                    </button>
                </div>

                {/* Ban Confirmation Modal */}
                {isModalOpen && selectedUser && (
                    <div className="fixed inset-0 bg-black bg-opacity-60 z-50 flex items-center justify-center">
                        <div className="bg-[#1e293b] rounded-2xl shadow-lg w-[90%] max-w-md p-6">
                            <div className="flex items-center gap-3 mb-4">
                                <h3 className="text-white text-lg font-semibold">Ban User</h3>
                            </div>
                            <div className="mb-6">
                                <p className="text-gray-300 leading-6">
                                    Are you sure you want to ban{" "}
                                    <span className="text-red-400 font-medium">
                                        {selectedUser.name}
                                    </span>
                                    ? This action can be reverted later.
                                </p>
                            </div>
                            <div className="flex justify-end gap-3">
                                <button
                                    onClick={() => setIsModalOpen(false)}
                                    className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-sm text-white rounded"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={() => banUserMutation.mutate(selectedUser.id)}
                                    className="px-4 py-2 bg-red-600 hover:bg-red-700 text-sm text-white rounded flex items-center gap-2"
                                >
                                    <Ban size={16} /> Confirm Ban
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    )
}

export default SellerPage