"use client";

import { useEffect, useRef } from "react";

export default function About() {
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("visible");
          }
        });
      },
      { threshold: 0.1 }
    );

    const fadeElements = document.querySelectorAll(".fade-in, .fade-in-left, .fade-in-right");
    fadeElements.forEach((el) => observer.observe(el));

    return () => observer.disconnect();
  }, []);

  return (
    <section className="section about-section" id="about">
      <div className="container">
        <div className="about-grid">
          <div className="about-images fade-in-left">
            <div className="about-img-main">
              <img
                src="/images/logo-official.png"
                alt="CHASHA BAKERS Logo"
                loading="lazy"
              />
            </div>
            <div className="about-exp">
              <h3>chasha</h3>
            </div>
          </div>
          <div className="about-content fade-in-right">
            <div className="section-badge">
              <i className="fas fa-heart"></i> Our Story
            </div>
            <h2>
              Baking <span>Happiness</span>
              <br />
              One Recipe at a Time
            </h2>
            <p>
              At CHASHA BAKERS, we believe that every celebration deserves the perfect treat. Founded with a passion for
              baking, we&apos;ve been serving our community with love, one delicious creation at a time.
            </p>
            <p>
              From classic cakes to artisan cookies, every product is handcrafted using premium ingredients, ensuring
              the finest taste and quality that keeps our customers coming back for more.
            </p>
            <div className="about-features">
              <div className="about-feature">
                <i className="fas fa-check-circle"></i>
                <span>100% Fresh Ingredients</span>
              </div>
              <div className="about-feature">
                <i className="fas fa-check-circle"></i>
                <span>Handcrafted Daily</span>
              </div>
              <div className="about-feature">
                <i className="fas fa-check-circle"></i>
                <span>Custom Orders Welcome</span>
              </div>
              <div className="about-feature">
                <i className="fas fa-check-circle"></i>
                <span>Home Delivery Available</span>
              </div>
              <div className="about-feature">
                <i className="fas fa-check-circle"></i>
                <span>Eggless Options</span>
              </div>
              <div className="about-feature">
                <i className="fas fa-check-circle"></i>
                <span>Hygienic Packaging</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
