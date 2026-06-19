"use client";

import { useState, useEffect } from "react";
import { saveOrder } from "../lib/db";

interface Product {
  id: number;
  name: string;
  category: string;
  price: number;
  desc: string;
  image: string;
}

interface OrderModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedProduct: Product | null;
  products: Product[];
}

export default function OrderModal({ isOpen, onClose, selectedProduct, products }: OrderModalProps) {
  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    email: "",
    productId: "",
    qty: 1,
    notes: "",
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (selectedProduct) {
      setFormData((prev) => ({ ...prev, productId: selectedProduct.id.toString() }));
    }
  }, [selectedProduct]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    const product = products.find((p) => p.id.toString() === formData.productId);
    if (!product) return;

    const cleanPhone = formData.phone.replace(/\D/g, "");
    if (cleanPhone.length < 10) {
      setError("Please enter a valid 10-digit phone number.");
      return;
    }

    // 1. Open popup window in the synchronous tick to bypass browser pop-up blockers
    let newWindow: Window | null = null;
    try {
      newWindow = window.open("", "_blank");
    } catch (err) {
      console.warn("Failed to pre-open window, will redirect in current tab:", err);
    }

    setIsLoading(true);

    try {
      const orderItem = {
        productId: product.id.toString(),
        name: product.name,
        price: product.price,
        qty: formData.qty,
      };

      const totalPrice = product.price * formData.qty;

      // 2. Save order to database
      const saved = await saveOrder({
        customerName: formData.name.trim(),
        customerPhone: cleanPhone,
        items: [orderItem],
        quantity: formData.qty,
        totalAmount: totalPrice,
        notes: formData.notes.trim(),
      });

      // 3. Generate WhatsApp text
      const totalDisplay = product.price === 0 ? "Price depends" : `₹${totalPrice}`;
      const msg = encodeURIComponent(
        `Hi CHASHA BAKERS! 🧁\n\nI'd like to place an order:\n\nOrder ID: *${saved.id}*\n👤 Name: *${formData.name.trim()}*\n📱 Phone: *${formData.phone}*\n📦 Product: *${product.name}*\n🔢 Quantity: *${formData.qty}*\n💰 Total: *${totalDisplay}*\n📝 Notes: ${formData.notes.trim() || 'None'}\n\nPlease confirm my order. Thank you!`
      );

      const whatsappUrl = `https://wa.me/919353995224?text=${msg}`;

      // 4. Redirect to WhatsApp
      if (newWindow) {
        newWindow.location.href = whatsappUrl;
      } else {
        window.location.href = whatsappUrl;
      }

      onClose();
    } catch (err: any) {
      console.error("Failed to process order:", err);
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
    <div className={`modal-overlay active`} onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <button className="modal-close" onClick={onClose} disabled={isLoading}>
          &times;
        </button>
        <h2>Place Your Order</h2>
        <p style={{ color: "var(--text-light)", fontSize: "0.9rem", marginBottom: "20px" }}>Fill in details to place a direct order via WhatsApp.</p>
        
        {error && (
          <div className="cart-error-banner" style={{ marginBottom: "16px" }}>
            {error}
          </div>
        )}

        <div className="product-selected" style={{ marginBottom: "20px" }}>
          <i className="fas fa-birthday-cake"></i>
          <span>
            {selectedProduct?.name || "Select a product"}
          </span>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Your Name *</label>
            <input
              type="text"
              placeholder="Enter your full name"
              required
              disabled={isLoading}
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            />
          </div>
          <div className="form-group">
            <label>Phone Number *</label>
            <input
              type="tel"
              placeholder="Enter your phone number"
              required
              disabled={isLoading}
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
            />
          </div>
          <div className="form-group">
            <label>Product *</label>
            <select
              required
              disabled={isLoading}
              value={formData.productId}
              onChange={(e) => setFormData({ ...formData, productId: e.target.value })}
            >
              <option value="">-- Select a Product --</option>
              {products.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name} - {p.price === 0 ? "Price depends" : `₹${p.price}`}
                </option>
              ))}
            </select>
          </div>
          <div className="form-group">
            <label>Quantity</label>
            <div className="qty-control">
              <button
                type="button"
                className="qty-btn"
                disabled={isLoading}
                onClick={() => setFormData({ ...formData, qty: Math.max(1, formData.qty - 1) })}
              >
                −
              </button>
              <input type="number" className="qty-input" value={formData.qty} readOnly />
              <button
                type="button"
                className="qty-btn"
                disabled={isLoading}
                onClick={() => setFormData({ ...formData, qty: Math.min(50, formData.qty + 1) })}
              >
                +
              </button>
            </div>
          </div>
          <div className="form-group">
            <label>Special Notes</label>
            <textarea
              placeholder="Any special requests (e.g., eggless, message on cake, etc.)"
              disabled={isLoading}
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
            ></textarea>
          </div>
          <button type="submit" className="form-submit" disabled={isLoading} style={{ width: "100%", height: "48px", background: "#25D366" }}>
            {isLoading ? (
              <span className="login-spinner"></span>
            ) : (
              <>
                <i className="fab fa-whatsapp"></i> Order via WhatsApp
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
