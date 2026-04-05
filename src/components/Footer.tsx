"use client";

import Link from "next/link";

export function Testimonials() {
  const reviews = [
    { name: "Anitha R.", initial: "A", text: "The chocolate truffle cake was absolutely divine! Best bakery in town. Every order has been consistent in quality. Highly recommend CHASHA BAKERS!" },
    { name: "Priya S.", initial: "P", text: "Ordered a custom birthday cake for my daughter and it was stunning! The taste was even better than expected. Thank you for making her day special!" },
    { name: "Rohan K.", initial: "R", text: "Fresh, delicious, and beautifully packaged. The cookies are addictive! I've been ordering weekly for my family. Great service via WhatsApp too!" },
  ];

  return (
    <section className="section testimonials-section" id="testimonials">
      <div className="container">
        <div className="section-header">
          <div className="section-badge"><i className="fas fa-quote-left"></i> Customer Love</div>
          <h2 className="section-title">What Our <span>Customers Say</span></h2>
          <p className="section-desc">Don't just take our word for it — hear from our happy customers!</p>
        </div>
        <div className="testimonial-grid">
          {reviews.map((r, i) => (
            <div key={i} className="testimonial-card fade-in visible">
              <div className="testimonial-quote">"</div>
              <p className="testimonial-text">{r.text}</p>
              <div className="testimonial-author">
                <div className="testimonial-avatar">{r.initial}</div>
                <div>
                  <div className="testimonial-name">{r.name}</div>
                  <div className="testimonial-rating">⭐⭐⭐⭐⭐</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

import { useState } from "react";

export function Contact() {
  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    email: "",
    message: ""
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const whatsappNumber = "918296339002"; // CHASHA BAKERS number
    const text = `Hi CHASHA BAKERS! I'd like to get in touch.
    
*Name:* ${formData.name}
*Phone:* ${formData.phone}
*Email:* ${formData.email || 'N/A'}
*Message:* ${formData.message}

Looking forward to hearing from you!`;

    const encodedText = encodeURIComponent(text);
    window.open(`https://wa.me/${whatsappNumber}?text=${encodedText}`, '_blank');
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  return (
    <section className="section contact-section" id="contact">
      <div className="container">
        <div className="section-header">
          <div className="section-badge"><i className="fas fa-envelope"></i> Get In Touch</div>
          <h2 className="section-title">Contact <span>Us</span></h2>
          <p className="section-desc">Have a question or want to place a special order? We'd love to hear from you!</p>
        </div>
        <div className="contact-grid">
          <div className="contact-info fade-in-left visible">
            <h3>Let's Connect</h3>
            <p>Whether you want to place an order, customize a cake, or just say hello — we're here for you. Reach out through any of the channels below.</p>
            <div className="contact-item">
              <div className="contact-icon"><i className="fas fa-phone"></i></div>
              <div>
                <h4>Phone</h4>
                <p><a href="tel:+918296339002">+91 8296339002</a></p>
              </div>
            </div>
            <div className="contact-item">
              <div className="contact-icon"><i className="fas fa-envelope"></i></div>
              <div>
                <h4>Email</h4>
                <p><a href="mailto:charithaloganathan@gmail.com">charithaloganathan@gmail.com</a></p>
              </div>
            </div>
          </div>
          <div className="contact-form fade-in-right visible">
            <h3>Send us a Message</h3>
            <form onSubmit={handleSubmit}>
              <div className="form-row">
                <div className="form-group">
                  <label>Your Name</label>
                  <input 
                    type="text" 
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    placeholder="Enter your name" 
                    required 
                  />
                </div>
                <div className="form-group">
                  <label>Phone Number</label>
                  <input 
                    type="tel" 
                    name="phone"
                    value={formData.phone}
                    onChange={handleChange}
                    placeholder="Enter phone number" 
                    required 
                  />
                </div>
              </div>
              <div className="form-group">
                <label>Email</label>
                <input 
                  type="email" 
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="Enter your email" 
                />
              </div>
              <div className="form-group">
                <label>Message</label>
                <textarea 
                  name="message"
                  value={formData.message}
                  onChange={handleChange}
                  placeholder="Tell us how we can help..."
                  required
                ></textarea>
              </div>
              <button type="submit" className="form-submit"><i className="fas fa-paper-plane"></i> Send Message</button>
            </form>
          </div>
        </div>
      </div>
    </section>
  );
}

export function Footer() {
  return (
    <footer>
      <div className="footer-grid">
        <div className="footer-brand">
          <h3>🧁 CHASHA BAKERS</h3>
          <p>Baking happiness since day one. We bring you the finest handcrafted baked goods made with love, premium ingredients, and a whole lot of passion.</p>
          <div className="footer-social">
            <Link href="#"><i className="fab fa-facebook-f"></i></Link>
            <Link href="#"><i className="fab fa-instagram"></i></Link>
          </div>
        </div>
        <div className="footer-col">
          <h4>Quick Links</h4>
          <Link href="#home">Home</Link>
          <Link href="#about">About Us</Link>
          <Link href="#menu">Our Menu</Link>
          <Link href="#contact">Contact</Link>
        </div>
        <div className="footer-col">
          <h4>Contact Info</h4>
          <a href="tel:+918296339002"><i className="fas fa-phone"></i> +91 8296339002</a>
          <a href="mailto:charithaloganathan@gmail.com"><i className="fas fa-envelope"></i> charithaloganathan@gmail.com</a>
        </div>
      </div>
      <div className="footer-bottom">
        <p>© 2025 CHASHA BAKERS. All rights reserved. Made with ❤️ for baking lovers.</p>
      </div>
    </footer>
  );
}
