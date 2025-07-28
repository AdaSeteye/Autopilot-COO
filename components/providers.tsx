'use client'

import React, { createContext, useContext, useEffect, useState } from 'react'
import { createClient } from '@supabase/supabase-js'
import { ThemeProvider } from 'next-themes'

// Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// User context
interface User {
  id: string
  email: string
  full_name?: string
  avatar_url?: string
  subscription_tier?: 'free' | 'pro' | 'enterprise'
  created_at: string
}

interface UserContextType {
  user: User | null
  loading: boolean
  signIn: (email: string, password: string) => Promise<void>
  signUp: (email: string, password: string, fullName: string) => Promise<void>
  signOut: () => Promise<void>
  updateProfile: (updates: Partial<User>) => Promise<void>
}

const UserContext = createContext<UserContextType | undefined>(undefined)

export function UserProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Get initial session
    const getInitialSession = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      if (session?.user) {
        await fetchUserProfile(session.user.id)
      }
      setLoading(false)
    }

    getInitialSession()

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (session?.user) {
          await fetchUserProfile(session.user.id)
        } else {
          setUser(null)
        }
        setLoading(false)
      }
    )

    return () => subscription.unsubscribe()
  }, [])

  const fetchUserProfile = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', userId)
        .single()

      if (error) throw error
      setUser(data)
    } catch (error) {
      console.error('Error fetching user profile:', error)
    }
  }

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })
    if (error) throw error
  }

  const signUp = async (email: string, password: string, fullName: string) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
    })
    if (error) throw error

    // Create user profile
    if (data.user) {
      const { error: profileError } = await supabase
        .from('users')
        .insert({
          id: data.user.id,
          email: data.user.email!,
          full_name: fullName,
          subscription_tier: 'free',
        })
      if (profileError) throw profileError
    }
  }

  const signOut = async () => {
    const { error } = await supabase.auth.signOut()
    if (error) throw error
  }

  const updateProfile = async (updates: Partial<User>) => {
    if (!user) throw new Error('No user logged in')
    
    const { error } = await supabase
      .from('users')
      .update(updates)
      .eq('id', user.id)
    
    if (error) throw error
    
    setUser(prev => prev ? { ...prev, ...updates } : null)
  }

  return (
    <UserContext.Provider value={{
      user,
      loading,
      signIn,
      signUp,
      signOut,
      updateProfile,
    }}>
      {children}
    </UserContext.Provider>
  )
}

export function useUser() {
  const context = useContext(UserContext)
  if (context === undefined) {
    throw new Error('useUser must be used within a UserProvider')
  }
  return context
}

// AI Context for managing AI state
interface AIContextType {
  isGenerating: boolean
  setIsGenerating: (loading: boolean) => void
  lastSuggestion: string | null
  setLastSuggestion: (suggestion: string | null) => void
}

const AIContext = createContext<AIContextType | undefined>(undefined)

export function AIProvider({ children }: { children: React.ReactNode }) {
  const [isGenerating, setIsGenerating] = useState(false)
  const [lastSuggestion, setLastSuggestion] = useState<string | null>(null)

  return (
    <AIContext.Provider value={{
      isGenerating,
      setIsGenerating,
      lastSuggestion,
      setLastSuggestion,
    }}>
      {children}
    </AIContext.Provider>
  )
}

export function useAI() {
  const context = useContext(AIContext)
  if (context === undefined) {
    throw new Error('useAI must be used within an AIProvider')
  }
  return context
}

// Main providers wrapper
export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider
      attribute="class"
      defaultTheme="system"
      enableSystem
      disableTransitionOnChange
    >
      <UserProvider>
        <AIProvider>
          {children}
        </AIProvider>
      </UserProvider>
    </ThemeProvider>
  )
} 