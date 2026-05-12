"use client"
import BreadCrumbs from "@/shared/components/breadcrumbs"
import axiosInstance from "@/utils/axiosInstance"
import { useQuery, UseQueryResult } from "@tanstack/react-query"
import { flexRender, getCoreRowModel, getFilteredRowModel, getSortedRowModel, useReactTable } from "@tanstack/react-table"
import { Download, Eye, Search } from "lucide-react"
import Image from "next/image"
import Link from "next/link"
import { useDeferredValue, useMemo, useState } from "react" 





const EventPage = () => {
    const [globalFilter, setGlobalFilter] = useState("")
    const deferredGlobalFilter = useDeferredValue(globalFilter)
    const [page, setPage] = useState(1)
    const limit = 10

    const { data, isLoading }: UseQueryResult<any> = useQuery({
        queryKey: ["all-events", page],
        queryFn: async () => {
            const res = await axiosInstance.get(
                `/admin/api/get-all-events?page=${page}&limit=${limit}`
            )
            return res.data
        },
        placeholderData: (prev: any) => prev,
        staleTime: 1000 * 60 * 5
    })

    const allEvents = data?.events || []
    const totalPages = Math.ceil((data?.meta?.totalEvents ?? 0) / limit)

    const filteredEvents = useMemo(() => {
        return allEvents.filter((event: any) =>
            Object.values(event)
                .join(" ")
                .toLowerCase()
                .includes(deferredGlobalFilter.toLowerCase())
        )
    }, [allEvents, deferredGlobalFilter])

    

    const columns = useMemo(
        () => [
            {
                accessorKey: "image",
                header: "Image",
                cell: ({ row }: any) => {
                    return (
                        <Image
                            src={row.original.images[0]?.url || "/placeholder.png"}
                            alt={row.original.title}
                            width={40}
                            height={40}
                            className="w-10 h-10 rounded object-cover"
                        />
                    )
                }
            },
            {
                accessorKey: "title",
                header: "Title",
                cell: ({ row }: any) => (
                    <Link
                        href={`${process.env.NEXT_PUBLIC_USER_UI_LINK}/product/${row.original.slug}`}
                        target="_blank"
                        className="text-blue-400 hover:underline"
                    >
                        {row.original.title}
                    </Link>
                )
            },
            {
                accessorKey: "sale_price",
                header: "Price",
                cell: ({ row }: any) => `$${row.original.sale_price}`
            },
            {
                accessorKey: "stock",
                header: "Stock",
                cell: ({ row }: any) => (
                    <span
                        className={row.original.stock < 10 ? "text-red-400" : "text-white"}
                    >
                        {row.original.stock} left
                    </span>
                )
            },
            {
                accessorKey: "starting_date",
                header: "Start",
                cell: ({ row }) => 
                  new Date(row.original.starting_date).toLocaleDateString()
            },
            {
                accessorKey: "ending_date",
                header: "End",
                cell: ({ row }) => 
                  new Date(row.original.ending_date).toLocaleDateString()
            },
            {
                accessorKey: "shops.name",
                header: "Shop Name",
                cell: ({ row }: any) => (
                    <span className="text-purple-400">{row.original.shops.name}</span>
                )
            },
        ],
        []
    )

    const table = useReactTable({
        data: filteredEvents,
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
        const csvData = filteredEvents.map(
            (p: any) =>
                `${p.title},${p.sale_price},${p.stock},${p.category},${p.ratings},${p.shops.name}`
        )
        const blob = new Blob(
            [`Title,Price,Stock,Category,Rating,Shop\n${csvData.join("\n")}`],
            { type: "text/csv;charset=utf-8" }
        )
        saveAs(blob, `products-page-${page}.csv`)
    }

    return (
        <div className="w-full min-h-screen p-8 bg-black text-white text-sm">
            <div className="flex justify-between items-center mb-3">
                <h2 className="text-xl font-bold tracking-wide">All Products</h2>
                <button
                    onClick={exportCSV}
                    className="px-3 py-1 bg-green-600 hover:bg-green-700 text-white rounded-md"
                >
                    <Download size={16} /> Export CSV
                </button>
            </div>


            {/* <BreadCrumbs title="All Products" /> */}

            <div className="my-4 flex items-center bg-gray-900 p-2 rounded-md flex-1">
                <Search size={18} className="text-gray-400 mr-2" />
                <input
                    type="text"
                    placeholder="Search products..."
                    className="w-full bg-transparent text-white outline-none"
                    value={globalFilter}
                    onChange={(e) => setGlobalFilter(e.target.value)}
                />
            </div>

            <div className="overflow-x-auto bg-gray-900 rounded-lg p-4">
                {isLoading ? (
                    <p className="text-center text-white">Loading events...</p>
                ) : (
                    <table className="w-full text-white">
                        <thead>
                            {table.getHeaderGroups().map((headerGroup) => (
                                <tr key={headerGroup.id} className="border-b border-gray-800">
                                    {headerGroup.headers.map((header) => (
                                        <th key={header.id} className="p-3 text-left">
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
                                    className="border-b border-gray-800 hover:bg-gray-900 transition"
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
                        className="px-4 py-2 bg-blue-600 rounded text-white hover:bg-blue-700"
                        onClick={() => setPage((prev) => Math.max(prev - 1, 1))}
                        disabled={page === 1}
                    >
                        Previous
                    </button>
                    <span className="text-gray-300">
                        Page {page} of {totalPages || 1}
                    </span>

                    <div className="flex justify-between items-center mt-4">
                        <button
                            className="px-4 py-2 bg-blue-600 rounded text-white hover:bg-blue-700"
                            onClick={() => setPage((prev) => prev + 1)}
                            disabled={page === totalPages}
                        >
                            Next
                        </button>
                    </div>
                </div>

            </div>
        </div>
    )
}


export default EventPage