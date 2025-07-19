"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import {
  Heart,
  GraduationCap,
  Calendar,
  Users,
  BookOpen,
  Trophy,
  Building,
  CreditCard,
  Wallet,
  Smartphone,
  Check,
  Info,
  Gift,
  Target,
  Zap,
} from "lucide-react"

interface DonationModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

const donationPurposes = [
  {
    id: "scholarship",
    name: "Scholarship Fund",
    icon: GraduationCap,
    description: "Support deserving students with financial aid",
    color: "bg-blue-100 text-blue-700 border-blue-200",
    impact: "Direct student support",
    suggested: [1000, 2500, 5000, 10000],
  },
  {
    id: "infrastructure",
    name: "Infrastructure Development",
    icon: Building,
    description: "Improve campus facilities and learning spaces",
    color: "bg-green-100 text-green-700 border-green-200",
    impact: "Long-term campus improvement",
    suggested: [5000, 10000, 25000, 50000],
  },
  {
    id: "events",
    name: "Event Sponsorship",
    icon: Calendar,
    description: "Fund tech fests, cultural events, and competitions",
    color: "bg-purple-100 text-purple-700 border-purple-200",
    impact: "Student engagement & networking",
    suggested: [2000, 5000, 10000, 20000],
  },
  {
    id: "research",
    name: "Research & Innovation",
    icon: BookOpen,
    description: "Support cutting-edge research projects",
    color: "bg-orange-100 text-orange-700 border-orange-200",
    impact: "Academic excellence",
    suggested: [3000, 7500, 15000, 30000],
  },
  {
    id: "sports",
    name: "Sports & Recreation",
    icon: Trophy,
    description: "Enhance sports facilities and programs",
    color: "bg-red-100 text-red-700 border-red-200",
    impact: "Student wellness & achievement",
    suggested: [1500, 3000, 7500, 15000],
  },
  {
    id: "alumni",
    name: "Alumni Network",
    icon: Users,
    description: "Strengthen alumni connections and programs",
    color: "bg-teal-100 text-teal-700 border-teal-200",
    impact: "Community building",
    suggested: [1000, 2000, 5000, 10000],
  },
]

const currencies = [
  { code: "INR", symbol: "₹", name: "Indian Rupee" },
  { code: "USD", symbol: "$", name: "US Dollar" },
  { code: "EUR", symbol: "€", name: "Euro" },
  { code: "GBP", symbol: "£", name: "British Pound" },
]

const paymentMethods = [
  { id: "card", name: "Credit/Debit Card", icon: CreditCard, description: "Visa, Mastercard, Amex" },
  { id: "wallet", name: "Digital Wallet", icon: Wallet, description: "PayPal, Google Pay, Apple Pay" },
  { id: "upi", name: "UPI", icon: Smartphone, description: "PhonePe, GPay, Paytm" },
  { id: "bank", name: "Bank Transfer", icon: Building, description: "Direct bank transfer" },
]

