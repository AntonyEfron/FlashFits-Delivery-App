import React, { useState } from "react";
import Login from "@/components/AuthScreen/Login";
import OTPVerificationScreen from "@/components/AuthScreen/OTPVerificationScreen";

export default function AuthScreen() {
  const [phoneNumber, setPhoneNumber] = useState<string | null>(null);

  return (
    <>
      {!phoneNumber ? (
        // Show Login screen first
        <Login onSendOTP={(number: string) => setPhoneNumber(number)} />
      ) : (
        // Show OTP screen when phoneNumber is set
        <OTPVerificationScreen phoneNumber={phoneNumber} onBack={() => setPhoneNumber(null)} />
      )}
    </>
  );
}