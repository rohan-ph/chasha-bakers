"use client";

import { useState, useEffect } from "react";

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

  useEffect(() => {
    if (selectedProduct) {
      setFormData((prev) => ({ ...prev, productId: selectedProduct.id.toString() }));
    }
  }, [selectedProduct]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const product = products.find((p) => p.id.toString() === formData.productId);
    if (!product) return;

    const totalDisplay = product.price === 0 ? "Price depends" : `₹${product.price * formData.qty}`;
    const msg = encodeURIComponent(
      `Hi CHASHA BAKERS! 🧁\n\nI'd like to place an order:\n\n👤 Name: ${formData.name}\n📱 Phone: ${formData.phone}\n📦 Product: ${product.name}\n🔢 Quantity: ${formData.qty}\n💰 Total: ${totalDisplay}\n📝 Notes: ${formData.notes || 'None'}\n\nPlease confirm my order. Thank you!`
    );
    window.open(`https://wa.me/918296339002?text=${msg}`, "_blank");
    onClose();
  };

  return (
    <div className={`modal-overlay active`}>
      <div className="modal">
        <button className="modal-close" onClick={onClose}>
          <i className="fas fa-times"></i>
        </button>
        <h2>Place Your Order</h2>
        <div className="product-selected">
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
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
            />
          </div>
          <div className="form-group">
            <label>Product *</label>
            <select
              required
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
                onClick={() => setFormData({ ...formData, qty: Math.max(1, formData.qty - 1) })}
              >
                −
              </button>
              <input type="number" className="qty-input" value={formData.qty} readOnly />
              <button
                type="button"
                className="qty-btn"
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
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
            ></textarea>
          </div>
          <button type="submit" className="form-submit">
            <i className="fab fa-whatsapp"></i> Order via WhatsApp
          </button>
        </form>
      </div>
    </div>
  );
}
