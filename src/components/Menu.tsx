"use client";

import { useState } from "react";
import { PRODUCTS, Product } from "@/data/products";

export default function Menu({ onOrder }: { onOrder: (product: Product) => void }) {
  const [filter, setFilter] = useState("all");
  const categories = ["all", "cupcakes", "donuts", "filled donuts", "muffins", "teacakes", "brownies", "custom cakes"];

  const filteredProducts = filter === "all" 
    ? PRODUCTS 
    : PRODUCTS.filter(p => p.category === filter);

  return (
    <section className="section menu-section" id="menu">
      <div className="container">
        <div className="section-header">
          <div className="section-badge">
            <i className="fas fa-utensils"></i> Our Delicious Menu
          </div>
          <h2 className="section-title">
            Explore Our <span>Menu</span>
          </h2>
          <p className="section-desc">
            Discover a wide range of freshly baked goods made with love and premium ingredients.
          </p>
          <p className="image-disclaimer">
            * The images you see are just for reference to help you understand the items — they may not exactly match the real item.
          </p>
        </div>
        <div className="menu-filters">
          {categories.map((cat) => (
            <button
              key={cat}
              className={`filter-btn ${filter === cat ? "active" : ""}`}
              onClick={() => setFilter(cat)}
            >
              {cat.charAt(0).toUpperCase() + cat.slice(1)}
            </button>
          ))}
        </div>
        <div className="menu-grid">
          {filteredProducts.map((p) => (
            <div key={p.id} className="product-card fade-in visible">
              <div className="product-img">
                <img src={p.image} alt={p.name} loading="lazy" />
                {p.badge && <span className="product-badge">{p.badge}</span>}
                <button className="product-fav">
                  <i className="fas fa-heart"></i>
                </button>
              </div>
              <div className="product-info">
                <div className="product-category">{p.category}</div>
                <h3 className="product-name">{p.name}</h3>
                <p className="product-desc">{p.desc}</p>
                <div className="product-bottom">
                  <div className="product-price">
                    {p.price === 0 ? "Price depends" : `₹${p.price}`}
                  </div>
                  <div className="product-actions">
                    <button 
                        className="btn-whatsapp" 
                        title="Order on WhatsApp"
                        onClick={() => window.open(`https://wa.me/918296339002?text=Hi! I want to order ${p.name}`, '_blank')}
                    >
                      <i className="fab fa-whatsapp"></i>
                    </button>
                    <button className="btn-order" onClick={() => onOrder(p)}>
                      Order
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
