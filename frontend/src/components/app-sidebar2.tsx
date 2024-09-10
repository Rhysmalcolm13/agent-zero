'use client'

import { useState, useCallback } from 'react'
import { StatusSection } from './StatusSection'
import QuickActions from './quick-actions'
import { ChatList } from './chat-list'
import Preferences from './preferences'
import { Sidebar, SidebarContent, SidebarFooter, SidebarHeader, SidebarItem, SidebarLabel } from './ui/sidebar'

const API_URL = process.env.NEXT_PUBLIC_API_URL || '';

export function AppSidebar2() {
  const [selectedContext, setSelectedContext] = useState<string | null>(null)
  const [autoScroll, setAutoScroll] = useState(true)
  const [showThoughts, setShowThoughts] = useState(false)
  const [showJson, setShowJson] = useState(false)
  

  const selectChat = useCallback((contextId: string) => {
    setSelectedContext(contextId)
  }, [])

  const killChat = useCallback(async (id: string) => {
    try {
      const response = await fetch(`${API_URL}/remove`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ context: id }),
      })
      if (!response.ok) {
        throw new Error('Failed to remove chat')
      }
      const data = await response.json()
      if (data.ok) {
        if (id === selectedContext) {
          setSelectedContext(null)
        }
      } else {
        console.error('Failed to remove chat:', data.message)
      }
    } catch (error) {
      console.error('Error removing chat:', error)
    }
  }, [selectedContext])

  const resetChat = useCallback(async () => {
    if (!selectedContext) return
    try {
      const response = await fetch(`${API_URL}/reset`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ context: selectedContext }),
      })
      if (!response.ok) {
        throw new Error('Failed to reset agent')
      }
      const data = await response.json()
      if (data.ok) {
        // You might want to trigger a re-fetch of messages here
      } else {
        console.error('Failed to reset agent:', data.message)
      }
    } catch (error) {
      console.error('Error resetting agent:', error)
    }
  }, [selectedContext])

  const newChat = useCallback(async () => {
    try {
      const response = await fetch(`${API_URL}/reset`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      })
      if (!response.ok) {
        throw new Error('Failed to start new chat')
      }
      const data = await response.json()
      if (data.ok) {
        setSelectedContext(data.contextId)
      } else {
        console.error('Failed to start new chat:', data.message)
      }
    } catch (error) {
      console.error('Error starting new chat:', error)
    }
  }, [])

  return (
    <div className="flex h-screen">
      <Sidebar className="w-64">
        <SidebarHeader>
          <StatusSection />
        </SidebarHeader>
        <SidebarContent>
          <SidebarItem>
            <SidebarLabel>Quick Actions</SidebarLabel>
            <QuickActions resetChat={resetChat} newChat={newChat} />
          </SidebarItem>
          <SidebarItem>
            <SidebarLabel>Chats</SidebarLabel>
            <ChatList selectedContext={selectedContext} selectChat={selectChat} killChat={killChat} />
          </SidebarItem>
        </SidebarContent>
        <SidebarFooter>
          <SidebarItem>
            <SidebarLabel>Preferences</SidebarLabel>
            <Preferences 
              autoScroll={autoScroll} 
              setAutoScroll={setAutoScroll} 
              showThoughts={showThoughts} 
              setShowThoughts={setShowThoughts} 
              showJson={showJson} 
              setShowJson={setShowJson} 
              updateMessages={() => {}} 
            />
          </SidebarItem>
        </SidebarFooter>
      </Sidebar>
    </div>
  )
}