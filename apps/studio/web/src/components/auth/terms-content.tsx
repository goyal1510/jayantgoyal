"use client"

import { Shield, AlertTriangle, BookOpen, Mail, Code, Database, Globe, EyeOff, Trash2, Cpu, RefreshCw } from "lucide-react"
import { Separator } from "@jayant/web-ui/separator"

export function TermsContent() {
  return (
    <div className="space-y-8">
      {/* Introduction */}
      <section className="space-y-4">
        <div className="flex items-center gap-3">
          <BookOpen className="size-6 text-primary" />
          <h2 className="text-xl font-semibold">1. Introduction</h2>
        </div>
        <div className="pl-9 space-y-3">
          <p className="text-sm text-muted-foreground leading-relaxed">
            Welcome to <strong className="text-foreground">jayantgoyal.com</strong>. This website serves as a personal portfolio,
            technical demonstration, and learning platform created for educational purposes.
            By accessing or using this website, you acknowledge and agree to be bound by these
            Terms and Conditions (&quot;Terms&quot;).
          </p>
          <p className="text-sm text-muted-foreground leading-relaxed">
            This platform is operated by <strong className="text-foreground">Jayant</strong> as an individual developer
            showcasing web development skills, experimental features, and technical capabilities.
          </p>
        </div>
      </section>

      <Separator />

      {/* Educational & Experimental Nature */}
      <section className="space-y-4">
        <div className="flex items-center gap-3">
          <Code className="size-6 text-blue-500" />
          <h2 className="text-xl font-semibold">2. Educational & Experimental Nature</h2>
        </div>
        <div className="pl-9 space-y-4">
          <div className="rounded-lg bg-blue-500/10 border border-blue-500/20 p-4">
            <h3 className="font-medium text-blue-600 dark:text-blue-400 mb-2">Purpose Statement</h3>
            <ul className="text-sm text-muted-foreground list-disc list-inside space-y-1 ml-2">
              <li>This is primarily a <strong className="text-foreground">learning and demonstration platform</strong></li>
              <li>Features may be experimental, incomplete, or subject to sudden changes</li>
              <li>Technical implementations are for showcase and educational purposes</li>
              <li>Some features may intentionally demonstrate edge cases or specific technical solutions</li>
              <li>The platform may include beta features that are still in development</li>
            </ul>
          </div>
          <p className="text-sm text-muted-foreground leading-relaxed">
            As this is a portfolio project, you may encounter features that are works in progress,
            experimental implementations, or demonstrations of specific technologies. The platform
            may not always represent production-ready software.
          </p>
        </div>
      </section>

      <Separator />

      {/* Critical Data Warning */}
      <section className="space-y-4">
        <div className="flex items-center gap-3">
          <AlertTriangle className="size-6 text-amber-500" />
          <h2 className="text-xl font-semibold">3. Critical Data Warning</h2>
        </div>
        <div className="pl-9 space-y-4">
          <div className="rounded-lg bg-amber-500/10 border border-amber-500/20 p-4 space-y-3">
            <h3 className="font-medium text-amber-600 dark:text-amber-400 mb-2">STRICT WARNING</h3>
            <p className="text-sm text-amber-600 dark:text-amber-400 leading-relaxed font-medium">
              <strong>DO NOT STORE SENSITIVE, CONFIDENTIAL, OR CRITICAL DATA</strong> on this platform.
            </p>
            <ul className="text-sm text-muted-foreground list-disc list-inside space-y-2 ml-2">
              <li><strong className="text-foreground">Personal Information:</strong> SSN, passport numbers, government IDs</li>
              <li><strong className="text-foreground">Financial Data:</strong> Credit card numbers, bank details, cryptocurrency keys</li>
              <li><strong className="text-foreground">Credentials:</strong> Passwords, API keys, security tokens, private keys</li>
              <li><strong className="text-foreground">Health Data:</strong> Medical records, health information, prescriptions</li>
              <li><strong className="text-foreground">Intellectual Property:</strong> Unpatented inventions, trade secrets</li>
              <li><strong className="text-foreground">Legal Documents:</strong> Contracts, legal agreements, sensitive correspondence</li>
              <li><strong className="text-foreground">Irreplaceable Data:</strong> Unique work, personal memories, one-of-a-kind files</li>
            </ul>
          </div>
        </div>
      </section>

      <Separator />

      {/* Data Management Policies */}
      <section className="space-y-4">
        <div className="flex items-center gap-3">
          <Database className="size-6 text-purple-500" />
          <h2 className="text-xl font-semibold">4. Data Management Policies</h2>
        </div>
        <div className="pl-9 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="rounded-lg bg-purple-500/10 border border-purple-500/20 p-4">
              <div className="flex items-center gap-2 mb-2">
                <Trash2 className="size-4 text-purple-500" />
                <h3 className="font-medium text-purple-600 dark:text-purple-400">Data Retention</h3>
              </div>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• User account data: Retained while account is active</li>
                <li>• Inactive accounts (&gt;180 days): May be purged</li>
                <li>• Backups: No guaranteed backup retention</li>
              </ul>
            </div>

            <div className="rounded-lg bg-purple-500/10 border border-purple-500/20 p-4">
              <div className="flex items-center gap-2 mb-2">
                <EyeOff className="size-4 text-purple-500" />
                <h3 className="font-medium text-purple-600 dark:text-purple-400">Privacy Expectations</h3>
              </div>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• User data: Basic security measures applied</li>
                <li>• No GDPR/CCPA compliance guaranteed</li>
                <li>• Analytics data collected for improvement</li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      <Separator />

      {/* Limitation of Liability */}
      <section className="space-y-4">
        <div className="flex items-center gap-3">
          <Shield className="size-6 text-red-500" />
          <h2 className="text-xl font-semibold">5. Limitation of Liability</h2>
        </div>
        <div className="pl-9 space-y-4">
          <div className="rounded-lg bg-red-500/10 border border-red-500/20 p-4 space-y-3">
            <p className="text-sm text-red-600 dark:text-red-400 leading-relaxed font-medium">
              <strong>USE THIS PLATFORM AT YOUR OWN RISK</strong>
            </p>
            <p className="text-sm text-muted-foreground leading-relaxed">
              To the fullest extent permitted by law, <strong className="text-foreground">jayantgoyal.com and its owner</strong> will not be liable for:
            </p>
            <ul className="text-sm text-muted-foreground list-disc list-inside space-y-2 ml-2">
              <li><strong className="text-foreground">Data Loss:</strong> Any loss, corruption, or unauthorized access to your data</li>
              <li><strong className="text-foreground">Service Issues:</strong> Downtime, interruptions, or degraded performance</li>
              <li><strong className="text-foreground">Technical Problems:</strong> Bugs, errors, crashes, or unexpected behavior</li>
              <li><strong className="text-foreground">Security Breaches:</strong> Hacks, data leaks, or unauthorized access</li>
              <li><strong className="text-foreground">Financial Loss:</strong> Any direct, indirect, or consequential damages</li>
              <li><strong className="text-foreground">Third-Party Issues:</strong> Problems with external services or integrations</li>
            </ul>
            <p className="text-sm text-muted-foreground leading-relaxed pt-2">
              No warranties of any kind are provided, including but not limited to warranties
              of merchantability, fitness for a particular purpose, or non-infringement.
            </p>
          </div>
        </div>
      </section>

      <Separator />

      {/* User Account Terms */}
      <section className="space-y-4">
        <div className="flex items-center gap-3">
          <Shield className="size-6 text-green-500" />
          <h2 className="text-xl font-semibold">6. User Account Terms</h2>
        </div>
        <div className="pl-9 space-y-4">
          <div className="rounded-lg bg-green-500/10 border border-green-500/20 p-4">
            <h3 className="font-medium text-green-600 dark:text-green-400 mb-3">Account Responsibilities</h3>
            <ul className="text-sm text-muted-foreground list-disc list-inside space-y-2 ml-2">
              <li>Provide accurate and complete registration information</li>
              <li>Maintain the confidentiality of your login credentials</li>
              <li>Accept responsibility for all activities under your account</li>
              <li>Notify us immediately of any unauthorized access</li>
              <li>Not share your account with others</li>
              <li>Not create multiple accounts without permission</li>
            </ul>
          </div>
          <div className="rounded-lg bg-amber-500/10 border border-amber-500/20 p-4">
            <h3 className="font-medium text-amber-600 dark:text-amber-400 mb-2">Account Termination</h3>
            <p className="text-sm text-muted-foreground">
              We reserve the right to suspend or terminate accounts that:
            </p>
            <ul className="text-sm text-muted-foreground list-disc list-inside space-y-1 ml-2 mt-2">
              <li>Violate these Terms</li>
              <li>Engage in abusive or harmful behavior</li>
              <li>Attempt to exploit or damage the platform</li>
              <li>Are inactive for extended periods</li>
            </ul>
          </div>
        </div>
      </section>

      <Separator />

      {/* Acceptable Use Policy */}
      <section className="space-y-4">
        <div className="flex items-center gap-3">
          <Globe className="size-6 text-orange-500" />
          <h2 className="text-xl font-semibold">7. Acceptable Use Policy</h2>
        </div>
        <div className="pl-9 space-y-3">
          <p className="text-sm text-muted-foreground leading-relaxed">
            You agree not to use the platform to:
          </p>
          <ul className="text-sm text-muted-foreground list-disc list-inside space-y-2 ml-4">
            <li>Upload or distribute malware, viruses, or harmful code</li>
            <li>Engage in hacking, scraping, or unauthorized access attempts</li>
            <li>Overload or attempt to crash the platform (DoS attacks)</li>
            <li>Upload illegal, offensive, or inappropriate content</li>
            <li>Violate intellectual property rights of others</li>
            <li>Impersonate others or provide false information</li>
            <li>Use for commercial purposes without permission</li>
          </ul>
        </div>
      </section>

      <Separator />

      {/* Technical Requirements & Limitations */}
      <section className="space-y-4">
        <div className="flex items-center gap-3">
          <Cpu className="size-6 text-muted-foreground" />
          <h2 className="text-xl font-semibold">8. Technical Requirements & Limitations</h2>
        </div>
        <div className="pl-9 space-y-3">
          <div className="rounded-lg bg-muted/50 border border-border p-4">
            <h3 className="font-medium mb-2">Platform Limitations</h3>
            <ul className="text-sm text-muted-foreground space-y-2">
              <li>• <strong className="text-foreground">Storage Limits:</strong> Accounts may have storage limitations</li>
              <li>• <strong className="text-foreground">Rate Limits:</strong> API and request limits may apply</li>
              <li>• <strong className="text-foreground">Browser Support:</strong> Modern browsers required (Chrome, Firefox, Safari, Edge latest versions)</li>
              <li>• <strong className="text-foreground">Mobile Experience:</strong> May vary by device and browser</li>
              <li>• <strong className="text-foreground">Feature Availability:</strong> Some features may be region-restricted</li>
            </ul>
          </div>
        </div>
      </section>

      <Separator />

      {/* Intellectual Property */}
      <section className="space-y-4">
        <div className="flex items-center gap-3">
          <Code className="size-6 text-blue-500" />
          <h2 className="text-xl font-semibold">9. Intellectual Property</h2>
        </div>
        <div className="pl-9 space-y-3">
          <p className="text-sm text-muted-foreground leading-relaxed">
            All platform code, design, content, and branding are the property of Jayant
            unless otherwise stated. You may not copy, modify, distribute, or create derivative
            works without explicit permission.
          </p>
          <p className="text-sm text-muted-foreground leading-relaxed">
            Content you upload remains your property, but you grant us a license to store,
            process, and display it as necessary to provide the service.
          </p>
        </div>
      </section>

      <Separator />

      {/* Changes to Terms */}
      <section className="space-y-4">
        <div className="flex items-center gap-3">
          <RefreshCw className="size-6 text-cyan-500" />
          <h2 className="text-xl font-semibold">10. Changes to Terms</h2>
        </div>
        <div className="pl-9 space-y-3">
          <p className="text-sm text-muted-foreground leading-relaxed">
            We reserve the right to modify these Terms at any time. When we make changes,
            we will update the &quot;Last Updated&quot; date at the top of these Terms.
          </p>
          <div className="rounded-lg bg-muted/50 border border-border p-4">
            <p className="text-sm font-medium">
              Continued use of the platform after changes constitutes your acceptance
              of the updated Terms. It is your responsibility to review these Terms periodically.
            </p>
          </div>
        </div>
      </section>

      <Separator />

      {/* Contact & Support */}
      <section className="space-y-4">
        <div className="flex items-center gap-3">
          <Mail className="size-6 text-primary" />
          <h2 className="text-xl font-semibold">11. Contact & Support</h2>
        </div>
        <div className="pl-9 space-y-3">
          <p className="text-sm text-muted-foreground leading-relaxed">
            For questions about these Terms, technical issues, or general inquiries:
          </p>
          <div className="rounded-lg bg-primary/5 border border-primary/20 p-4">
            <p className="text-sm text-muted-foreground">
              Email: <a href="mailto:goyal151002@gmail.com" target="_blank" rel="noreferrer" className="text-primary underline underline-offset-4 hover:text-primary/80 font-medium">goyal151002@gmail.com</a>
            </p>
            <p className="text-sm text-muted-foreground mt-1">
              Portfolio: <a href="https://jayantgoyal.com/#contact" target="_blank" rel="noreferrer" className="text-primary underline underline-offset-4 hover:text-primary/80 font-medium">jayantgoyal.com</a>
            </p>
            <p className="text-xs text-muted-foreground mt-3">
              <strong className="text-foreground">Note:</strong> As this is a personal portfolio project, response times may vary.
              For urgent matters, please be patient as this is not a commercial service.
            </p>
          </div>
        </div>
      </section>

      <Separator />

      {/* Final Acknowledgement */}
      <section className="space-y-4">
        <h2 className="text-xl font-semibold">Final Acknowledgement</h2>
        <div className="space-y-2">
          <p className="text-sm text-muted-foreground">
            By clicking &quot;Accept & Continue&quot;, you acknowledge that:
          </p>
          <div className="">
            <ul className="text-sm text-muted-foreground list-disc list-inside space-y-1 text-left inline-block">
              <li>You have read and understood these Terms and Conditions</li>
              <li>You will not store sensitive or critical data on this platform</li>
              <li>You accept the risks associated with using an educational/experimental platform</li>
              <li>You understand the limitations of liability outlined above</li>
            </ul>
          </div>
        </div>
      </section>
    </div>
  )
}

export const TERMS_LAST_UPDATED = "26 January 2026"
