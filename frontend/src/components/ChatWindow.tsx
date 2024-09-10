'use client'

import { useState, useEffect, useCallback } from 'react'
import { ScrollArea } from "@/components/ui/scroll-area"
import { Card, CardContent } from "@/components/ui/card"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { AlertCircle } from "lucide-react"
import { getHandler, MessageType } from "@/components/messages"
import InputSection from "@/components/input-section"

interface ChatWindowProps {
  contextId: string
  paused: boolean
  onPauseChange: (paused: boolean) => void
  newChat: () => void
}

interface Log {
  id: string;
  type: MessageType;
  heading: string;
  content: string;
  kvps?: { [key: string]: string | string[] | undefined };
}

const API_URL = process.env.NEXT_PUBLIC_API_URL || '';

export default function ChatWindow({ contextId, paused, onPauseChange }: ChatWindowProps) {
  const [messages, setMessages] = useState<Log[]>([])
  const [connectionError, setConnectionError] = useState<string | null>(null)
  const [lastLogVersion, setLastLogVersion] = useState(0)

  const fetchMessages = useCallback(async () => {
    if (!contextId) return;

    try {
      const response = await fetch(`${API_URL}/poll`, {
        method: 'POST', // Changed from GET to POST
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          context: contextId,
          log_from: lastLogVersion,
        }),
      })
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Network response was not ok: ${errorText}`);
      }
      const data = await response.json()
      if (data.ok) {
        setMessages(prevMessages => [...prevMessages, ...data.logs])
        setLastLogVersion(data.log_version)
      } else {
        console.error('Failed to fetch messages:', data.message)
      }
    } catch (error: unknown) {
      if (error instanceof Error) {
        if (error.message.includes('405')) {
          setConnectionError('Failed to fetch messages: Method Not Allowed. The method is not allowed for the requested URL.');
        } else {
          setConnectionError(`Failed to fetch messages: ${error.message}`);
        }
      } else {
        setConnectionError('Failed to fetch messages due to an unexpected error');
      }
      console.error('Failed to fetch messages:', error)
    }
  }, [contextId, lastLogVersion])

  useEffect(() => {
    fetchMessages()
    const intervalId = setInterval(fetchMessages, 1000) // Poll every 50 seconds

    return () => clearInterval(intervalId)
  }, [fetchMessages])

  useEffect(() => {
    setMessages([])
    setLastLogVersion(0)
  }, [contextId])

  const handleMessageSent = useCallback((message: Log) => {
    setMessages(prevMessages => [...prevMessages, message])
  }, [])

  const handlePauseChange = useCallback(async (newPausedState: boolean) => {
    try {
      const response = await fetch(`${API_URL}/pause`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ paused: newPausedState, context: contextId }),
      })
      if (!response.ok) {
        throw new Error('Failed to pause/unpause agent')
      }
      const data = await response.json()
      if (data.ok) {
        onPauseChange(data.pause)
      } else {
        console.error('Failed to pause/unpause agent:', data.message)
      }
    } catch (error: unknown) {
      if (error instanceof Error) {
        console.error('Error pausing/unpausing agent:', error)
        setConnectionError(`Failed to pause/unpause agent: ${error.message}`)
      } else {
        console.error('Unexpected error pausing/unpausing agent:', error)
        setConnectionError('Failed to pause/unpause agent due to an unexpected error')
      }
    }
  }, [contextId, onPauseChange])

  return (
    <Card className="flex-grow flex flex-col h-full">
      <CardContent className="flex flex-col h-full p-4">
        {connectionError && (
          <Alert variant="destructive" className="mb-4">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>{connectionError}</AlertDescription>
          </Alert>
        )}
        <ScrollArea className="flex-grow mb-4">
          {messages.map((message, index) => {
            const MessageHandler = getHandler(message.type);
            return (
              <div key={index} ref={(el) => { if (el) MessageHandler(el, message.id, message.type, message.heading, message.content, message.kvps); }} />
            );
          })}
        </ScrollArea>
        <InputSection 
          paused={paused} 
          onPauseChange={handlePauseChange} 
          contextId={contextId}
          onMessageSent={handleMessageSent}
        />
      </CardContent>
    </Card>
  )
}