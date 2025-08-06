"use client";

import { useState } from "react";
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Send, X } from "lucide-react";

interface MessageDialogProps {
  alumni: any;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSendMessage: (alumniId: number, message: string, subject?: string) => void;
}

export function MessageDialog({ 
  alumni, 
  open, 
  onOpenChange, 
  onSendMessage 
}: MessageDialogProps) {
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [isConnected, setIsConnected] = useState(false);

  const handleSend = () => {
    if (!message.trim()) return;
    
    onSendMessage(alumni.id, message, subject);
    setMessage("");
    setSubject("");
    onOpenChange(false);
  };

  if (!alumni) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Avatar className="w-12 h-12">
                <AvatarImage src={alumni.profilePicture} alt={alumni.name} />
                <AvatarFallback className="bg-blue-100 text-blue-600">
                  {alumni.name.split(' ').map((n: string) => n[0]).join('')}
                </AvatarFallback>
              </Avatar>
              <div>
                <DialogTitle className="text-lg">Send Message to {alumni.name}</DialogTitle>
                <p className="text-sm text-gray-600">{alumni.currentPosition} at {alumni.company}</p>
              </div>
            </div>
            {alumni.isConnected && (
              <Badge className="bg-green-100 text-green-800">Connected</Badge>
            )}
          </div>
        </DialogHeader>

        <div className="space-y-4 mt-4">
          {!alumni.isConnected && (
            <div className="bg-yellow-50 border border-yellow-200 p-4 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-yellow-600 font-medium">Connection Request</span>
              </div>
              <p className="text-sm text-yellow-700">
                Since you're not connected with {alumni.name}, your message will be sent as a connection request.
              </p>
              <div className="flex items-center gap-2 mt-2">
                <input 
                  type="checkbox" 
                  id="connect" 
                  checked={isConnected}
                  onChange={(e) => setIsConnected(e.target.checked)}
                  className="rounded"
                />
                <label htmlFor="connect" className="text-sm text-yellow-700">
                  Send connection request with this message
                </label>
              </div>
            </div>
          )}

          <div>
            <Label htmlFor="subject">Subject (Optional)</Label>
            <Input
              id="subject"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="Enter a subject for your message"
              className="mt-1"
            />
          </div>

          <div>
            <Label htmlFor="message">Message *</Label>
            <Textarea
              id="message"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder={alumni.isConnected 
                ? "Write your message here..." 
                : "Hi! I'd love to connect with you and learn more about your experience in..."
              }
              className="mt-1 min-h-[120px] resize-none"
              required
            />
            <p className="text-xs text-gray-500 mt-1">
              {message.length}/500 characters
            </p>
          </div>

          {/* Message Templates */}
          <div>
            <Label className="text-sm font-medium">Quick Templates:</Label>
            <div className="flex flex-wrap gap-2 mt-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setMessage("Hi! I'd love to connect and learn more about your experience in " + alumni.industry + ". I'm also working in a similar field and would appreciate any insights you might share.")}
              >
                Career Advice
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setMessage("Hello! I'm a fellow alumnus from " + alumni.branch + ". I'd love to connect and potentially collaborate on future projects or just catch up about our shared experiences.")}
              >
                Alumni Connection
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setMessage("Hi! I noticed we have similar backgrounds and I'd love to learn more about your journey at " + alumni.company + ". Would you be open to a brief conversation?")}
              >
                Networking
              </Button>
            </div>
          </div>

          <div className="flex gap-3 pt-4">
            <Button 
              onClick={handleSend}
              disabled={!message.trim()}
              className="flex-1 flex items-center gap-2"
            >
              <Send className="w-4 h-4" />
              {alumni.isConnected ? "Send Message" : "Send Request"}
            </Button>
            <Button 
              variant="outline" 
              onClick={() => onOpenChange(false)}
              className="flex items-center gap-2"
            >
              <X className="w-4 h-4" />
              Cancel
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
