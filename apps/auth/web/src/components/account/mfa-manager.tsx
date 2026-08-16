"use client";

import { useState } from "react";

import {
  cancelMfaEnrollmentAction,
  disableMfaAction,
  startMfaEnrollmentAction,
  verifyMfaEnrollmentAction,
} from "@/app/actions/mfa";
import type { MfaEnrollmentResult } from "@/lib/auth/action-support";
import { Button } from "@jayant/web-ui/button";
import { Input } from "@jayant/web-ui/input";
import { Label } from "@jayant/web-ui/label";

type Enrollment = NonNullable<MfaEnrollmentResult["enrollment"]>;

export function MfaManager({
  initialFactorId,
}: {
  initialFactorId: string | null;
}) {
  const [factorId, setFactorId] = useState(initialFactorId);
  const [enrollment, setEnrollment] = useState<Enrollment | null>(null);
  const [code, setCode] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState(false);
  const [pending, setPending] = useState(false);

  function showResult(result: { error?: string; success?: string }) {
    setError(Boolean(result.error));
    setMessage(result.error ?? result.success ?? "");
  }

  async function startEnrollment() {
    setPending(true);
    setMessage("");
    const result = await startMfaEnrollmentAction();
    showResult(result);
    if (result.enrollment) setEnrollment(result.enrollment);
    setPending(false);
  }

  async function cancelEnrollment() {
    if (!enrollment) return;
    setPending(true);
    const result = await cancelMfaEnrollmentAction(enrollment.factorId);
    showResult(result);
    if (!result.error) {
      setEnrollment(null);
      setCode("");
    }
    setPending(false);
  }

  async function verifyEnrollment() {
    if (!enrollment) return;
    setPending(true);
    const result = await verifyMfaEnrollmentAction({
      factorId: enrollment.factorId,
      code,
    });
    showResult(result);
    if (!result.error) {
      setFactorId(enrollment.factorId);
      setEnrollment(null);
      setCode("");
    }
    setPending(false);
  }

  async function disableMfa() {
    if (!factorId) return;
    setPending(true);
    const result = await disableMfaAction({ factorId, code });
    showResult(result);
    if (!result.error) {
      setFactorId(null);
      setCode("");
    }
    setPending(false);
  }

  const resultMessage = message ? (
    <p
      role={error ? "alert" : "status"}
      className={error ? "text-destructive text-sm" : "text-sm"}
    >
      {message}
    </p>
  ) : null;

  if (enrollment) {
    return (
      <div className="space-y-4">
        <p className="text-sm">
          Scan the QR code, then enter the six-digit code.
        </p>
        <div className="w-fit rounded-lg border bg-white p-3">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={enrollment.qrCode}
            alt="Authenticator QR code"
            width={180}
            height={180}
          />
        </div>
        <p className="text-muted-foreground break-all font-mono text-xs">
          Manual key: {enrollment.secret}
        </p>
        <div className="grid gap-2">
          <Label htmlFor="enrollment-code">Verification code</Label>
          <Input
            id="enrollment-code"
            inputMode="numeric"
            autoComplete="one-time-code"
            value={code}
            onChange={(event) => setCode(event.target.value)}
            maxLength={6}
          />
        </div>
        {resultMessage}
        <div className="flex gap-2">
          <Button
            onClick={verifyEnrollment}
            disabled={pending || code.length !== 6}
          >
            Verify and enable
          </Button>
          <Button variant="ghost" onClick={cancelEnrollment} disabled={pending}>
            Cancel
          </Button>
        </div>
      </div>
    );
  }

  if (!factorId) {
    return (
      <div className="space-y-3">
        <p className="text-muted-foreground text-sm">
          Add an authenticator app for stronger account protection.
        </p>
        {resultMessage}
        <Button onClick={startEnrollment} disabled={pending}>
          Set up authenticator
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <p className="text-sm">An authenticator is enabled.</p>
      <div className="grid gap-2">
        <Label htmlFor="disable-code">Code required to disable</Label>
        <Input
          id="disable-code"
          inputMode="numeric"
          autoComplete="one-time-code"
          value={code}
          onChange={(event) => setCode(event.target.value)}
          maxLength={6}
        />
      </div>
      {resultMessage}
      <Button
        variant="destructive"
        onClick={disableMfa}
        disabled={pending || code.length !== 6}
      >
        Disable authenticator
      </Button>
    </div>
  );
}