export function DonationModal({ open, onOpenChange }: DonationModalProps) {
  const [selectedPurpose, setSelectedPurpose] = useState<string>("scholarship")
  const [customAmount, setCustomAmount] = useState<string>("")
  const [selectedAmount, setSelectedAmount] = useState<number | null>(null)
  const [currency, setCurrency] = useState("INR")
  const [donorName, setDonorName] = useState("Arjun Kumar")
  const [donorEmail, setDonorEmail] = useState("arjun.kumar@example.com")
  const [isAnonymous, setIsAnonymous] = useState(false)
  const [message, setMessage] = useState("")
  const [paymentMethod, setPaymentMethod] = useState("card")
  const [isRecurring, setIsRecurring] = useState(false)
  const [recurringFrequency, setRecurringFrequency] = useState("monthly")

  const selectedPurposeData = donationPurposes.find((p) => p.id === selectedPurpose)
  const selectedCurrency = currencies.find((c) => c.code === currency)
  const finalAmount = selectedAmount || (customAmount ? Number.parseFloat(customAmount) : 0)

  const handleAmountSelect = (amount: number) => {
    setSelectedAmount(amount)
    setCustomAmount("")
  }

  const handleCustomAmountChange = (value: string) => {
    setCustomAmount(value)
    setSelectedAmount(null)
  }

  const handleDonate = () => {
    const donationData = {
      purpose: selectedPurpose,
      amount: finalAmount,
      currency,
      donorName: isAnonymous ? "Anonymous" : donorName,
      donorEmail,
      message,
      paymentMethod,
      isRecurring,
      recurringFrequency: isRecurring ? recurringFrequency : null,
    }

    console.log("Processing donation:", donationData)
    // Process donation logic here
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader className="pb-4">
          <DialogTitle className="text-2xl font-bold text-slate-900 flex items-center gap-2">
            <Heart className="w-6 h-6 text-red-500" />
            Make a Donation
          </DialogTitle>
          <p className="text-slate-600">Support your alma mater and help shape the future of education</p>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto space-y-6 pr-2">
          {/* Donation Purpose */}
          <div>
            <h3 className="text-lg font-semibold text-slate-900 mb-4">Choose Your Impact</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {donationPurposes.map((purpose) => {
                const Icon = purpose.icon
                const isSelected = selectedPurpose === purpose.id
                return (
                  <Card
                    key={purpose.id}
                    className={`cursor-pointer transition-all duration-200 ${
                      isSelected
                        ? "ring-2 ring-blue-500 bg-blue-50 border-blue-200"
                        : "hover:border-slate-300 hover:shadow-md"
                    }`}
                    onClick={() => setSelectedPurpose(purpose.id)}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-start gap-3">
                        <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${purpose.color}`}>
                          <Icon className="w-6 h-6" />
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center justify-between mb-2">
                            <h4 className="font-medium text-slate-900">{purpose.name}</h4>
                            {isSelected && (
                              <div className="w-5 h-5 bg-blue-500 rounded-full flex items-center justify-center">
                                <Check className="w-3 h-3 text-white" />
                              </div>
                            )}
                          </div>
                          <p className="text-sm text-slate-600 mb-2">{purpose.description}</p>
                          <Badge variant="outline" className="text-xs">
                            {purpose.impact}
                          </Badge>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          </div>

          {/* Amount Selection */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-slate-900">Donation Amount</h3>
              <div className="flex items-center gap-2">
                <Label className="text-sm text-slate-600">Currency:</Label>
                <select
                  value={currency}
                  onChange={(e) => setCurrency(e.target.value)}
                  className="p-2 border border-slate-300 rounded-md text-sm"
                >
                  {currencies.map((curr) => (
                    <option key={curr.code} value={curr.code}>
                      {curr.symbol} {curr.code}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Suggested Amounts */}
            {selectedPurposeData && (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
                {selectedPurposeData.suggested.map((amount) => (
                  <Button
                    key={amount}
                    variant={selectedAmount === amount ? "default" : "outline"}
                    className={`h-16 flex flex-col gap-1 ${
                      selectedAmount === amount ? "bg-blue-600 hover:bg-blue-700" : ""
                    }`}
                    onClick={() => handleAmountSelect(amount)}
                  >
                    <span className="text-lg font-bold">
                      {selectedCurrency?.symbol}
                      {amount.toLocaleString()}
                    </span>
                    <span className="text-xs opacity-75">Suggested</span>
                  </Button>
                ))}
              </div>
            )}

            {/* Custom Amount */}
            <div className="relative">
              <Label className="text-sm font-medium text-slate-700">Custom Amount</Label>
              <div className="relative mt-1">
                <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-500">
                  {selectedCurrency?.symbol}
                </span>
                <Input
                  type="number"
                  placeholder="Enter amount"
                  value={customAmount}
                  onChange={(e) => handleCustomAmountChange(e.target.value)}
                  className="pl-8"
                />
              </div>
            </div>

            {/* Recurring Donation */}
            <div className="mt-4 p-4 bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg border border-green-200">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <Zap className="w-5 h-5 text-green-600" />
                  <Label className="font-medium text-slate-900">Make this a recurring donation</Label>
                </div>
                <input
                  type="checkbox"
                  checked={isRecurring}
                  onChange={(e) => setIsRecurring(e.target.checked)}
                  className="w-4 h-4 text-green-600"
                />
              </div>
              {isRecurring && (
                <select
                  value={recurringFrequency}
                  onChange={(e) => setRecurringFrequency(e.target.value)}
                  className="w-full p-2 border border-green-300 rounded-md text-sm bg-white"
                >
                  <option value="monthly">Monthly</option>
                  <option value="quarterly">Quarterly</option>
                  <option value="annually">Annually</option>
                </select>
              )}
              <p className="text-sm text-green-700 mt-2">
                Recurring donations provide sustained support and maximize your impact
              </p>
            </div>
          </div>

          <Separator />

          {/* Donor Information */}
          <div>
            <h3 className="text-lg font-semibold text-slate-900 mb-4">Donor Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="donor-name">Full Name</Label>
                <Input
                  id="donor-name"
                  value={donorName}
                  onChange={(e) => setDonorName(e.target.value)}
                  disabled={isAnonymous}
                  className={isAnonymous ? "bg-slate-100" : ""}
                />
              </div>
              <div>
                <Label htmlFor="donor-email">Email Address</Label>
                <Input
                  id="donor-email"
                  type="email"
                  value={donorEmail}
                  onChange={(e) => setDonorEmail(e.target.value)}
                />
              </div>
            </div>

            <div className="mt-4 flex items-center gap-2">
              <input
                type="checkbox"
                id="anonymous"
                checked={isAnonymous}
                onChange={(e) => setIsAnonymous(e.target.checked)}
                className="w-4 h-4 text-blue-600"
              />
              <Label htmlFor="anonymous" className="text-sm text-slate-700">
                Make this donation anonymous
              </Label>
            </div>

            <div className="mt-4">
              <Label htmlFor="message">Personal Message (Optional)</Label>
              <Textarea
                id="message"
                placeholder="Share why this cause is important to you..."
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                rows={3}
                className="mt-1"
              />
            </div>
          </div>

          {/* Payment Method */}
          <div>
            <h3 className="text-lg font-semibold text-slate-900 mb-4">Payment Method</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {paymentMethods.map((method) => {
                const Icon = method.icon
                const isSelected = paymentMethod === method.id
                return (
                  <Card
                    key={method.id}
                    className={`cursor-pointer transition-all duration-200 ${
                      isSelected ? "ring-2 ring-blue-500 bg-blue-50 border-blue-200" : "hover:border-slate-300"
                    }`}
                    onClick={() => setPaymentMethod(method.id)}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-slate-100 rounded-lg flex items-center justify-center">
                          <Icon className="w-5 h-5 text-slate-600" />
                        </div>
                        <div className="flex-1">
                          <h4 className="font-medium text-slate-900">{method.name}</h4>
                          <p className="text-sm text-slate-600">{method.description}</p>
                        </div>
                        {isSelected && (
                          <div className="w-5 h-5 bg-blue-500 rounded-full flex items-center justify-center">
                            <Check className="w-3 h-3 text-white" />
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          </div>

          {/* Donation Summary */}
          <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200">
            <CardContent className="p-6">
              <h3 className="text-lg font-semibold text-slate-900 mb-4 flex items-center gap-2">
                <Gift className="w-5 h-5 text-blue-600" />
                Donation Summary
              </h3>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-slate-600">Purpose:</span>
                  <Badge className="bg-blue-100 text-blue-700">{selectedPurposeData?.name}</Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-600">Amount:</span>
                  <span className="text-xl font-bold text-slate-900">
                    {selectedCurrency?.symbol}
                    {finalAmount.toLocaleString()}
                    {isRecurring && <span className="text-sm font-normal"> / {recurringFrequency}</span>}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-600">Donor:</span>
                  <span className="font-medium text-slate-900">{isAnonymous ? "Anonymous" : donorName}</span>
                </div>
                {message && (
                  <div className="pt-2 border-t border-blue-200">
                    <p className="text-sm text-slate-600 italic">"{message}"</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Impact Information */}
          <div className="bg-green-50 p-4 rounded-lg border border-green-200">
            <div className="flex items-start gap-2">
              <Target className="w-5 h-5 text-green-600 mt-0.5" />
              <div>
                <h4 className="font-medium text-green-900 mb-2">Your Impact</h4>
                <p className="text-sm text-green-800">
                  Your donation to {selectedPurposeData?.name.toLowerCase()} will directly contribute to{" "}
                  {selectedPurposeData?.impact.toLowerCase()}. Every contribution makes a meaningful difference in the
                  lives of current and future students.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex justify-between items-center pt-6 border-t bg-white">
          <div className="flex items-center gap-2 text-sm text-slate-600">
            <Info className="w-4 h-4" />
            <span>Your donation is secure and tax-deductible</span>
          </div>
          <div className="flex gap-3">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleDonate}
              disabled={!finalAmount || finalAmount <= 0}
              className="bg-green-600 hover:bg-green-700"
            >
              <Heart className="w-4 h-4 mr-2" />
              Donate {selectedCurrency?.symbol}
              {finalAmount.toLocaleString()}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}