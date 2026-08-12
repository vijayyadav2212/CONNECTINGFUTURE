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
import { Checkbox } from "@/components/ui/checkbox";
import { Send, X, User, AlertCircle } from "lucide-react";

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
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto bg-white border-0 shadow-2xl">
        <DialogHeader className="space-y-4 pb-6 border-b border-gray-100">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-4">
              <Avatar className="w-16 h-16 border-4 border-gradient-to-br from-teal-100 to-teal-100 shadow-lg">
                <AvatarImage src={alumni.profilePicture} alt={alumni.name} />
                <AvatarFallback className="bg-gradient-to-br from-teal-500 to-teal-600 text-white font-bold text-lg">
                  {alumni.name.split(' ').map((n: string) => n[0]).join('')}
                </AvatarFallback>
              </Avatar>
              <div className="space-y-2">
                <DialogTitle className="text-xl font-bold text-gray-900 flex items-center gap-2">
                  <User className="w-5 h-5 text-teal-600" />
                  Send Message to {alumni.name}
                </DialogTitle>
                <p className="text-sm text-gray-700 font-semibold">
                  {alumni.currentPosition} at {alumni.company}
                </p>
                <div className="flex items-center gap-2">
                  <Badge variant="secondary" className="text-xs bg-gradient-to-r from-teal-100 to-teal-100 text-teal-800 border-teal-200">
                    {alumni.branch}
                  </Badge>
                  <Badge variant="outline" className="text-xs text-gray-600 border-gray-300">
                    Class of {alumni.graduationYear}
                  </Badge>
                </div>
              </div>
            </div>
            {alumni.isConnected && (
              <Badge className="bg-green-500/20 text-green-700 border-green-300/30 shadow-sm">
                Connected
              </Badge>
            )}
          </div>
        </DialogHeader>

        <div className="space-y-6 pt-4">
          {!alumni.isConnected && (
            <div className="bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 rounded-xl p-4 shadow-sm">
              <div className="flex items-start gap-3">
                <div className="p-1.5 bg-gradient-to-r from-amber-500 to-orange-500 rounded-md shadow-sm flex-shrink-0">
                  <AlertCircle className="w-4 h-4 text-white" />
                </div>
                <div className="space-y-3">
                  <div>
                    <h4 className="text-amber-800 font-bold text-sm">Connection Request</h4>
                    <p className="text-sm text-amber-700 mt-1 leading-relaxed">
                      Since you're not connected with {alumni.name}, your message will be sent as a connection request.
                    </p>
                  </div>
                  <div className="flex items-center space-x-3">
                    <Checkbox 
                      id="connect" 
                      checked={isConnected}
                      onCheckedChange={(checked) => setIsConnected(checked as boolean)}
                      className="border-amber-300 data-[state=checked]:bg-amber-600 data-[state=checked]:border-amber-600"
                    />
                    <label htmlFor="connect" className="text-sm text-amber-800 font-semibold cursor-pointer">
                      Send connection request with this message
                    </label>
                  </div>
                </div>
              </div>
            </div>
          )}

          <div className="space-y-3">
            <Label htmlFor="subject" className="text-sm font-bold text-gray-800 flex items-center gap-2">
              <span className="w-2 h-2 bg-teal-500 rounded-full"></span>
              Subject (Optional)
            </Label>
            <Input
              id="subject"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="Enter a subject for your message"
              className="h-12 border-gray-200 focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20 rounded-xl bg-white shadow-sm text-gray-900 placeholder:text-gray-500"
            />
          </div>

          <div className="space-y-3">
            <Label htmlFor="message" className="text-sm font-bold text-gray-800 flex items-center gap-2">
              <span className="w-2 h-2 bg-teal-500 rounded-full"></span>
              Message <span className="text-red-500 ml-1">*</span>
            </Label>
            <Textarea
              id="message"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder={alumni.isConnected 
                ? "Write your message here..." 
                : "Hi! I'd love to connect and learn more about your experience in Technology. I'm also working in a similar field and would appreciate any insights you might share."
              }
              className="min-h-[120px] resize-none border-gray-200 focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20 rounded-xl bg-white shadow-sm text-gray-900 placeholder:text-gray-500"
              maxLength={500}
              required
            />
            <div className="flex justify-between items-center">
              <p className="text-xs text-gray-500 font-medium">
                {message.length}/500 characters
              </p>
              {message.length > 450 && (
                <p className="text-xs text-amber-600 font-semibold bg-amber-50 px-2 py-1 rounded">
                  Approaching character limit
                </p>
              )}
            </div>
          </div>

          {/* Message Templates */}
          <div className="space-y-4">
            <Label className="text-sm font-bold text-gray-800 flex items-center gap-2">
              <span className="w-2 h-2 bg-teal-500 rounded-full"></span>
              Quick Templates:
            </Label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setMessage("Hi! I'd love to connect and learn more about your experience in " + (alumni.industry || "Technology") + ". I'm also working in a similar field and would appreciate any insights you might share.")}
                className="text-left justify-start h-auto py-3 px-4 text-xs font-semibold hover:bg-gradient-to-r hover:from-teal-50 hover:to-teal-50 hover:border-teal-200 hover:text-teal-700 transition-all duration-200 rounded-xl shadow-sm"
              >
                Career Advice
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setMessage("Hello! I'm a fellow alumnus from " + alumni.branch + ". I'd love to connect and potentially collaborate on future projects or just catch up about our shared experiences.")}
                className="text-left justify-start h-auto py-3 px-4 text-xs font-semibold hover:bg-gradient-to-r hover:from-green-50 hover:to-emerald-50 hover:border-green-200 hover:text-green-700 transition-all duration-200 rounded-xl shadow-sm"
              >
                Alumni Connection
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setMessage("Hi! I noticed we have similar backgrounds and I'd love to learn more about your journey at " + alumni.company + ". Would you be open to a brief conversation?")}
                className="text-left justify-start h-auto py-3 px-4 text-xs font-semibold hover:bg-gradient-to-r hover:from-teal-50 hover:to-pink-50 hover:border-teal-200 hover:text-teal-700 transition-all duration-200 rounded-xl shadow-sm"
              >
                Networking
              </Button>
            </div>
          </div>

          <div className="flex gap-4 pt-6 border-t border-gray-100">
            <Button 
              onClick={handleSend}
              disabled={!message.trim()}
              className="flex-1 h-12 bg-gradient-to-r from-teal-600 to-teal-600 hover:from-teal-700 hover:to-teal-700 text-white font-bold shadow-lg hover:shadow-xl transition-all duration-200 rounded-xl"
            >
              <Send className="w-4 h-4 mr-2" />
              {alumni.isConnected ? "Send Message" : "Send Request"}
            </Button>
            <Button 
              type="button"
              variant="outline" 
              onClick={() => onOpenChange(false)}
              className="h-12 px-8 border-gray-300 hover:bg-[#f6f3eb] hover:border-gray-400 font-semibold rounded-xl transition-all duration-200"
            >
              Cancel
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}