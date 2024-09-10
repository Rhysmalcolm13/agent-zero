'use client'

import { useState, useCallback, useEffect } from 'react'
import ChatWindow from './ChatWindow'

export default function ChatInterface() {
  const [selectedContext, setSelectedContext] = useState<string | null>(null)
  const [paused, setPaused] = useState(false)
  const [refreshKey, setRefreshKey] = useState(0)
  const [error, setError] = useState<string | null>(null)

  const newChat = useCallback(() => {
    setSelectedContext('new-context-id') // Placeholder for new context ID
  }, [])

  const handlePauseChange = useCallback((newPausedState: boolean) => {
    setPaused(newPausedState)
  }, [])

  const refreshChat = useCallback(() => {
    setRefreshKey(prevKey => prevKey + 1)
  }, [])

  useEffect(() => {
    if (!selectedContext) {
      newChat()
    }
  }, [selectedContext, newChat])

  useEffect(() => {
    const intervalId = setInterval(() => {
      fetch('/api/reset', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ context: selectedContext }),
      })
        .then(response => {
          if (!response.ok) {
            throw new Error(`Network response was not ok: ${response.statusText}`)
          }
          return response.json()
        })
        .then(() => {
          refreshChat()
        })
        .catch(error => {
          setError(error.message)
        })
    }, 5000) // Refresh every 5 seconds

    return () => clearInterval(intervalId)
  }, [refreshChat, selectedContext])

  return (
    <main className="flex-1 overflow-hidden">
      {error && <div className="error">{error}</div>}
      {selectedContext && (
        <ChatWindow
            key={refreshKey}
            contextId={selectedContext}
            paused={paused}
            onPauseChange={handlePauseChange}
            newChat={newChat}
        />
      )}
    </main>
  )
}