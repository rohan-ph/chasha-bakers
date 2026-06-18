"use client";

import React, { useState, useEffect, useRef } from "react";
import { useAuth } from "../context/AuthContext";
import { auth, isFirebaseConfigured } from "../lib/firebase";
import { RecaptchaVerifier, signInWithPhoneNumber, ConfirmationResult } from "firebase/auth";

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

  // Firebase auth state references
  const [confirmationResult, setConfirmationResult] = useState<ConfirmationResult | null>(null);
  const [recaptchaVerifier, setRecaptchaVerifier] = useState<RecaptchaVerifier | null>(null);

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

  // Initialize invisible Recaptcha Verifier on component load/open
  useEffect(() => {
    if (showLoginModal && isFirebaseConfigured && auth && !recaptchaVerifier) {
      try {
        const verifier = new RecaptchaVerifier(auth, "recaptcha-container", {
          size: "invisible",
          callback: () => {
            // reCAPTCHA completed
          },
          "expired-callback": () => {
            setError("reCAPTCHA validation expired. Please try again.");
          }
        });
        setRecaptchaVerifier(verifier);
      } catch (err: any) {
        console.error("Recaptcha initialization error:", err);
      }
    }

    return () => {
      if (recaptchaVerifier) {
        try {
          recaptchaVerifier.clear();
          setRecaptchaVerifier(null);
        } catch (e) {}
      }
    };
  }, [showLoginModal, recaptchaVerifier]);

  if (!showLoginModal) return null;

  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

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

    if (isFirebaseConfigured && auth) {
      // --- REAL FIREBASE AUTHENTICATION ---
      const formattedPhone = `+91${cleanPhone}`;
      try {
        if (!recaptchaVerifier) {
          throw new Error("reCAPTCHA verifier not initialized. Please reload the page.");
        }
        
        const confirmation = await signInWithPhoneNumber(auth, formattedPhone, recaptchaVerifier);
        setConfirmationResult(confirmation);
        setIsLoading(false);
        setStep("otp");
        setTimer(30);
        setOtp(Array(6).fill(""));
      } catch (err: any) {
        console.error("Firebase SMS send failed:", err);
        setIsLoading(false);
        
        // Detailed error decoding for common Firebase issues
        if (err.code === "auth/invalid-phone-number") {
          setError("Invalid phone number format. Please check the digits.");
        } else if (err.code === "auth/too-many-requests") {
          setError("Too many requests from this number. Please try again later.");
        } else {
          setError(`SMS Send Failed: ${err.message || "Unknown error occurred"}`);
        }
      }
    } else {
      // --- FALLBACK MOCK SIMULATOR ---
      setTimeout(() => {
        const generatedOtp = Math.floor(100000 + Math.random() * 900000).toString();
        setMockOtp(generatedOtp);
        setIsLoading(false);
        setStep("otp");
        setTimer(30);
        setOtp(Array(6).fill(""));
        
        setShowToast(true);
        setTimeout(() => {
          setShowToast(false);
        }, 8000);
      }, 1200);
    }
  };

  const handleVerifyOtp = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setError("");

    const enteredOtp = otp.join("");
    if (enteredOtp.length < 6) {
      setError("Please enter all 6 digits of the OTP.");
      return;
    }

    setIsLoading(true);

    if (isFirebaseConfigured && confirmationResult) {
      // --- REAL FIREBASE VERIFICATION ---
      try {
        const userCredential = await confirmationResult.confirm(enteredOtp);
        setIsLoading(false);
        setIsSuccess(true);
        setTimeout(() => {
          login(`+91 ${phone}`, name);
          handleClose();
        }, 1000);
      } catch (err: any) {
        console.error("Firebase OTP verification failed:", err);
        setIsLoading(false);
        setError("Invalid code. Please check the SMS and try again.");
      }
    } else {
      // --- FALLBACK MOCK VERIFICATION ---
      setTimeout(() => {
        if (enteredOtp === mockOtp) {
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
      }, 1000);
    }
  };

  const handleOtpChange = (value: string, index: number) => {
    if (value && !/^\d$/.test(value)) return;

    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);

    // Auto-focus next box
    if (value && index < 5) {
      otpRefs.current[index + 1]?.focus();
    }

    // Trigger verification if fully filled
    if (newOtp.every(digit => digit !== "")) {
      setTimeout(() => {
        const finalOtp = newOtp.join("");
        setIsLoading(true);
        
        if (isFirebaseConfigured && confirmationResult) {
          confirmationResult.confirm(finalOtp)
            .then(() => {
              setIsLoading(false);
              setIsSuccess(true);
              setTimeout(() => {
                login(`+91 ${phone}`, name);
                handleClose();
              }, 1000);
            })
            .catch((err) => {
              console.error(err);
              setIsLoading(false);
              setError("Invalid code. Please check the SMS and try again.");
            });
        } else {
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
        }
      }, 50);
    }
  };

  const handleKeyDown = (valueIndex: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace" && !otp[valueIndex] && valueIndex > 0) {
      otpRefs.current[valueIndex - 1]?.focus();
    }
  };

  const handleResendOtp = async () => {
    if (timer > 0) return;
    setError("");
    setIsLoading(true);

    if (isFirebaseConfigured && auth) {
      // --- FIREBASE RESEND ---
      const formattedPhone = `+91${phone.replace(/\D/g, "")}`;
      try {
        if (!recaptchaVerifier) {
          throw new Error("reCAPTCHA verifier not initialized.");
        }
        const confirmation = await signInWithPhoneNumber(auth, formattedPhone, recaptchaVerifier);
        setConfirmationResult(confirmation);
        setIsLoading(false);
        setTimer(30);
        setOtp(Array(6).fill(""));
      } catch (err: any) {
        console.error(err);
        setIsLoading(false);
        setError(`Resend Failed: ${err.message || "Unknown error occurred"}`);
      }
    } else {
      // --- MOCK RESEND ---
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
    }
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
    setConfirmationResult(null);
  };

  return (
    <div className="login-modal-overlay">
      {/* Invisible element required by Firebase reCAPTCHA */}
      <div id="recaptcha-container"></div>

      {/* Mock SMS Gateway Toast (only shown in fallback mock mode) */}
      {showToast && !isFirebaseConfigured && (
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
              {isFirebaseConfigured && step === "phone" && (
                <span style={{ fontSize: "0.75rem", color: "#27ae60", fontWeight: 600, display: "block", marginTop: "5px" }}>
                  🛡️ Firebase SMS Service Active
                </span>
              )}
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
                      onKeyDown={(e) => handleKeyDown(idx, e)}
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
