'use client'

import React, { useEffect } from 'react'
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"

interface PreferencesProps {
  autoScroll: boolean
  setAutoScroll: (value: boolean) => void
  showThoughts: boolean
  setShowThoughts: (value: boolean) => void
  showJson: boolean
  setShowJson: (value: boolean) => void
  updateMessages: () => void
}

export default function Preferences({
  autoScroll,
  setAutoScroll,
  showThoughts,
  setShowThoughts,
  showJson,
  setShowJson,
  updateMessages
}: PreferencesProps) {
  useEffect(() => {
    updateMessages();
  }, [autoScroll, showThoughts, showJson, updateMessages]);

  return (
    <Card className="w-full max-w-sm">
      <CardHeader>
        <CardTitle>Preferences</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between">
          <Label htmlFor="auto-scroll" className="flex flex-col space-y-1">
            <span>Auto-scroll</span>
            <span className="font-normal text-sm text-muted-foreground">Automatically scroll to new content</span>
          </Label>
          <Switch
            id="auto-scroll"
            checked={autoScroll}
            onCheckedChange={(value) => {
              setAutoScroll(value);
              updateMessages();
            }}
          />
        </div>
        <div className="flex items-center justify-between">
          <Label htmlFor="show-thoughts" className="flex flex-col space-y-1">
            <span>Show Thoughts</span>
            <span className="font-normal text-sm text-muted-foreground">Display AI&apos;s thought process</span>
          </Label>
          <Switch
            id="show-thoughts"
            checked={showThoughts}
            onCheckedChange={(value) => {
              setShowThoughts(value);
              updateMessages();
            }}
          />
        </div>
        <div className="flex items-center justify-between">
          <Label htmlFor="show-json" className="flex flex-col space-y-1">
            <span>Show JSON</span>
            <span className="font-normal text-sm text-muted-foreground">Display raw JSON data</span>
          </Label>
          <Switch
            id="show-json"
            checked={showJson}
            onCheckedChange={(value) => {
              setShowJson(value);
              updateMessages();
            }}
          />
        </div>
      </CardContent>
    </Card>
  )
}