"use client";

export default function Specialties() {
  return (
    <section className="section specialties">
      <div className="container">
        <div className="section-header">
          <div className="section-badge">
            <i className="fas fa-star"></i> What Makes Us Special
          </div>
          <h2 className="section-title">
            Why Choose <span>CHASHA BAKERS</span>
          </h2>
          <p className="section-desc" style={{ color: "rgba(255,255,255,0.7)" }}>
            Every product is a promise of quality, taste, and happiness.
          </p>
        </div>
        <div className="spec-grid">
          <div className="spec-card fade-in">
            <div className="spec-icon">
              <i className="fas fa-leaf"></i>
            </div>
            <h3>Fresh Ingredients</h3>
            <p>We use only the finest, freshest ingredients sourced locally for every recipe.</p>
          </div>
          <div className="spec-card fade-in">
            <div className="spec-icon">
              <i className="fas fa-hand-sparkles"></i>
            </div>
            <h3>Handcrafted</h3>
            <p>Every item is lovingly handcrafted by our skilled bakers with years of experience.</p>
          </div>
          <div className="spec-card fade-in">
            <div className="spec-icon">
              <i className="fas fa-truck"></i>
            </div>
            <h3>Fast Delivery</h3>
            <p>Quick and safe delivery to your doorstep, ensuring freshness on arrival.</p>
          </div>
          <div className="spec-card fade-in">
            <div className="spec-icon">
              <i className="fas fa-heart"></i>
            </div>
            <h3>Made with Love</h3>
            <p>Each creation carries our passion and dedication to making you smile.</p>
          </div>
        </div>
      </div>
    </section>
  );
}
