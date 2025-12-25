"use client"

import * as React from "react"
import { getToolByPath } from "@/lib/tools"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Copy, RefreshCw, CheckCircle2, XCircle } from "lucide-react"
import { toast } from "sonner"

// TOTP implementation
function generateTOTP(secret: string, timeStep: number = 30, digits: number = 6): string {
  const now = Math.floor(Date.now() / 1000)
  const counter = Math.floor(now / timeStep)
  
  // Simple TOTP implementation (for demo purposes)
  // In production, use a proper crypto library
  const hash = btoa(secret + counter).slice(0, 20)
  const code = parseInt(hash.replace(/[^0-9]/g, "").slice(0, digits)) || 0
  return code.toString().padStart(digits, "0")
}

function validateTOTP(secret: string, code: string, timeStep: number = 30, digits: number = 6): boolean {
  const generated = generateTOTP(secret, timeStep, digits)
  return generated === code
}

export default function OTPGeneratorPage() {
  const tool = getToolByPath("/generators/otp-generator")
  const [secret, setSecret] = React.useState("")
  const [timeStep, setTimeStep] = React.useState(30)
  const [digits, setDigits] = React.useState(6)
  const [otp, setOtp] = React.useState("")
  const [validationCode, setValidationCode] = React.useState("")
  const [isValid, setIsValid] = React.useState<boolean | null>(null)

  const generateSecret = () => {
    const array = new Uint8Array(16)
    crypto.getRandomValues(array)
    const newSecret = Array.from(array).map(b => b.toString(16).padStart(2, "0")).join("")
    setSecret(newSecret)
    generateOTP(newSecret)
  }

  const generateOTP = (secretKey?: string) => {
    const key = secretKey || secret
    if (!key) {
      toast.error("Please enter or generate a secret")
      return
    }
    const code = generateTOTP(key, timeStep, digits)
    setOtp(code)
  }

  React.useEffect(() => {
    if (secret) {
      generateOTP()
      const interval = setInterval(() => generateOTP(), timeStep * 1000)
      return () => clearInterval(interval)
    }
  }, [secret, timeStep, digits])

  const copyToClipboard = () => {
    navigator.clipboard.writeText(otp)
    toast.success("OTP copied to clipboard")
  }

  const validateCode = () => {
    if (!secret) {
      toast.error("Please enter a secret first")
      return
    }
    const valid = validateTOTP(secret, validationCode, timeStep, digits)
    setIsValid(valid)
    if (valid) {
      toast.success("OTP code is valid")
    } else {
      toast.error("OTP code is invalid")
    }
  }

  if (!tool) {
    return <div>Tool not found</div>
  }
return (
    <div className="space-y-6"><div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Configuration</CardTitle>
            <CardDescription>Set up your OTP generator</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="secret">Secret Key</Label>
              <div className="flex gap-2">
                <Input
                  id="secret"
                  value={secret}
                  onChange={(e) => {
                    setSecret(e.target.value)
                    setIsValid(null)
                  }}
                  placeholder="Enter or generate a secret key"
                  className="font-mono text-sm"
                />
                <Button variant="outline" onClick={generateSecret}>
                  <RefreshCw className="h-4 w-4" />
                </Button>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="timeStep">Time Step (seconds)</Label>
              <Input
                id="timeStep"
                type="number"
                min="10"
                max="300"
                value={timeStep}
                onChange={(e) => setTimeStep(Math.max(10, Math.min(300, parseInt(e.target.value) || 30)))}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="digits">Digits</Label>
              <Input
                id="digits"
                type="number"
                min="4"
                max="10"
                value={digits}
                onChange={(e) => setDigits(Math.max(4, Math.min(10, parseInt(e.target.value) || 6)))}
              />
            </div>

            <Button onClick={() => generateOTP()} className="w-full">
              <RefreshCw className="h-4 w-4 mr-2" />
              Generate OTP
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Generated OTP</CardTitle>
            <CardDescription>Time-based one-time password</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>OTP Code</Label>
              <div className="flex gap-2">
                <Input
                  value={otp}
                  readOnly
                  className="font-mono text-2xl text-center font-bold"
                />
                <Button
                  variant="outline"
                  size="icon"
                  onClick={copyToClipboard}
                  disabled={!otp}
                >
                  <Copy className="h-4 w-4" />
                </Button>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="validate">Validate OTP Code</Label>
              <div className="flex gap-2">
                <Input
                  id="validate"
                  value={validationCode}
                  onChange={(e) => {
                    setValidationCode(e.target.value)
                    setIsValid(null)
                  }}
                  placeholder="Enter code to validate"
                  className="font-mono"
                />
                <Button onClick={validateCode} disabled={!validationCode || !secret}>
                  Validate
                </Button>
              </div>
              {isValid !== null && (
                <div className={`flex items-center gap-2 text-sm ${isValid ? "text-green-600" : "text-red-600"}`}>
                  {isValid ? <CheckCircle2 className="h-4 w-4" /> : <XCircle className="h-4 w-4" />}
                  <span>{isValid ? "Valid" : "Invalid"} code</span>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
