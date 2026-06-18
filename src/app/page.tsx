"use client";

import { useState } from "react";
import Navbar from "@/components/Navbar";
import Hero from "@/components/Hero";
import About from "@/components/About";
import Specialties from "@/components/Specialties";
import Menu from "@/components/Menu";
import { Testimonials, Contact, Footer } from "@/components/Footer";
import { CartProvider } from "../context/CartContext";
import CartDrawer from "../components/CartDrawer";
import OrderModal from "@/components/OrderModal";
import { localProducts } from "@/lib/db";

export default function Home() {
  const [selectedProduct, setSelectedProduct] = useState<any | null>(null);
  const [isOrderModalOpen, setIsOrderModalOpen] = useState(false);

  const handleOrderClick = (product: any) => {
    setSelectedProduct(product);
    setIsOrderModalOpen(true);
  };

  return (
    <CartProvider>
      <main>
        <Navbar />
        <Hero />
        <About />
        <Specialties />
        <Menu onOrder={handleOrderClick} />
        <Testimonials />
        <Contact />
        <Footer />

        <CartDrawer />

        <OrderModal
          isOpen={isOrderModalOpen}
          onClose={() => setIsOrderModalOpen(false)}
          selectedProduct={selectedProduct}
          products={localProducts}
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
    </CartProvider>
  );
}
