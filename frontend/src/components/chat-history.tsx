import React from 'react'
import { ScrollArea } from "@/components/ui/scroll-area"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Code } from 'lucide-react'

type MessageType = 'user' | 'agent' | 'response' | 'tool' | 'code_exe' | 'warning' | 'error' | 'info' | 'adhoc'

interface Message {
  type: MessageType
  content: string
  sender?: string
}

interface ChatHistoryProps {
  messages: Message[]
}

export default function ChatHistory({ messages }: ChatHistoryProps) {
  const getMessageStyle = (type: MessageType) => {
    switch (type) {
      case 'user':
        return 'bg-primary text-primary-foreground'
      case 'agent':
        return 'bg-secondary text-secondary-foreground'
      case 'response':
        return 'bg-accent text-accent-foreground'
      case 'tool':
        return 'bg-muted text-muted-foreground'
      case 'code_exe':
        return 'bg-card text-card-foreground'
      case 'warning':
        return 'bg-warning text-warning-foreground'
      case 'error':
        return 'bg-destructive text-destructive-foreground'
      case 'info':
        return 'bg-info text-info-foreground'
      case 'adhoc':
        return 'bg-popover text-popover-foreground'
      default:
        return 'bg-background text-foreground'
    }
  }

  const renderMessage = (message: Message, index: number) => {
    const baseClasses = `p-4 rounded-lg mb-4 ${getMessageStyle(message.type)}`

    switch (message.type) {
      case 'user':
      case 'agent':
        return (
          <div key={index} className={`flex items-start ${baseClasses}`}>
            <Avatar className="mr-4">
              <AvatarImage src={message.type === 'user' ? '/user-avatar.png' : '/agent-avatar.png'} />
              <AvatarFallback>{message.type === 'user' ? 'U' : 'A'}</AvatarFallback>
            </Avatar>
            <div>
              <p className="font-semibold">{message.sender || (message.type === 'user' ? 'User' : 'Agent')}</p>
              <p>{message.content}</p>
            </div>
          </div>
        )
      case 'code_exe':
        return (
          <div key={index} className={`${baseClasses}`}>
            <div className="flex items-center mb-2">
              <Code className="mr-2" />
              <span className="font-semibold">Code Execution</span>
            </div>
            <pre className="whitespace-pre-wrap">{message.content}</pre>
          </div>
        )
      case 'warning':
      case 'error':
      case 'info':
        return (
          <Alert key={index} variant={message.type as 'default' | 'destructive' | null | undefined}>
            <AlertTitle className="capitalize">{message.type}</AlertTitle>
            <AlertDescription>{message.content}</AlertDescription>
          </Alert>
        )
      default:
        return (
          <div key={index} className={baseClasses}>
            <p>{message.content}</p>
          </div>
        )
    }
  }

  return (
    <ScrollArea className="h-[600px] w-full rounded-md border p-4">
      {messages.map((message, index) => renderMessage(message, index))}
    </ScrollArea>
  )
}