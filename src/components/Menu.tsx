"use client";

import { useState, useEffect } from "react";
import { useCart } from "../context/CartContext";
import { subscribeToProducts, DbProduct, localProducts } from "../lib/db";

export default function Menu({ onOrder }: { onOrder: (product: any) => void }) {
  const [filter, setFilter] = useState("all");
  const [products, setProducts] = useState<DbProduct[]>(localProducts);
  const { addToCart } = useCart();

  useEffect(() => {
    // Subscribe to real-time products
    const unsubscribe = subscribeToProducts((list) => {
      setProducts(list);
    });
    return () => unsubscribe();
  }, []);

  // Get unique categories from active products
  const categories = ["all", "cupcakes", "donuts", "filled donuts", "muffins", "teacakes", "brownies", "custom cakes"];

  const filteredProducts = filter === "all" 
    ? products 
    : products.filter(p => p.category === filter);

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
          {filteredProducts.map((p) => {
            const isAvailable = p.available !== false;
            return (
              <div key={p.id} className={`product-card fade-in visible ${!isAvailable ? "sold-out" : ""}`}>
                <div className="product-img">
                  <img src={p.image} alt={p.name} loading="lazy" />
                  {!isAvailable && <span className="product-badge" style={{ background: "#7f8c8d" }}>Sold Out</span>}
                  {isAvailable && p.badge && <span className="product-badge">{p.badge}</span>}
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
                      {isAvailable ? (
                        <>
                          <button 
                            className="btn-whatsapp" 
                            title="Add to Cart"
                            onClick={() => addToCart(p, 1)}
                            style={{ background: "var(--primary-light)" }}
                          >
                            <i className="fas fa-cart-plus"></i> Add
                          </button>
                          <button className="btn-order" onClick={() => addToCart(p, 1)}>
                            Order
                          </button>
                        </>
                      ) : (
                        <button className="btn-order" disabled style={{ background: "#bdc3c7", cursor: "not-allowed" }}>
                          Unavailable
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
