"use client";

import { useState, useEffect } from "react";
import Navbar from "@/components/Navbar";
import Hero from "@/components/Hero";
import About from "@/components/About";
import Specialties from "@/components/Specialties";
import Menu from "@/components/Menu";
import { Testimonials, Contact, Footer } from "@/components/Footer";
import { CartProvider } from "../context/CartContext";
import CartDrawer from "../components/CartDrawer";
import OrderModal from "@/components/OrderModal";
import { subscribeToProducts, DbProduct, localProducts } from "@/lib/db";

export default function Home() {
  const [selectedProduct, setSelectedProduct] = useState<any | null>(null);
  const [isOrderModalOpen, setIsOrderModalOpen] = useState(false);
  const [products, setProducts] = useState<DbProduct[]>(localProducts);

  useEffect(() => {
    const unsubscribe = subscribeToProducts((list) => {
      setProducts(list);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (typeof window !== "undefined") {
      // Prevent browser scroll restoration on refresh
      if ("scrollRestoration" in window.history) {
        window.history.scrollRestoration = "manual";
      }

      // Clear the hash from the URL to prevent section anchoring on refresh
      if (window.location.hash) {
        window.history.replaceState(
          null,
          "",
          window.location.pathname + window.location.search
        );
      }

      // Scroll to top immediately
      window.scrollTo(0, 0);

      // Scroll after a tiny layout settle tick to be absolutely sure
      const t = setTimeout(() => {
        window.scrollTo(0, 0);
      }, 50);

      return () => clearTimeout(t);
    }
  }, []);

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
          products={products}
        />

        <a
          href="https://wa.me/919353995224"
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
