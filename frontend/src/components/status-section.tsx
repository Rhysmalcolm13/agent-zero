'use client'

import { useEffect, useState } from 'react'
import { CheckCircle, XCircle } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { cn } from "@/lib/utils"

const API_URL = process.env.NEXT_PUBLIC_API_URL;

export function StatusSection() {
  const [connected, setConnected] = useState(false)

  useEffect(() => {
    const checkConnectionStatus = async () => {
      try {
        const response = await fetch(`${API_URL}/health`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        })
        if (!response.ok) {
          throw new Error('Network response was not ok')
        }
        const data = await response.json()
        setConnected(data.status === 'ok')
      } catch (error) {
        console.error('Failed to fetch connection status:', error)
        setConnected(false)
      }
    }

    checkConnectionStatus()
  }, [])

  return (
    <Card className="w-full max-w-[250px]">
      <CardContent className="p-3">
        <div className="flex flex-col space-y-2">
          <h3 className="text-sm font-medium text-muted-foreground">Connection Status</h3>
          <div
            className={cn(
              "flex items-center transition-colors duration-300 ease-in-out",
              connected ? "text-green-500" : "text-red-500"
            )}
            role="status"
            aria-live="polite"
          >
            {connected ? (
              <CheckCircle className="w-4 h-4 animate-pulse" />
            ) : (
              <XCircle className="w-4 h-4 animate-pulse" />
            )}
            <span className="ml-2 text-xs font-medium">
              {connected ? "Connected" : "Disconnected"}
            </span>
          </div>
          <div
            className={cn(
              "text-[10px] font-medium px-1.5 py-0.5 rounded-sm transition-colors duration-300 ease-in-out",
              connected ? "bg-green-500/20 text-green-700" : "bg-red-500/20 text-red-700"
            )}
          >
            {connected ? "System Online" : "System Offline"}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}