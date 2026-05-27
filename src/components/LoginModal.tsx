"use client";

import React, { useState, useEffect, useRef } from "react";
import { useAuth } from "../context/AuthContext";

export default function LoginModal() {
  const { showLoginModal, setShowLoginModal, login } = useAuth();
  
  const [phone, setPhone] = useState("");
  const [name, setName] = useState("");
  const [step, setStep] = useState<"phone" | "otp">("phone");
  const [otp, setOtp] = useState<string[]>(Array(6).fill(""));
  const [mockOtp, setMockOtp] = useState("");
  const [timer, setTimer] = useState(30);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [showToast, setShowToast] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const otpRefs = useRef<(HTMLInputElement | null)[]>([]);

  // Count down timer for Resend OTP
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (step === "otp" && timer > 0) {
      interval = setInterval(() => {
        setTimer((t) => t - 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [step, timer]);

  // Focus the first OTP input when transitioning to OTP step
  useEffect(() => {
    if (step === "otp" && otpRefs.current[0]) {
      setTimeout(() => {
        otpRefs.current[0]?.focus();
      }, 300);
    }
  }, [step]);

  if (!showLoginModal) return null;

  const handleSendOtp = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    // Validate phone (simple 10 digit check)
    const cleanPhone = phone.replace(/\D/g, "");
    if (cleanPhone.length < 10) {
      setError("Please enter a valid 10-digit mobile number.");
      return;
    }

    if (!name.trim()) {
      setError("Please enter your name to register.");
      return;
    }

    setIsLoading(true);

    // Simulate network delay
    setTimeout(() => {
      // Generate a 6-digit random mock OTP
      const generatedOtp = Math.floor(100000 + Math.random() * 900000).toString();
      setMockOtp(generatedOtp);
      setIsLoading(false);
      setStep("otp");
      setTimer(30);
      setOtp(Array(6).fill(""));
      
      // Trigger toast notification
      setShowToast(true);
      setTimeout(() => {
        setShowToast(false);
      }, 8000); // Leave it long enough for the user to read and copy
    }, 1200);
  };

  const handleVerifyOtp = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setError("");

    const enteredOtp = otp.join("");
    if (enteredOtp.length < 6) {
      setError("Please enter all 6 digits of the OTP.");
      return;
    }

    setIsLoading(true);

    // Simulate verification delay
    setTimeout(() => {
      if (enteredOtp === mockOtp) {
        setIsLoading(false);
        setIsSuccess(true);
        // Delay closing modal to show success state
        setTimeout(() => {
          login(`+91 ${phone}`, name);
          handleClose();
        }, 1000);
      } else {
        setIsLoading(false);
        setError("Invalid OTP. Please check the notification and try again.");
      }
    }, 1000);
  };

  const handleOtpChange = (value: string, index: number) => {
    // Only allow numbers
    if (value && !/^\d$/.test(value)) return;

    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);

    // Move to next input if value is typed
    if (value && index < 5) {
      otpRefs.current[index + 1]?.focus();
    }

    // Auto verify if last digit is typed
    if (newOtp.every(digit => digit !== "")) {
      // Small timeout to allow input rendering before verifying
      setTimeout(() => {
        setIsLoading(true);
        // Call verification directly
        const finalOtp = newOtp.join("");
        setTimeout(() => {
          if (finalOtp === mockOtp) {
            setIsLoading(false);
            setIsSuccess(true);
            setTimeout(() => {
              login(`+91 ${phone}`, name);
              handleClose();
            }, 1000);
          } else {
            setIsLoading(false);
            setError("Invalid OTP. Please check the notification and try again.");
          }
        }, 800);
      }, 50);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>, index: number) => {
    // Move to previous input on backspace
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      otpRefs.current[index - 1]?.focus();
    }
  };

  const handleResendOtp = () => {
    if (timer > 0) return;
    setError("");
    setIsLoading(true);

    setTimeout(() => {
      const generatedOtp = Math.floor(100000 + Math.random() * 900000).toString();
      setMockOtp(generatedOtp);
      setIsLoading(false);
      setTimer(30);
      setOtp(Array(6).fill(""));
      setShowToast(true);
      setTimeout(() => {
        setShowToast(false);
      }, 8000);
    }, 1000);
  };

  const handleClose = () => {
    setShowLoginModal(false);
    setPhone("");
    setName("");
    setStep("phone");
    setOtp(Array(6).fill(""));
    setMockOtp("");
    setError("");
    setShowToast(false);
    setIsSuccess(false);
  };

  return (
    <div className="login-modal-overlay">
      {/* Mock SMS Gateway Toast */}
      {showToast && (
        <div className="sms-gateway-toast">
          <div className="sms-toast-header">
            <span className="sms-toast-icon">💬</span>
            <strong className="sms-toast-title">SMS Gateway Simulator</strong>
            <button className="sms-toast-close" onClick={() => setShowToast(false)}>&times;</button>
          </div>
          <div className="sms-toast-body">
            Chasha Bakers: Your OTP verification code is <strong className="sms-otp-code">{mockOtp}</strong>. Valid for 10 minutes.
          </div>
        </div>
      )}

      <div className="login-modal-container">
        <button className="login-modal-close" onClick={handleClose}>
          &times;
        </button>

        {isSuccess ? (
          <div className="login-success-state">
            <div className="success-checkmark">
              <div className="check-icon">✓</div>
            </div>
            <h3>Authentication Successful</h3>
            <p>Welcome back, {name}!</p>
          </div>
        ) : (
          <>
            <div className="login-modal-header">
              <h2>Verify Your Number</h2>
              <p>
                {step === "phone"
                  ? "Enter your details to receive a 6-digit OTP code."
                  : `Enter the code sent to +91 ${phone}`}
              </p>
            </div>

            {error && <div className="login-error-banner">{error}</div>}

            {step === "phone" ? (
              <form onSubmit={handleSendOtp} className="login-form">
                <div className="form-group">
                  <label htmlFor="name-input">Full Name</label>
                  <input
                    id="name-input"
                    type="text"
                    placeholder="Enter your name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                    disabled={isLoading}
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="phone-input">Mobile Number</label>
                  <div className="phone-input-wrapper">
                    <span className="phone-prefix">+91</span>
                    <input
                      id="phone-input"
                      type="tel"
                      maxLength={10}
                      placeholder="98765 43210"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value.replace(/\D/g, ""))}
                      required
                      disabled={isLoading}
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  className={`login-submit-btn ${isLoading ? "loading" : ""}`}
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <span className="login-spinner"></span>
                  ) : (
                    "Send OTP Code"
                  )}
                </button>
              </form>
            ) : (
              <form onSubmit={handleVerifyOtp} className="login-form">
                <div className="otp-inputs-container">
                  {otp.map((digit, idx) => (
                    <input
                      key={idx}
                      ref={(el) => { otpRefs.current[idx] = el; }}
                      type="text"
                      maxLength={1}
                      inputMode="numeric"
                      pattern="[0-9]*"
                      value={digit}
                      onChange={(e) => handleOtpChange(e.target.value, idx)}
                      onKeyDown={(e) => handleKeyDown(e, idx)}
                      disabled={isLoading}
                      className="otp-digit-input"
                    />
                  ))}
                </div>

                <button
                  type="submit"
                  className={`login-submit-btn ${isLoading ? "loading" : ""}`}
                  disabled={isLoading || otp.join("").length < 6}
                >
                  {isLoading ? (
                    <span className="login-spinner"></span>
                  ) : (
                    "Verify & Login"
                  )}
                </button>

                <div className="otp-resend-container">
                  {timer > 0 ? (
                    <p>Resend code in <span>{timer}s</span></p>
                  ) : (
                    <button
                      type="button"
                      className="resend-link"
                      onClick={handleResendOtp}
                      disabled={isLoading}
                    >
                      Resend OTP Code
                    </button>
                  )}
                </div>

                <button
                  type="button"
                  className="change-phone-btn"
                  onClick={() => setStep("phone")}
                  disabled={isLoading}
                >
                  Change Phone Number
                </button>
              </form>
            )}
          </>
        )}
      </div>
    </div>
  );
}
