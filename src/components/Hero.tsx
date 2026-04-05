"use client";

import Image from "next/image";
import Link from "next/link";

export default function Hero() {
  return (
    <section className="hero" id="home">
      <div className="hero-bg-pattern"></div>
      <div className="hero-float-1"></div>
      <div className="hero-float-2"></div>
      <div className="hero-float-3"></div>
      <div className="hero-container">
        <div className="hero-content">
          <div className="hero-badge">
            <i className="fas fa-award"></i> Premium Quality Baked Goods
          </div>
          <h1 className="hero-title">
            Freshly Baked<br />
            With <span>Love & Care</span>
          </h1>
          <p className="hero-script">~ From our oven to your heart ~</p>
          <p className="hero-desc">
            Welcome to CHASHA BAKERS — where every bite tells a story of passion, tradition, and the finest ingredients.
            Experience the joy of artisan baking delivered right to your doorstep.
          </p>
          <div className="hero-btns">
            <a href="#menu" className="btn-primary">
              <i className="fas fa-utensils"></i> Explore Menu
            </a>
            <Link
              href="https://wa.me/918296339002?text=Hi%20CHASHA%20BAKERS!%20I'd%20like%20to%20place%20an%20order."
              target="_blank"
              className="btn-secondary"
            >
              <i className="fab fa-whatsapp"></i> WhatsApp Us
            </Link>
          </div>
          <div className="hero-stats">
            <div className="hero-stat">
              <h3>25+</h3>
              <p>Menu Items</p>
            </div>
            <div className="hero-stat">
              <h3>100%</h3>
              <p>Fresh &amp; Natural</p>
            </div>
          </div>
        </div>
        <div className="hero-visual">
          <div className="hero-img-container">
            <img
              src="https://images.unsplash.com/photo-1558961363-fa8fdf82db35?w=600&h=600&fit=crop"
              alt="Delicious Cakes"
              loading="lazy"
            />
          </div>
          <div className="hero-card hero-card-1">
            <div className="hero-card-icon" style={{ background: "#FFF3E0", color: "#E65100" }}>🎂</div>
            <div>
              <h4>Custom Cakes</h4>
              <p>Made to order</p>
            </div>
          </div>
          <div className="hero-card hero-card-2">
            <div className="hero-card-icon" style={{ background: "#E8F5E9", color: "#2E7D32" }}>⭐</div>
            <div>
              <h4>5-Star Rated</h4>
              <p>by 500+ customers</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
