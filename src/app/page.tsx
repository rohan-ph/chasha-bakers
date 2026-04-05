"use client";

import { useState } from "react";
import Navbar from "@/components/Navbar";
import Hero from "@/components/Hero";
import About from "@/components/About";
import Specialties from "@/components/Specialties";
import Menu from "@/components/Menu";
import { Testimonials, Contact, Footer } from "@/components/Footer";
import OrderModal from "@/components/OrderModal";
import { PRODUCTS, Product } from "@/data/products";

export default function Home() {
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleOrder = (product: Product) => {
    setSelectedProduct(product);
    setIsModalOpen(true);
  };

  return (
    <main>
      <Navbar />
      <Hero />
      <About />
      <Specialties />
      <Menu onOrder={handleOrder} />
      <Testimonials />
      <Contact />
      <Footer />

      <OrderModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        selectedProduct={selectedProduct}
        products={PRODUCTS}
      />

      <a
        href="https://wa.me/918296339002"
        target="_blank"
        className="whatsapp-float"
        title="Chat on WhatsApp"
      >
        <i className="fab fa-whatsapp"></i>
      </a>
    </main>
  );
}
