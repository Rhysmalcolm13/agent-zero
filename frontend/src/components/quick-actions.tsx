'use client'

import { Button } from "@/components/ui/button"
import { RefreshCw, PlusCircle } from "lucide-react"
import { useState } from "react"

const API_URL = process.env.NEXT_PUBLIC_API_URL;

interface QuickActionsProps {
  resetChat: () => void
  newChat: () => void
}

export default function QuickActions({ resetChat, newChat }: QuickActionsProps) {
  const [loading, setLoading] = useState(false);

  const handleResetChat = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${API_URL}/reset`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      if (response.ok) {
        resetChat();
      } else {
        console.error('Failed to reset chat');
      }
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleNewChat = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${API_URL}/poll`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      if (response.ok) {
        newChat();
      } else {
        console.error('Failed to start new chat');
      }
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex space-x-2">
      <Button
        variant="outline"
        size="sm"
        className="text-xs"
        onClick={handleResetChat}
        disabled={loading}
      >
        <RefreshCw className="mr-2 h-3 w-3" />
        Reset Chat
      </Button>
      <Button
        variant="outline"
        size="sm"
        className="text-xs"
        onClick={handleNewChat}
        disabled={loading}
      >
        <PlusCircle className="mr-2 h-3 w-3" />
        New Chat
      </Button>
    </div>
  )
}