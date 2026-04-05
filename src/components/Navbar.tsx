"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

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
            <i className="fas fa-birthday-cake"></i>
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

      </div>
    </nav>
  );
}
