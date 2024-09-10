'use client'

import React, { useEffect, useState } from 'react'
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { X } from "lucide-react"

const API_URL = process.env.NEXT_PUBLIC_API_URL;

interface ChatContext {
  id: string
  no: number
  paused: boolean
}

interface ChatListProps {
  selectedContext: string | null
  selectChat: (id: string) => void
  killChat: (id: string) => void
}

export function ChatList({ selectedContext, selectChat, killChat }: ChatListProps) {
  const [contexts, setContexts] = useState<ChatContext[]>([]);

  useEffect(() => {
    const fetchChatList = async () => {
      try {
        const response = await fetch(`${API_URL}/poll`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ context: '', log_from: 0 }),
        });
        if (response.ok) {
          const data = await response.json();
          if (data.ok) {
            setContexts(data.contexts);
          } else {
            console.error('Failed to fetch chat list:', data.message);
          }
        } else {
          console.error('Failed to fetch chat list');
        }
      } catch (error) {
        console.error('Error fetching chat list:', error);
      }
    };

    fetchChatList();
    const intervalId = setInterval(fetchChatList, 60000); // Poll every second

    return () => clearInterval(intervalId);
  }, []);

  return (
    <ScrollArea className="max-h-[calc(100vh-4rem)] w-full">
      <div className="space-y-2 p-4">
        {contexts.map((context) => (
          <div
            key={context.id}
            className={`flex items-center justify-between rounded-lg p-2 ${
              selectedContext === context.id ? 'bg-primary text-primary-foreground' : 'hover:bg-muted'
            }`}
          >
            <Button
              variant="ghost"
              className="w-full justify-start text-left"
              onClick={() => selectChat(context.id)}
            >
              Chat #{context.no} {context.paused ? '(Paused)' : ''}
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={(e) => {
                e.stopPropagation()
                killChat(context.id)
              }}
            >
              <X className="h-4 w-4" />
              <span className="sr-only">Delete chat</span>
            </Button>
          </div>
        ))}
      </div>
    </ScrollArea>
  )
}