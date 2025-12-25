"use client"

import * as React from "react"
import { getToolByPath } from "@/lib/tools"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Eye } from "lucide-react"

interface PasswordStrength {
  score: number
  label: string
  color: string
  feedback: string[]
  crackTime: string
}

function calculatePasswordStrength(password: string): PasswordStrength {
  let score = 0
  const feedback: string[] = []

  if (password.length === 0) {
    return {
      score: 0,
      label: "No password",
      color: "text-muted-foreground",
      feedback: [],
      crackTime: "N/A",
    }
  }

  // Length checks
  if (password.length >= 8) score += 1
  else feedback.push("Use at least 8 characters")
  
  if (password.length >= 12) score += 1
  if (password.length >= 16) score += 1

  // Character variety
  if (/[a-z]/.test(password)) score += 1
  else feedback.push("Add lowercase letters")
  
  if (/[A-Z]/.test(password)) score += 1
  else feedback.push("Add uppercase letters")
  
  if (/[0-9]/.test(password)) score += 1
  else feedback.push("Add numbers")
  
  if (/[^a-zA-Z0-9]/.test(password)) score += 1
  else feedback.push("Add special characters")

  // Common patterns
  if (!/(.)\1{2,}/.test(password)) score += 1
  else feedback.push("Avoid repeating characters")
  
  if (!/(012|123|234|345|456|567|678|789|890|abc|bcd|cde|def|efg|fgh|ghi|hij|ijk|jkl|klm|lmn|mno|nop|opq|pqr|qrs|rst|stu|tuv|uvw|vwx|wxy|xyz)/i.test(password)) {
    score += 1
  } else {
    feedback.push("Avoid common sequences")
  }

  // Calculate crack time estimate
  const charsetSize = 
    (/[a-z]/.test(password) ? 26 : 0) +
    (/[A-Z]/.test(password) ? 26 : 0) +
    (/[0-9]/.test(password) ? 10 : 0) +
    (/[^a-zA-Z0-9]/.test(password) ? 32 : 0)
  
  const combinations = Math.pow(charsetSize, password.length)
  const guessesPerSecond = 1e9 // 1 billion guesses per second
  const seconds = combinations / guessesPerSecond
  
  let crackTime = "Instant"
  if (seconds > 1) {
    if (seconds < 60) crackTime = `${Math.round(seconds)} seconds`
    else if (seconds < 3600) crackTime = `${Math.round(seconds / 60)} minutes`
    else if (seconds < 86400) crackTime = `${Math.round(seconds / 3600)} hours`
    else if (seconds < 31536000) crackTime = `${Math.round(seconds / 86400)} days`
    else crackTime = `${Math.round(seconds / 31536000)} years`
  }

  let label = "Very Weak"
  let color = "text-red-500"
  
  if (score >= 8) {
    label = "Very Strong"
    color = "text-green-500"
  } else if (score >= 6) {
    label = "Strong"
    color = "text-green-600"
  } else if (score >= 4) {
    label = "Moderate"
    color = "text-yellow-500"
  } else if (score >= 2) {
    label = "Weak"
    color = "text-orange-500"
  }

  return {
    score: Math.min(score, 10),
    label,
    color,
    feedback: feedback.length > 0 ? feedback : ["Password looks good!"],
    crackTime,
  }
}

export default function PasswordStrengthPage() {
  const tool = getToolByPath("/password-strength")
  const [password, setPassword] = React.useState("")
  const [showPassword, setShowPassword] = React.useState(false)
  const strength = React.useMemo(() => calculatePasswordStrength(password), [password])

  if (!tool) {
    return <div>Tool not found</div>
  }
return (
    <div className="space-y-6"><div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Password Input</CardTitle>
            <CardDescription>Enter a password to analyze</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <div className="flex gap-2">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter password..."
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="px-3 border rounded-md hover:bg-accent"
                >
                  <Eye className="h-4 w-4" />
                </button>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Strength Analysis</CardTitle>
            <CardDescription>Password strength assessment</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label>Strength</Label>
                <span className={`font-semibold ${strength.color}`}>
                  {strength.label}
                </span>
              </div>
              <div className="w-full bg-muted rounded-full h-2">
                <div
                  className={`h-2 rounded-full transition-all ${
                    strength.score >= 8 ? "bg-green-500" :
                    strength.score >= 6 ? "bg-green-600" :
                    strength.score >= 4 ? "bg-yellow-500" :
                    strength.score >= 2 ? "bg-orange-500" :
                    "bg-red-500"
                  }`}
                  style={{ width: `${(strength.score / 10) * 100}%` }}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Score: {strength.score}/10</Label>
            </div>

            <div className="space-y-2">
              <Label>Estimated Crack Time</Label>
              <p className="text-sm font-mono">{strength.crackTime}</p>
            </div>

            <div className="space-y-2">
              <Label>Feedback</Label>
              <ul className="text-sm space-y-1">
                {strength.feedback.map((item, index) => (
                  <li key={index} className="flex items-start gap-2">
                    <span className="mt-0.5">•</span>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
