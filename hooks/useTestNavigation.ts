import { useState, useEffect } from 'react'

interface UseTestNavigationProps {
  totalItems: number
  mobileItemsPerPage?: number
  tabletItemsPerPage?: number
  desktopItemsPerPage?: number
  autoAdvance?: boolean
  onAnswer?: () => void
}

export function useTestNavigation({
  totalItems,
  mobileItemsPerPage = 1,
  tabletItemsPerPage = 4,
  desktopItemsPerPage = 10,
  autoAdvance = true,
  onAnswer
}: UseTestNavigationProps) {
  const [windowWidth, setWindowWidth] = useState(typeof window !== 'undefined' ? window.innerWidth : 1024)
  const [currentIndex, setCurrentIndex] = useState(0)

  useEffect(() => {
    const handleResize = () => setWindowWidth(window.innerWidth)
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  const isMobile = windowWidth < 768
  const isTablet = windowWidth >= 768 && windowWidth < 1024

  const itemsPerPage = isMobile ? mobileItemsPerPage : isTablet ? tabletItemsPerPage : desktopItemsPerPage
  const totalPages = Math.ceil(totalItems / itemsPerPage)
  const currentPage = Math.floor(currentIndex / itemsPerPage)

  const startIndex = currentPage * itemsPerPage
  const endIndex = Math.min(startIndex + itemsPerPage, totalItems)

  const goNext = () => {
    if (currentPage < totalPages - 1) {
      setCurrentIndex((currentPage + 1) * itemsPerPage)
      window.scrollTo({ top: 0, behavior: 'smooth' })
    }
  }

  const goPrev = () => {
    if (currentPage > 0) {
      setCurrentIndex((currentPage - 1) * itemsPerPage)
      window.scrollTo({ top: 0, behavior: 'smooth' })
    }
  }

  const goToIndex = (index: number) => {
    setCurrentIndex(index)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const handleAnswer = () => {
    if (autoAdvance && isMobile && currentIndex < totalItems - 1) {
      setTimeout(() => setCurrentIndex(prev => prev + 1), 200)
    }
    if (onAnswer) onAnswer()
  }

  return {
    isMobile,
    isTablet,
    itemsPerPage,
    totalPages,
    currentPage,
    currentIndex,
    startIndex,
    endIndex,
    goNext,
    goPrev,
    goToIndex,
    setCurrentIndex,
    handleAnswer
  }
}
