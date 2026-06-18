"use client";

import React, { useState } from "react";
import { useCart } from "../context/CartContext";
import { saveOrder } from "../lib/db";

export default function CartDrawer() {
  const {
    cart,
    isCartOpen,
    setIsCartOpen,
    removeFromCart,
    updateQty,
    clearCart,
    totalItems,
    totalPrice,
  } = useCart();

  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    notes: "",
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  if (!isCartOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (cart.length === 0) {
      setError("Your cart is empty.");
      return;
    }

    const cleanPhone = formData.phone.replace(/\D/g, "");
    if (cleanPhone.length < 10) {
      setError("Please enter a valid 10-digit phone number.");
      return;
    }

    // 1. Open popup window in the synchronous tick to bypass browser pop-up blockers
    let newWindow: Window | null = null;
    try {
      newWindow = window.open("", "_blank");
    } catch (e) {
      console.warn("Failed to pre-open window, will redirect in current tab:", e);
    }

    setIsLoading(true);

    try {
      // 2. Prepare order items for DB
      const orderedItems = cart.map((item) => ({
        productId: item.product.id.toString(),
        name: item.product.name,
        price: item.product.price,
        qty: item.qty,
      }));

      // 3. Save order to database (with a 1.5-second timeout fallback so that offline database hangs do not block checkout)
      let saved;
      try {
        const dbPromise = saveOrder({
          customerName: formData.name.trim(),
          customerPhone: cleanPhone,
          items: orderedItems,
          quantity: totalItems,
          totalAmount: totalPrice,
          notes: formData.notes.trim(),
        });

        // Prevent unhandled promise rejection if write fails in background after timeout
        dbPromise.catch((e) => {
          console.warn("Background order write failed or timed out:", e);
        });

        saved = await Promise.race([
          dbPromise,
          new Promise<any>((_, reject) =>
            setTimeout(() => reject(new Error("Database write timeout")), 1500)
          )
        ]);
      } catch (dbErr) {
        console.error("Database save failed, using local generation:", dbErr);
        saved = {
          id: "CB" + Math.floor(100000 + Math.random() * 900000),
          customerName: formData.name.trim(),
          customerPhone: cleanPhone,
          items: orderedItems,
          quantity: totalItems,
          totalAmount: totalPrice,
          notes: formData.notes.trim(),
        };
      }

      // 4. Generate WhatsApp text
      const itemsListText = cart
        .map((item) => {
          const itemPriceText = item.product.price === 0 ? "Price depends" : `₹${item.product.price * item.qty}`;
          return `- ${item.product.name} x ${item.qty} (${itemPriceText})`;
        })
        .join("\n");

      const totalDisplay = totalPrice === 0 ? "Price depends" : `₹${totalPrice}`;
      const msg = encodeURIComponent(
        `Hi CHASHA BAKERS! 🧁\n\nI'd like to place an order:\n\nOrder ID: *${saved.id}*\n👤 Name: *${formData.name.trim()}*\n📱 Phone: *${formData.phone}*\n\n📦 Ordered Items:\n${itemsListText}\n\n💰 Total Amount: *${totalDisplay}*\n📝 Notes: ${formData.notes.trim() || "None"}\n\nPlease confirm my order. Thank you!`
      );

      const whatsappUrl = `https://wa.me/918296339002?text=${msg}`;

      // 5. Redirect to WhatsApp
      if (newWindow) {
        newWindow.location.href = whatsappUrl;
      } else {
        window.location.href = whatsappUrl;
      }

      // 6. Success state cleanup
      clearCart();
      setIsCartOpen(false);
      setFormData({ name: "", phone: "", notes: "" });
    } catch (err: any) {
      console.error("Failed to save order:", err);
      if (newWindow) {
        try {
          newWindow.close();
        } catch (closeErr) {}
      }
      setError("Failed to process order. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="cart-drawer-overlay" onClick={() => setIsCartOpen(false)}>
      <div className="cart-drawer" onClick={(e) => e.stopPropagation()}>
        <div className="cart-drawer-header">
          <h3>
            <i className="fas fa-shopping-bag" style={{ marginRight: "10px", color: "var(--primary)" }}></i>
            Your Cart ({totalItems})
          </h3>
          <button className="cart-drawer-close" onClick={() => setIsCartOpen(false)}>
            &times;
          </button>
        </div>

        {error && <div className="cart-error-banner">{error}</div>}

        {cart.length === 0 ? (
          <div className="cart-drawer-empty">
            <i className="fas fa-cookie-bite empty-icon"></i>
            <p>Your cart is empty.</p>
            <button className="btn-primary" style={{ marginTop: "20px" }} onClick={() => setIsCartOpen(false)}>
              Browse Menu
            </button>
          </div>
        ) : (
          <>
            <div className="cart-items-list">
              {cart.map((item) => (
                <div key={item.product.id} className="cart-item-row">
                  <div className="cart-item-img">
                    <img src={item.product.image} alt={item.product.name} />
                  </div>
                  <div className="cart-item-details">
                    <h4>{item.product.name}</h4>
                    <div className="cart-item-price">
                      {item.product.price === 0 ? "Price depends" : `₹${item.product.price} each`}
                    </div>
                    <div className="cart-item-actions">
                      <div className="qty-control" style={{ transform: "scale(0.85)", transformOrigin: "left center" }}>
                        <button
                          type="button"
                          className="qty-btn"
                          onClick={() => updateQty(item.product.id, item.qty - 1)}
                        >
                          −
                        </button>
                        <span className="qty-input" style={{ display: "inline-flex", alignItems: "center", justifyContent: "center" }}>
                          {item.qty}
                        </span>
                        <button
                          type="button"
                          className="qty-btn"
                          onClick={() => updateQty(item.product.id, item.qty + 1)}
                        >
                          +
                        </button>
                      </div>
                      <button className="cart-item-delete" onClick={() => removeFromCart(item.product.id)}>
                        <i className="fas fa-trash-alt"></i> Remove
                      </button>
                    </div>
                  </div>
                  <div className="cart-item-subtotal">
                    {item.product.price === 0 ? "TBD" : `₹${item.product.price * item.qty}`}
                  </div>
                </div>
              ))}
            </div>

            <div className="cart-drawer-summary">
              <div className="cart-summary-row">
                <span>Subtotal</span>
                <strong>{totalPrice === 0 ? "Price depends" : `₹${totalPrice}`}</strong>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="cart-checkout-form">
              <h4>Delivery & Contact Information</h4>
              <div className="form-group">
                <label>Your Name *</label>
                <input
                  type="text"
                  placeholder="Enter your full name"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  disabled={isLoading}
                />
              </div>
              <div className="form-group">
                <label>Phone Number *</label>
                <input
                  type="tel"
                  placeholder="Enter your phone number"
                  required
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  disabled={isLoading}
                />
              </div>
              <div className="form-group">
                <label>Special Notes</label>
                <textarea
                  placeholder="Eggless, message on cake, or other requests..."
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  disabled={isLoading}
                />
              </div>

              <button type="submit" className="cart-checkout-btn" disabled={isLoading}>
                {isLoading ? (
                  <span className="login-spinner"></span>
                ) : (
                  <>
                    <i className="fab fa-whatsapp" style={{ marginRight: "8px" }}></i>
                    Place Order via WhatsApp
                  </>
                )}
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  );
}
