"use client"

import Image from "next/image"
import { useState } from "react"

export const ImageMagnifier = ({ src, containerRef }: {
    src: string,
    containerRef: React.RefObject<HTMLDivElement | null>
}) => {
    const [position, setPosition] = useState({ x: 0, y: 0 })
    const [showMagnifier, setShowMagnifier] = useState(false)
    const [panelPos, setPanelPos] = useState({ top: 0, left: 0, height: 0, width: 0 })

    return (
        <div className="relative w-full">
            <div
                className="relative w-full"
                onMouseEnter={() => setShowMagnifier(true)}
                onMouseLeave={() => setShowMagnifier(false)}
                onMouseMove={(e) => {
                    const { left, top, width, height, right } = e.currentTarget.getBoundingClientRect()
                    const container = containerRef.current?.getBoundingClientRect()

                    setPosition({
                        x: ((e.clientX - left) / width) * 100,
                        y: ((e.clientY - top) / height) * 100,
                    })
                    setPanelPos({
                        top: container?.top || top,
                        left: right + 10,
                        height: container?.height || height,
                        width: container?.width || width
                    })
                }}
            >
                <Image
                    src={src}
                    alt="Product Image"
                    width={600}
                    height={600}
                    className="w-full h-auto object-cover"
                />
                {showMagnifier && (
                    <div
                        className="fixed border border-gray-200 shadow-lg z-50 pointer-events-none overflow-hidden"
                        style={{
                            top: panelPos.top,
                            left: panelPos.left,
                            width: panelPos.width,
                            height: panelPos.height,
                        }}
                    >
                        <img
                            src={src}
                            style={{
                                width: "100%",
                                height: "100%",
                                objectFit: "contain",
                                transform: `scale(1.5)`,
                                transformOrigin: `${position.x}% ${position.y}%`,
                            }}
                        />
                    </div>
                )}
            </div>
        </div>
    )
}