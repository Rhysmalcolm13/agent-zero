'use client'

import { useState, useCallback } from 'react'
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Send, Pause, Play } from "lucide-react"
import { MessageType } from "@/components/messages"

interface Log {
  id: string;
  type: MessageType;
  heading: string;
  content: string;
  kvps?: { [key: string]: string | string[] | undefined };
}

const API_URL = process.env.NEXT_PUBLIC_API_URL || '';

interface InputSectionProps {
  paused: boolean
  onPauseChange: (paused: boolean) => void
  contextId: string
  onMessageSent: (message: Log) => void
}

export default function InputSection({ paused, onPauseChange, contextId, onMessageSent }: InputSectionProps) {
  const [inputMessage, setInputMessage] = useState('')

  const handleSendMessage = useCallback(async () => {
    if (inputMessage.trim() && !paused) {
      try {
        const response = await fetch(`${API_URL}/msg`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ text: inputMessage, context: contextId, broadcast: 1 }),
        })
        if (!response.ok) {
          throw new Error('Network response was not ok')
        }
        const data = await response.json()
        if (data.ok) {
          const newMessage: Log = {
            id: data.id,
            type: 'user',
            heading: '',
            content: inputMessage,
            kvps: {}
          }
          onMessageSent(newMessage)
          setInputMessage('')
        } else {
          console.error('Failed to send message:', data.message)
        }
      } catch (error) {
        console.error('Failed to send message:', error)
      }
    }
  }, [inputMessage, contextId, onMessageSent, paused])

  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInputMessage(e.target.value)
  }, [])

  const handlePauseToggle = useCallback(() => {
    onPauseChange(!paused)
  }, [onPauseChange, paused])

  return (
    <div className="flex flex-col rounded-lg space-y-4 p-4 bg-background border-t">
      <Textarea
        value={inputMessage}
        onChange={handleInputChange}
        placeholder={paused ? "Agent is paused. Resume to send messages." : "Type your message here..."}
        className="min-h-[100px] resize-none"
        disabled={paused}
      />
      <div className="flex justify-between">
        <Button onClick={handlePauseToggle} variant="outline">
          {paused ? <Play className="mr-2 h-4 w-4" /> : <Pause className="mr-2 h-4 w-4" />}
          {paused ? "Resume" : "Pause"}
        </Button>
        <Button onClick={handleSendMessage} disabled={!inputMessage.trim() || paused}>
          <Send className="mr-2 h-4 w-4" /> Send Message
        </Button>
      </div>
    </div>
  )
}