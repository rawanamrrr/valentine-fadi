"use client"

import React, { useState, useEffect, useRef } from "react"

type ScratchCardProps = {
  brushRadius?: number
  onClick?: () => void
}

function ScratchCard({ brushRadius = 30, onClick }: ScratchCardProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const containerRef = useRef<HTMLDivElement | null>(null)
  const [isDrawing, setIsDrawing] = useState(false)
  const [hasScratched, setHasScratched] = useState(false)
  const totalAreaRef = useRef(0)
  const clearedAreaRef = useRef(0)

  useEffect(() => {
    const canvas = canvasRef.current
    const container = containerRef.current
    if (!canvas || !container) return

    const resize = () => {
      const rect = container.getBoundingClientRect()
      if (!rect.width || !rect.height) return

      totalAreaRef.current = rect.width * rect.height
      clearedAreaRef.current = 0

      const dpr = window.devicePixelRatio || 1
      canvas.width = rect.width * dpr
      canvas.height = rect.height * dpr

      const ctx = canvas.getContext("2d")
      if (!ctx) return

      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
      ctx.globalCompositeOperation = "source-over"
      ctx.fillStyle = "#d4d4d8"
      ctx.fillRect(0, 0, rect.width, rect.height)
    }

    resize()

    const handleResize = () => {
      resize()
    }

    window.addEventListener("resize", handleResize)
    return () => {
      window.removeEventListener("resize", handleResize)
    }
  }, [])

  const scratchAtPoint = (x: number, y: number) => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext("2d")
    if (!ctx) return

    ctx.globalCompositeOperation = "destination-out"
    ctx.beginPath()
    ctx.arc(x, y, brushRadius, 0, Math.PI * 2)
    ctx.fill()

    const circleArea = Math.PI * brushRadius * brushRadius
    clearedAreaRef.current += circleArea
  }

  const getPosition = (clientX: number, clientY: number) => {
    const canvas = canvasRef.current
    if (!canvas) return null

    const rect = canvas.getBoundingClientRect()
    return {
      x: clientX - rect.left,
      y: clientY - rect.top,
    }
  }

  const handlePointerDown = (
    event: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>,
  ) => {
    event.preventDefault()
    setIsDrawing(true)
    setHasScratched(true)

    if ("touches" in event) {
      const touch = event.touches[0]
      if (!touch) return
      const pos = getPosition(touch.clientX, touch.clientY)
      if (pos) scratchAtPoint(pos.x, pos.y)
    } else {
      const pos = getPosition(event.clientX, event.clientY)
      if (pos) scratchAtPoint(pos.x, pos.y)
    }
  }

  const handlePointerMove = (
    event: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>,
  ) => {
    if (!isDrawing) return
    event.preventDefault()

    if ("touches" in event) {
      const touch = event.touches[0]
      if (!touch) return
      const pos = getPosition(touch.clientX, touch.clientY)
      if (pos) scratchAtPoint(pos.x, pos.y)
    } else {
      const pos = getPosition(event.clientX, event.clientY)
      if (pos) scratchAtPoint(pos.x, pos.y)
    }
  }

  const endDrawing = () => {
    setIsDrawing(false)
  }

  const handleClick = () => {
    if (!onClick || !hasScratched) return

    const total = totalAreaRef.current
    if (total <= 0) {
      onClick()
      return
    }

    const progress = Math.min(clearedAreaRef.current / total, 1)
    if (progress >= 0.3) {
      onClick()
    }
  }

  return (
    <div ref={containerRef} className="relative w-full h-full">
      <canvas
        ref={canvasRef}
        className="absolute inset-0 w-full h-full touch-none"
        onMouseDown={handlePointerDown}
        onMouseMove={handlePointerMove}
        onMouseUp={endDrawing}
        onMouseLeave={endDrawing}
        onTouchStart={handlePointerDown}
        onTouchMove={handlePointerMove}
        onTouchEnd={endDrawing}
        onClick={handleClick}
      />
    </div>
  )
}

