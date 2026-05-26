"use client"

import { useWebSocket } from '@/context/web-socket-context'
import useSeller from '@/hooks/useSeller'
import ChatInput from '@/shared/components/chats/chatinput'
import axiosInstance from '@/utils/axiosInstance'
import { isProtected } from '@/utils/protected'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import Image from 'next/image'
import { useRouter, useSearchParams } from 'next/navigation'
import React, { useEffect, useRef, useState } from 'react'

const ChatPage = () => {
    const searchParams = useSearchParams()
    const router = useRouter()
    const messageContainerRef = useRef<HTMLDivElement | null>(null)
    const conversationId = searchParams.get("conversationId")
    const queryClient = useQueryClient()

    const { seller, isLoading: sellerLoading } = useSeller()
    const { ws } = useWebSocket()

    const [page, setPage] = useState(1)
    const [hasMore, setHasMore] = useState(1)
    const [chats, setChats] = useState<any[]>([])
    const [selectedChat, setSelectedChat] = useState<any | null>(null)
    const [message, setMessage] = useState("")
    const [hasFetchedOnce, setHasFetchedOnce] = useState(false)

    const { data: messages = [] } = useQuery({
        queryKey: ["messages", conversationId],
        queryFn: async () => {
            if (!conversationId || hasFetchedOnce) return []
            const res = await axiosInstance.get(
                `/chatting/api/get-seller-messages/${conversationId}?page=1`
            )
            setHasFetchedOnce(true)
            return res.data.messages.reverse()
        },
        enabled: !!conversationId,
        staleTime: 2 * 60 * 1000
    })

    const loadMoreMessages = async () => {
        const nextPage = page + 1
        const res = await axiosInstance.get(
            `/chatting/api/get-messages/${conversationId}?page=${nextPage}`,
            isProtected
        )

        queryClient.setQueryData(["messages", conversationId], (old: any = []) => [
            ...res.data.messages.reverse(),
            ...old
        ])
    }

    useEffect(() => {
        if (!conversationId || messages.length === 0) return
        const timeout = setTimeout(scrollToBottom, 100)
        return () => clearTimeout(timeout)
    }, [conversationId, message.length])

    useEffect(() => {
        if (conversationId && chats.length > 0) {
            const chat = chats.find((c) => c.conversationId === conversationId)
            setSelectedChat(chat || null)
        }
    }, [conversationId, chats])


    useEffect(() => {
        if (conversationId && chats.length > 0) {
            const chat = chats.find((c) => c.conversationId === conversationId)
            setSelectedChat(chat || null)
        }
    }, [conversationId, chats])

    const scrollToBottom = () => {
        requestAnimationFrame(() => {
            setTimeout(() => {
                const container = messageContainerRef.current
                if (container) {
                    container.scrollTop = container.scrollHeight
                }
            }, 50)
        })
    }

    const { data: conversations, isLoading } = useQuery({
        queryKey: ["conversations"],
        queryFn: async () => {
            const res = await axiosInstance.get(
                "/chatting/api/get-seller-conversations"
            )
            return res.data.conversations
        }
    })

    useEffect(() => {
        if (conversations) setChats(conversations)
    }, [conversations])

    console.log(chats);


    useEffect(() => {
        if (!ws) return

        ws.onmessage = (event: any) => {
            const data = JSON.parse(event.data)
            console.log("I am data", data);
            

            if (data.type === "NEW_MESSAGE") {
                const newMsg = data?.payload

                if (newMsg.conversationId === conversationId) {
                    queryClient.setQueryData(
                        ["messages", conversationId],
                        (old: any = []) => [
                            ...old,
                            {
                                content: newMsg.messageBody || newMsg.content || "",
                                senderType: newMsg.senderType,
                                seen: false,
                                createdAt: newMsg.createdAt || new Date().toISOString()
                            }
                        ]
                    )
                    scrollToBottom()
                }

                setChats((prevChats) =>
                    prevChats.map((chat) =>
                        chat.conversationId === newMsg.conversationId
                            ? { ...chat, lastMessage: newMsg.content || newMsg.messageBody }
                            : chat
                    )
                )
            }

            if (data.type === "UNSEEN_COUNT_UPDATE") {
                const { conversationId: convId, count } = data.payload
                setChats((prevChats) =>
                    prevChats.map((chat) =>
                        chat.conversationId === convId
                            ? { ...chat, unreadCount: count }
                            : chat
                    )
                )
            }
        }
    }, [ws, conversationId])


    const handleChatSelect = (chat: any) => {
        setSelectedChat(chat)
        setHasFetchedOnce(false)
        setChats((prev) =>
            prev.map((c) =>
                c.conversationId === chat.conversationId
                    ? { ...c, unreadCount: 0 }
                    : c
            )
        )
        router.push(`?conversationId=${chat.conversationId}`)

        if (ws && ws.readyState === WebSocket.OPEN) {
            ws.send(
                JSON.stringify({
                    type: "MARK_AS_SEEN",
                    conversationId: chat.conversationId
                })
            )
        }
    }

    const handleSend = (e: any) => {
        e.preventDefault()
        if (!message.trim() || !selectedChat || !ws || ws.readyState !== WebSocket.OPEN) return

        const payload = {
            fromUserId: seller.id,
            toUserId: selectedChat.user.id,
            messageBody: message,
            conversationId: selectedChat.conversationId,
            senderType: "seller"
        }

        ws.send(JSON.stringify(payload))

        queryClient.setQueryData(
            ["messages", selectedChat.conversationId],
            (old: any = []) => [
                ...old,
                {
                    content: payload.messageBody,
                    senderType: "seller",
                    seen: false,
                    createdAt: new Date().toISOString()
                }
            ]
        )

        setChats((prevChats) =>
            prevChats.map((chat) =>
                chat.conversationId
                    ? { ...chat, lastMessage: payload.messageBody }
                    : chat
            )
        )

        setMessage("")
        scrollToBottom()
    }



    return (
        <div className="w-full overflow-hidden">
            <div className="flex h-screen shadow-inner bg-gray-950 text-gray-50">
                {/* Sidebar */}
                <div className="w-[320px] border-r border-gray-800 bg-gray-950">
                    <div className="p-4 border-b border-gray-800 text-lg font-semibold">
                        Messages
                    </div>
                    <div className="divide-y divide-gray-900">
                        {isLoading ? (
                            <div className="text-center py-5 text-sm">
                                Loading ....
                            </div>
                        ) : chats.length === 0 ? (
                            <p className="text-center py-5 text-sm">
                                No conversation available yet!
                            </p>
                        ) : (
                            chats.map((chat) => {
                                const isActive = selectedChat?.conversationId === chat.conversationId

                                return (
                                    <button
                                        key={chat.conversationId}
                                        onClick={() => handleChatSelect(chat)}
                                        className={`w-full text-left px-4 py-3 transition ${isActive ? "bg-blue-950" : "hover:bg-gray-800"
                                            }`}
                                    >
                                        <div className="flex items-center gap-3">
                                            <Image
                                                src={selectedChat?.user?.avatar?.[0] || "https://ik.imagekit.io/shahriarbecodemy/avatar/6_t8b5y8t3U.png"}
                                                alt={chat.user?.name}
                                                width={36}
                                                height={36}
                                                className="rounded-full border w-[40px] h-[40px] object-cover"
                                            />
                                            <div className="flex-1">
                                                <div className="flex items-center justify-between">
                                                    <span className="text-sm font-semibold text-white">
                                                        {chat.user.name}
                                                    </span>
                                                    {chat.user.isOnline && (
                                                        <span className="w-2 h-2 rounded-full bg-green-500" />
                                                    )}
                                                </div>
                                                <div className="flex items-center justify-between">
                                                    <p className="text-xs text-gray-400 truncate max-w-[170px]">
                                                        {chat.lastMessage || ""} {" "}
                                                    </p>
                                                    {chat?.unreadCount > 0 && (
                                                        <span className="ml-2 text-[10px] bg-blue-600 text-white">
                                                            {chat?.unreadCount}
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                        </div>

                                    </button>
                                )
                            })
                        )}
                    </div>
                </div>
                {/* Chat Content */}
                <div className="flex flex-col flex-1 bg-gray-950">
                    {selectedChat ? (
                        <>
                            {/* Header */}
                            <div className="p-4 border-b border-gray-800 bg-gray-900 flex items-center">
                                <Image
                                    src={selectedChat?.user?.avatar?.[0] || "https://ik.imagekit.io/shahriarbecodemy/avatar/6_t8b5y8t3U.png"}
                                    alt={selectedChat?.user?.name}
                                    width={40}
                                    height={40}
                                    className="rounded-full border w-[40px] h-[40px] object-cover border-gray-500"
                                />
                                <div className="">
                                    <h2 className="text-white font-semibold text-base">
                                        {selectedChat.user?.name} {" "}
                                    </h2>
                                    <p className="text-xs text-gray-400">
                                        {selectedChat.user?.isOnline ? "Online" : "Offline"}
                                    </p>
                                </div>
                            </div>

                            {/* Messages */}
                            <div
                                className="flex-1 overflow-y-auto px-6 py-6 space-y-4 text-sm"
                                ref={messageContainerRef}
                            >
                                {messages?.map((msg: any, index: number) => (
                                    <div key={index}>
                                        <div
                                            className={`flex flex-col ${msg.senderType === "seller" ? "items-end ml-auto" : "items-start"
                                                } max-w-[80%]`}
                                        >
                                            <div
                                                className={
                                                    msg.senderType === "seller"
                                                        ? "bg-blue-600 text-white px-4 py-2 rounded-2xl rounded-tr-sm text-sm leading-relaxed"
                                                        : "bg-gray-100 text-gray-900 px-4 py-2 rounded-2xl rounded-tl-sm text-sm leading-relaxed"
                                                }
                                            >
                                                {msg.text || msg.content}
                                            </div>
                                        </div>
                                        <div
                                            className={`text-[11px] text-gray-400 mt-1 flex items-center gap-1 ${msg.senderType === "seller"
                                                ? "mr-1 justify-end"
                                                : "ml-1"
                                                }`}
                                        >
                                            {msg.time ||
                                                new Date(msg.createdAt).toLocaleTimeString([], {
                                                    hour: "2-digit",
                                                    minute: "2-digit"
                                                })
                                            }
                                        </div>
                                    </div>
                                ))}
                            </div>

                            {/* Input */}
                            <ChatInput
                                message={message}
                                setMessage={setMessage}
                                onSendMessage={handleSend}
                            />
                        </>
                    ) : (
                        <div className="flex-1 flex items-center justify-center text-gray-500 text-center">
                            Select a conversation to start chatting
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}

export default ChatPage