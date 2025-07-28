import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatCurrency(amount: number, currency: string = 'USD') {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency,
  }).format(amount)
}

export function formatDate(date: string | Date) {
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }).format(new Date(date))
}

export function formatRelativeTime(date: string | Date) {
  const now = new Date()
  const target = new Date(date)
  const diffInSeconds = Math.floor((target.getTime() - now.getTime()) / 1000)
  
  const rtf = new Intl.RelativeTimeFormat('en', { numeric: 'auto' })
  
  if (Math.abs(diffInSeconds) < 60) {
    return rtf.format(diffInSeconds, 'second')
  } else if (Math.abs(diffInSeconds) < 3600) {
    return rtf.format(Math.floor(diffInSeconds / 60), 'minute')
  } else if (Math.abs(diffInSeconds) < 86400) {
    return rtf.format(Math.floor(diffInSeconds / 3600), 'hour')
  } else {
    return rtf.format(Math.floor(diffInSeconds / 86400), 'day')
  }
}

export function truncateText(text: string, length: number) {
  if (text.length <= length) return text
  return text.slice(0, length) + '...'
}

export function generateId() {
  return Math.random().toString(36).substr(2, 9)
}

export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout
  return (...args: Parameters<T>) => {
    clearTimeout(timeout)
    timeout = setTimeout(() => func(...args), wait)
  }
} 