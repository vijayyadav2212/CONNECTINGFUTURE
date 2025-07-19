"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/src/components/ui/dialog"
import { Button } from "@/src/components/ui/button"
import { Input } from "@/src/components/ui/input"
import { Textarea } from "@/src/components/ui/textarea"
import { Label } from "@/src/components/ui/label"
import { Calendar } from "@/src/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/src/components/ui/popover"
import { CalendarIcon } from "lucide-react"
import { format } from "date-fns"

interface AMAModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function AMAModal({ open, onOpenChange }: AMAModalProps) {
  const [amaData, setAmaData] = useState({
    topic: "",
    description: "",
    duration: "60",
  })
  const [selectedDate, setSelectedDate] = useState<Date>()
  const [selectedTime, setSelectedTime] = useState("")

  const handleSubmit = () => {
    console.log("AMA scheduled:", { ...amaData, date: selectedDate, time: selectedTime })
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Host an AMA Session</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          <div>
            <Label htmlFor="ama-topic">Session Topic *</Label>
            <Input
              id="ama-topic"
              placeholder="e.g. Breaking into Tech Industry"
              value={amaData.topic}
              onChange={(e) => setAmaData({ ...amaData, topic: e.target.value })}
            />
          </div>

          <div>
            <Label htmlFor="ama-description">Description</Label>
            <Textarea
              id="ama-description"
              placeholder="Describe what you'll cover in this AMA session..."
              rows={4}
              value={amaData.description}
              onChange={(e) => setAmaData({ ...amaData, description: e.target.value })}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Date *</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="w-full justify-start text-left font-normal bg-transparent">
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {selectedDate ? format(selectedDate, "PPP") : "Pick a date"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar mode="single" selected={selectedDate} onSelect={setSelectedDate} initialFocus />
                </PopoverContent>
              </Popover>
            </div>
            <div>
              <Label htmlFor="ama-time">Time *</Label>
              <Input id="ama-time" type="time" value={selectedTime} onChange={(e) => setSelectedTime(e.target.value)} />
            </div>
          </div>

          <div>
            <Label htmlFor="duration">Duration (minutes)</Label>
            <select
              id="duration"
              className="w-full p-2 border border-slate-300 rounded-md"
              value={amaData.duration}
              onChange={(e) => setAmaData({ ...amaData, duration: e.target.value })}
            >
              <option value="30">30 minutes</option>
              <option value="60">1 hour</option>
              <option value="90">1.5 hours</option>
              <option value="120">2 hours</option>
            </select>
          </div>

          <div className="bg-blue-50 p-4 rounded-lg">
            <h4 className="font-medium text-blue-900 mb-2">What happens next?</h4>
            <ul className="text-sm text-blue-800 space-y-1">
              <li>• Students will be able to submit questions in advance</li>
              <li>• You'll receive a calendar invite with the session link</li>
              <li>• The session will be recorded for future reference</li>
            </ul>
          </div>

          <div className="flex justify-end gap-3">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button onClick={handleSubmit}>Schedule AMA</Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
