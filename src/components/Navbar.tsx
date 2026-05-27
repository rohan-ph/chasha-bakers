"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useAuth } from "../context/AuthContext";

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { user, setShowLoginModal, logout, isInitialized } = useAuth();

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 50);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <nav className={scrolled ? "scrolled" : ""}>
      <div className="nav-container">
        <Link href="/" className="nav-logo">
          <div className="nav-logo-icon">
            <img src="/logo.png" alt="Chasha Bakers Logo" width={45} height={45} />
          </div>
          <span className="nav-logo-text">CHASHA BAKERS</span>
        </Link>
        <ul className="nav-links">
          <li>
            <Link href="#home">Home</Link>
          </li>
          <li>
            <Link href="#about">About</Link>
          </li>
          <li>
            <Link href="#menu">Menu</Link>
          </li>
          <li>
            <Link href="#testimonials">Reviews</Link>
          </li>
          <li>
            <Link href="#contact">Contact</Link>
          </li>
          <li>
            <Link href="#menu" className="nav-cta">
              Order Now
            </Link>
          </li>
          {isInitialized && (
            <li>
              {user ? (
                <div className="nav-user-profile">
                  <div className="nav-user-avatar">{user.initial}</div>
                  <span className="nav-user-name">{user.name}</span>
                  <button className="nav-user-logout-btn" onClick={logout} title="Logout">
                    <i className="fas fa-sign-out-alt"></i>
                  </button>
                </div>
              ) : (
                <button
                  className="nav-login-btn"
                  onClick={() => setShowLoginModal(true)}
                >
                  Login
                </button>
              )}
            </li>
          )}
        </ul>
        <button
          className={`hamburger ${mobileMenuOpen ? "active" : ""}`}
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
        >
          <span></span>
          <span></span>
          <span></span>
        </button>
      </div>
      <div className={`mobile-menu ${mobileMenuOpen ? "active" : ""}`}>
        <Link href="#home" onClick={() => setMobileMenuOpen(false)}>
          Home
        </Link>
        <Link href="#about" onClick={() => setMobileMenuOpen(false)}>
          About
        </Link>
        <Link href="#menu" onClick={() => setMobileMenuOpen(false)}>
          Menu
        </Link>
        <Link href="#testimonials" onClick={() => setMobileMenuOpen(false)}>
          Reviews
        </Link>
        <Link href="#contact" onClick={() => setMobileMenuOpen(false)}>
          Contact
        </Link>
        <Link
          href="#menu"
          onClick={() => setMobileMenuOpen(false)}
          style={{ color: "var(--primary)", fontWeight: 600 }}
        >
          Order Now
        </Link>
        {isInitialized && (
          <div style={{ marginTop: "15px", paddingTop: "15px", borderTop: "1px solid var(--cream-dark)" }}>
            {user ? (
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                  <div className="nav-user-avatar">{user.initial}</div>
                  <span className="nav-user-name" style={{ fontWeight: 600 }}>{user.name}</span>
                </div>
                <button
                  className="nav-user-logout-btn"
                  onClick={() => {
                    logout();
                    setMobileMenuOpen(false);
                  }}
                  style={{ fontSize: "1rem", display: "flex", alignItems: "center", gap: "6px" }}
                >
                  <i className="fas fa-sign-out-alt"></i> Logout
                </button>
              </div>
            ) : (
              <button
                className="nav-cta"
                onClick={() => {
                  setShowLoginModal(true);
                  setMobileMenuOpen(false);
                }}
                style={{ width: "100%", textAlign: "center" }}
              >
                Login
              </button>
            )}
          </div>
        )}
      </div>
    </nav>
  );
}