export default function Home() {
  const [digits, setDigits] = useState<string[]>(Array(4).fill("0"))
  const [isUnlocked, setIsUnlocked] = useState(false)
  const [showGift, setShowGift] = useState(false)
  const [selectedImage, setSelectedImage] = useState<string | null>(null)
  const [noPosition, setNoPosition] = useState({ top: 65, left: 50 })
  const [bootstrapped, setBootstrapped] = useState(false)
  const imagesScrollRef = useRef<HTMLDivElement | null>(null)
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const [isSongPlaying, setIsSongPlaying] = useState(false)
  const [currentSongImage, setCurrentSongImage] = useState("/song1.jpg")
  const [isDesktop, setIsDesktop] = useState(false)

  const getResponsiveImage = (src: string) => {
    if (!isDesktop) return src

    switch (src) {
      case "/lock.jpg":
        return "/lock-desktop.jpg"
      case "/gift.jpg":
        return "/gift-desktop.jpg"
      case "/images1.jpg":
        return "/images1-desktop.jpg"
      case "/message.jpg":
        return "/message-desktop.jpg"
      case "/song1.jpg":
        return "/song1-desktop.jpg"
      case "/song2.jpg":
        return "/song2-desktop.jpg"
      default:
        return src
    }
  }

  useEffect(() => {
    const updateIsDesktop = () => {
      if (typeof window === "undefined") return
      setIsDesktop(window.innerWidth >= 768)
    }

    updateIsDesktop()
    window.addEventListener("resize", updateIsDesktop)

    return () => {
      window.removeEventListener("resize", updateIsDesktop)
    }
  }, [])

  useEffect(() => {
    if (!bootstrapped) return
    if (typeof window === "undefined") return

    const imageSources = [
      "/lock.jpg",
      "/gift.jpg",
      "/images1.jpg",
      "/message.jpg",
      "/song1.jpg",
      "/song2.jpg",
    ]

    imageSources.forEach((src) => {
      const img = new Image()
      img.src = getResponsiveImage(src)
    })

    const questionImage = new Image()
    questionImage.src = "/question-desktop.jpg"

    const questionVideo = document.createElement("video")
    questionVideo.src = "/question.mp4"
    questionVideo.preload = "auto"

    const mainAudio = new Audio()
    mainAudio.src = "/song.mp3"
    mainAudio.preload = "auto"
  }, [bootstrapped, isDesktop])

  useEffect(() => {
    try {
      const storedState = sessionStorage.getItem("valentineState")

      if (storedState) {
        const parsed = JSON.parse(storedState) as any

        if (typeof parsed.isUnlocked === "boolean") {
          setIsUnlocked(parsed.isUnlocked)
        } else {
          const stored = sessionStorage.getItem("valentineUnlocked")
          if (stored === "1") {
            setIsUnlocked(true)
          }
        }

        if (typeof parsed.showGift === "boolean") {
          setShowGift(parsed.showGift)
        }

        if (typeof parsed.selectedImage === "string" && parsed.selectedImage) {
          const migratedImage =
            parsed.selectedImage === "/songs.jpg"
              ? "/song1.jpg"
              : parsed.selectedImage
          setSelectedImage(migratedImage)
        }
      } else {
        const stored = sessionStorage.getItem("valentineUnlocked")
        if (stored === "1") {
          setIsUnlocked(true)
        }
      }
    } catch {
      // ignore
    } finally {
      setBootstrapped(true)
    }
  }, [])

  useEffect(() => {
    try {
      const state = {
        isUnlocked,
        showGift,
        selectedImage,
      }
      sessionStorage.setItem("valentineState", JSON.stringify(state))
    } catch { }
  }, [isUnlocked, showGift, selectedImage])

  useEffect(() => {
    try {
      const stored = sessionStorage.getItem("valentineUnlocked")
      if (stored === "1") {
        setIsUnlocked(true)
      }
    } catch { }
  }, [])

  const handleDigitChange = (index: number, direction: "up" | "down") => {
    if (isUnlocked) return

    setDigits((prev) => {
      const next = [...prev]
      const current = parseInt(next[index] ?? "0", 10)
      const newDigit =
        direction === "up" ? (current + 1) % 10 : (current + 9) % 10
      next[index] = String(newDigit)
      const enteredCode = next.join("")
      if (enteredCode === "2511") {
        setIsUnlocked(true)
        try {
          sessionStorage.setItem("valentineUnlocked", "1")
        } catch { }
      }

      return next
    })
  }

  const moveNoButton = () => {
    if (!isUnlocked || showGift) return

    const top = 40 + Math.random() * 40
    const left = 20 + Math.random() * 60
    setNoPosition({ top, left })
  }

  const handleYesClick = () => {
    if (!isUnlocked) return
    setShowGift(true)
  }

  if (!bootstrapped) {
    return <main className="min-h-screen w-full bg-[#fff9f9]" />
  }

  return (
    <main className="min-h-screen w-full bg-[#fff9f9] relative overflow-hidden">
      {/* Hidden audio for early buffering */}
      <audio src="/song.mp3" preload="auto" className="hidden" />
      {/* Main Content */}
      {!isUnlocked ? (
        <div className="relative w-full h-screen">
          <img
            src={getResponsiveImage("/lock.jpg")}
            alt="Lock"
            className="absolute inset-0 w-full h-full object-cover"
          />
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 transform translate-y-10 sm:translate-y-20">
            <div className="flex gap-1 bg-white/80 px-2 py-1.5 rounded-3xl shadow-xl max-w-[92vw]">
              {digits.map((value, idx) => (
                <div
                  key={idx}
                  className="flex flex-col items-center gap-0.5 bg-white rounded-2xl px-1.5 py-1.5 shadow-md"
                >
                  <button
                    type="button"
                    className="text-[10px] sm:text-xs text-gray-700 leading-none"
                    onClick={() => handleDigitChange(idx, "up")}
                  >
                    ▲
                  </button>
                  <div className="text-sm sm:text-lg font-semibold text-gray-800 min-w-[1rem] text-center">
                    {value}
                  </div>
                  <button
                    type="button"
                    className="text-[10px] sm:text-xs text-gray-700 leading-none"
                    onClick={() => handleDigitChange(idx, "down")}
                  >
                    ▼
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      ) : !showGift ? (
        <div className="relative w-full h-screen">
          {isDesktop ? (
            <img
              src="/question-desktop.jpg"
              alt="Question"
              className="absolute inset-0 w-full h-full object-cover pointer-events-none"
            />
          ) : (
            <video
              src="/question.mp4"
              className="absolute inset-0 w-full h-full object-cover pointer-events-none"
              autoPlay
              muted
              loop
              playsInline
              controls={false}
            />
          )}
          <button
            type="button"
            onClick={() => {
              setIsUnlocked(false)
              setShowGift(false)
              setDigits(Array(4).fill("0"))
              setNoPosition({ top: 65, left: 50 })
              try {
                sessionStorage.removeItem("valentineUnlocked")
                sessionStorage.removeItem("valentineState")
              } catch { }
            }}
            className="absolute bottom-6 left-1/2 -translate-x-1/2 flex items-center gap-2 px-5 py-2.5 rounded-full bg-white/90 text-[#9b1412] text-xs sm:text-sm font-semibold tracking-[0.25em] uppercase shadow-lg backdrop-blur hover:bg-white hover:shadow-xl transition-all duration-200 z-30"
          >
            <span className="text-base sm:text-lg leading-none">↩</span>
            <span>GO BACK</span>
          </button>
          <div
            className={`absolute inset-0 flex flex-col items-center justify-end ${isDesktop ? "pb-24" : "pb-32"
              }`}
          >
            <div className="flex gap-6 justify-center">
              <button
                type="button"
                onClick={handleYesClick}
                className="w-[160px] h-[64px] md:w-[180px] md:h-[72px] flex items-center justify-center rounded-full bg-[#9b1412] hover:bg-[#7a0f0e] text-white text-xl md:text-2xl font-bold shadow-lg transition-colors"
              >
                Yes
              </button>
              <div className="flex items-center justify-center w-[160px] md:w-[180px]">
                <button
                  type="button"
                  onMouseEnter={moveNoButton}
                  onTouchStart={moveNoButton}
                  onClick={moveNoButton}
                  className="w-[160px] h-[64px] md:w-[180px] md:h-[72px] flex items-center justify-center rounded-full bg-gray-200 text-gray-800 text-xl md:text-2xl font-bold shadow-md transition-transform"
                  style={{
                    position:
                      noPosition.top === 65 && noPosition.left === 50
                        ? "static"
                        : "absolute",
                    top:
                      noPosition.top === 65 && noPosition.left === 50
                        ? "auto"
                        : `${noPosition.top}%`,
                    left:
                      noPosition.top === 65 && noPosition.left === 50
                        ? "auto"
                        : `${noPosition.left}%`,
                    transform:
                      noPosition.top === 65 && noPosition.left === 50
                        ? "none"
                        : "translate(-50%, -50%)",
                  }}
                >
                  No
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="relative w-full h-screen">
          {/* Static image background for before/after video */}
          <img
            src={getResponsiveImage("/gift.jpg")}
            alt="Gift"
            className="absolute inset-0 w-full h-full object-cover"
          />
          {!selectedImage && (
            <button
              type="button"
              onClick={() => {
                setShowGift(false)
                setSelectedImage(null)
              }}
              className="absolute bottom-6 left-1/2 -translate-x-1/2 flex items-center gap-2 px-5 py-2.5 rounded-full bg-white/90 text-[#9b1412] text-xs sm:text-sm font-semibold tracking-[0.25em] uppercase shadow-lg backdrop-blur hover:bg-white hover:shadow-xl transition-all duration-200 z-30"
            >
              <span className="text-base sm:text-lg leading-none">↩</span>
              <span>GO BACK</span>
            </button>
          )}
          <div className="absolute inset-0 z-10 pointer-events-none">
            {!isDesktop ? (
              <>
                <button
                  type="button"
                  aria-label="Open images"
                  className="absolute pointer-events-auto top-[32%] left-[14%] w-[30%] h-[18%]"
                  onClick={() => setSelectedImage("/images1.jpg")}
                />
                <button
                  type="button"
                  aria-label="Open message"
                  className="absolute pointer-events-auto top-[32%] right-[14%] w-[30%] h-[18%]"
                  onClick={() => setSelectedImage("/message.jpg")}
                />
                <button
                  aria-label="Open songs"
                  className="absolute pointer-events-auto top-[54%] left-1/2 -translate-x-1/2 w-[30%] h-[18%]"
                  onClick={() => {
                    setSelectedImage("/song1.jpg")
                    setIsSongPlaying(false)
                    setCurrentSongImage("/song1.jpg")
                  }}
                />
              </>
            ) : (
              <>
                <button
                  type="button"
                  aria-label="Open images"
                  className="absolute pointer-events-auto top-[52%] left-[7%] w-[17%] h-[28%]"
                  onClick={() => setSelectedImage("/images1.jpg")}
                />
                <button
                  type="button"
                  aria-label="Open message"
                  className="absolute pointer-events-auto top-[35%] left-1/2 -translate-x-1/2 w-[30%] h-[22%]"
                  onClick={() => setSelectedImage("/message.jpg")}
                />
                <button
                  type="button"
                  aria-label="Open songs"
                  className="absolute pointer-events-auto top-[62%] left-1/2 -translate-x-1/2 w-[30%] h-[22%]"
                  onClick={() => {
                    setSelectedImage("/song1.jpg")
                    setIsSongPlaying(false)
                    setCurrentSongImage("/song1.jpg")
                  }}
                />
              </>
            )}
          </div>

          {selectedImage && (
            <div className="absolute inset-0 z-20 bg-[#fff9f9] flex items-center justify-center">
              {selectedImage === "/images1.jpg" ? (
                <div
                  ref={imagesScrollRef}
                  className="relative w-full h-full overflow-y-auto"
                >
                  <img
                    src={getResponsiveImage("/images1.jpg")}
                    alt="Images part 1"
                    className="w-full h-auto block"
                  />
                </div>
              ) : selectedImage === "/song1.jpg" ? (
                <div className="relative w-full h-full">
                  <img
                    src={getResponsiveImage(currentSongImage)}
                    alt="Song artwork"
                    className="w-full h-full object-cover"
                  />
                  <div
                    className="absolute"
                    style={
                      isDesktop
                        ? {
                          top: "26%",
                          left: "29.5%",
                          width: "39%",
                          height: "50%",
                        }
                        : {
                          top: "35%",
                          left: "5%",
                          width: "90%",
                          height: "26%",
                        }
                    }
                  >
                    <ScratchCard
                      brushRadius={32}
                      onClick={() => {
                        const audio = audioRef.current
                        if (!audio) return

                        if (isSongPlaying) {
                          audio.pause()
                          audio.currentTime = 0
                          setIsSongPlaying(false)
                          setCurrentSongImage("/song1.jpg")
                        } else {
                          audio
                            .play()
                            .then(() => {
                              setIsSongPlaying(true)
                              setCurrentSongImage("/song2.jpg")
                            })
                            .catch(() => {
                              // ignore play errors (e.g. autoplay restrictions)
                            })
                        }
                      }}
                    />
                  </div>
                  <audio
                    ref={audioRef}
                    src="/song.mp3"
                    className="hidden"
                    onEnded={() => {
                      setIsSongPlaying(false)
                      setCurrentSongImage("/song1.jpg")
                    }}
                  />
                </div>
              ) : (
                <img
                  src={getResponsiveImage(selectedImage || "")}
                  alt="Gift detail"
                  className="w-full h-full object-cover"
                />
              )}
              <button
                type="button"
                onClick={() => {
                  if (selectedImage === "/song1.jpg") {
                    const audio = audioRef.current
                    if (audio) {
                      audio.pause()
                      audio.currentTime = 0
                    }
                    setIsSongPlaying(false)
                    setCurrentSongImage("/song1.jpg")
                  }
                  setSelectedImage(null)
                }}
                className="absolute left-1/2 bottom-6 -translate-x-1/2 flex items-center gap-2 px-5 py-2.5 rounded-full bg-white/90 text-[#9b1412] text-xs sm:text-sm font-semibold tracking-[0.25em] uppercase shadow-lg backdrop-blur hover:bg-white hover:shadow-xl transition-all duration-200 z-30"
              >
                <span className="text-base sm:text-lg leading-none">↩</span>
                <span>GO BACK</span>
              </button>
            </div>
          )}
        </div>
      )}
    </main>
  )
}