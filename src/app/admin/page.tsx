"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  fetchProducts,
  addProduct,
  updateProduct,
  deleteProduct,
  updateReviewStatus,
  deleteReview,
  updateOrderStatus,
  subscribeToProducts,
  subscribeToAllReviews,
  subscribeToOrders,
  DbProduct,
  DbReview,
  DbOrder,
  localProducts
} from "@/lib/db";
import { isFirebaseConfigured, db } from "@/lib/firebase";
import { getStorage, ref, uploadBytes, getDownloadURL } from "firebase/storage";

// Hashing helper for local login check (SHA-256)
async function sha256(message: string) {
  const msgBuffer = new TextEncoder().encode(message);
  const hashBuffer = await crypto.subtle.digest("SHA-256", msgBuffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

export default function AdminPage() {
  const router = useRouter();

  // Authentication State
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [checkingAuth, setCheckingAuth] = useState(true);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loginError, setLoginError] = useState("");
  const [loginLoading, setLoginLoading] = useState(false);
  const [loggedInUser, setLoggedInUser] = useState("admin");

  // Change Credentials Modal State
  const [isCredsModalOpen, setIsCredsModalOpen] = useState(false);
  const [credsForm, setCredsForm] = useState({
    newUsername: "",
    newPassword: "",
    confirmPassword: ""
  });
  const [credsError, setCredsError] = useState("");
  const [credsLoading, setCredsLoading] = useState(false);

  // Active Tab
  const [activeTab, setActiveTab] = useState<"products" | "orders" | "reviews">("products");

  // Real-time Data Lists
  const [products, setProducts] = useState<DbProduct[]>(localProducts);
  const [orders, setOrders] = useState<DbOrder[]>([]);
  const [reviews, setReviews] = useState<DbReview[]>([]);

  // Search & Filters (Orders)
  const [orderSearch, setOrderSearch] = useState("");
  const [orderFilter, setOrderFilter] = useState<string>("All");

  // Modals & Product Form State
  const [isProductModalOpen, setIsProductModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<DbProduct | null>(null);
  const [productForm, setProductForm] = useState({
    name: "",
    category: "cupcakes",
    price: 0,
    desc: "",
    image: "",
    badge: "",
    available: true
  });
  const [uploadingImage, setUploadingImage] = useState(false);
  const [productFormError, setProductFormError] = useState("");
  const [showNewCategoryInput, setShowNewCategoryInput] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState("");

  // Customer Order History Modal
  const [selectedCustomerPhone, setSelectedCustomerPhone] = useState<string | null>(null);
  const [selectedCustomerName, setSelectedCustomerName] = useState("");

  // Check auth session on load
  useEffect(() => {
    async function checkSession() {
      try {
        const res = await fetch("/api/admin/check");
        if (res.ok) {
          const data = await res.json();
          setIsAuthenticated(true);
          if (data.username) {
            setLoggedInUser(data.username);
          }
        } else {
          setIsAuthenticated(false);
        }
      } catch (err) {
        setIsAuthenticated(false);
      } finally {
        setCheckingAuth(false);
      }
    }
    checkSession();
  }, []);

  // Subscribe to real-time updates once authenticated
  useEffect(() => {
    if (!isAuthenticated) return;

    // Subscriptions
    const unsubProducts = subscribeToProducts(setProducts);
    const unsubReviews = subscribeToAllReviews(setReviews);
    const unsubOrders = subscribeToOrders(setOrders);

    return () => {
      unsubProducts();
      unsubReviews();
      unsubOrders();
    };
  }, [isAuthenticated]);

  // Handle Login submission
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError("");
    setLoginLoading(true);

    try {
      const res = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password })
      });

      if (res.ok) {
        const data = await res.json();
        setIsAuthenticated(true);
        if (data.username) {
          setLoggedInUser(data.username);
        }
        setLoginError("");
      } else {
        const data = await res.json();
        setLoginError(data.error || "Invalid username or password");
      }
    } catch (err) {
      setLoginError("Failed to connect to the authentication server.");
    } finally {
      setLoginLoading(false);
    }
  };

  // Handle Logout
  const handleLogout = async () => {
    try {
      await fetch("/api/admin/logout", { method: "POST" });
    } catch (e) {}
    setIsAuthenticated(false);
    setUsername("");
    setPassword("");
  };

  // Credentials Modal Handlers
  const handleOpenCredsModal = () => {
    setCredsForm({
      newUsername: loggedInUser,
      newPassword: "",
      confirmPassword: ""
    });
    setCredsError("");
    setIsCredsModalOpen(true);
  };

  const handleCredsSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setCredsError("");

    if (!credsForm.newUsername.trim()) {
      setCredsError("Username is required.");
      return;
    }
    if (credsForm.newPassword.length < 4) {
      setCredsError("Password must be at least 4 characters long.");
      return;
    }
    if (credsForm.newPassword !== credsForm.confirmPassword) {
      setCredsError("Passwords do not match.");
      return;
    }

    setCredsLoading(true);
    try {
      const res = await fetch("/api/admin/change-credentials", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          oldUsername: loggedInUser,
          newUsername: credsForm.newUsername.trim(),
          newPassword: credsForm.newPassword
        })
      });

      if (res.ok) {
        alert("Credentials updated successfully! Please log in again with your new credentials.");
        setIsAuthenticated(false);
        setIsCredsModalOpen(false);
        router.push("/admin");
      } else {
        const data = await res.json();
        setCredsError(data.error || "Failed to update credentials.");
      }
    } catch (err) {
      setCredsError("Connection error. Please try again.");
    } finally {
      setCredsLoading(false);
    }
  };

  const dataURLtoFile = (dataurl: string, filename: string): File => {
    const arr = dataurl.split(",");
    const mime = arr[0].match(/:(.*?);/)?.[1] || "image/jpeg";
    const bstr = atob(arr[1]);
    let n = bstr.length;
    const u8arr = new Uint8Array(n);
    while (n--) {
      u8arr[n] = bstr.charCodeAt(n);
    }
    return new File([u8arr], filename, { type: mime });
  };

  const compressImage = (file: File): Promise<{ compressedFile: File; base64: string }> => {
    return new Promise((resolve) => {
      try {
        const reader = new FileReader();
        reader.onload = (event) => {
          try {
            const result = event.target?.result as string;
            if (!result) {
              resolve({ compressedFile: file, base64: "" });
              return;
            }
            const img = new Image();
            // Define handlers BEFORE setting img.src to prevent timing/cache bugs!
            img.onload = () => {
              try {
                const canvas = document.createElement("canvas");
                const MAX_WIDTH = 800;
                const MAX_HEIGHT = 800;
                let width = img.width;
                let height = img.height;

                if (width > height) {
                  if (width > MAX_WIDTH) {
                    height *= MAX_WIDTH / width;
                    width = MAX_WIDTH;
                  }
                } else {
                  if (height > MAX_HEIGHT) {
                    width *= MAX_HEIGHT / height;
                    height = MAX_HEIGHT;
                  }
                }

                canvas.width = width;
                canvas.height = height;
                const ctx = canvas.getContext("2d");
                if (ctx) {
                  ctx.drawImage(img, 0, 0, width, height);
                  const dataUrl = canvas.toDataURL("image/jpeg", 0.7);
                  try {
                    const compressedFile = dataURLtoFile(dataUrl, file.name.replace(/\.[^/.]+$/, "") + ".jpg");
                    resolve({ compressedFile, base64: dataUrl });
                  } catch (err) {
                    console.error("dataURLtoFile conversion failed:", err);
                    resolve({ compressedFile: file, base64: dataUrl });
                  }
                } else {
                  resolve({ compressedFile: file, base64: result });
                }
              } catch (err) {
                console.error("Error in img.onload:", err);
                resolve({ compressedFile: file, base64: result });
              }
            };
            img.onerror = (err) => {
              console.error("Error loading image in Image object:", err);
              resolve({ compressedFile: file, base64: result });
            };
            // Set src last!
            img.src = result;
          } catch (err) {
            console.error("Error in reader.onload:", err);
            resolve({ compressedFile: file, base64: "" });
          }
        };
        reader.onerror = (err) => {
          console.error("FileReader error:", err);
          resolve({ compressedFile: file, base64: "" });
        };
        reader.readAsDataURL(file);
      } catch (err) {
        console.error("Exception in compressImage outer block:", err);
        resolve({ compressedFile: file, base64: "" });
      }
    });
  };

  // Image upload handler with client-side compression
  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingImage(true);
    setProductFormError("");

    try {
      const { compressedFile, base64 } = await compressImage(file);

      // Initialize Firebase Storage if configured
      const storage = isFirebaseConfigured ? getStorage() : null;

      if (storage) {
        try {
          const storageRef = ref(storage, `products/${Date.now()}_${compressedFile.name}`);
          const snapshot = await uploadBytes(storageRef, compressedFile);
          const downloadUrl = await getDownloadURL(snapshot.ref);
          setProductForm(prev => ({ ...prev, image: downloadUrl }));
        } catch (err: any) {
          console.error("Firebase image upload failed, falling back to compressed base64:", err);
          setProductForm(prev => ({ ...prev, image: base64 }));
        }
      } else {
        setProductForm(prev => ({ ...prev, image: base64 }));
      }
    } catch (err) {
      console.error("Image processing failed:", err);
      setProductFormError("Failed to process image.");
    } finally {
      setUploadingImage(false);
    }
  };

  // Product CRUD Handlers
  const handleOpenAddModal = () => {
    setEditingProduct(null);
    setProductForm({
      name: "",
      category: "cupcakes",
      price: 0,
      desc: "",
      image: "",
      badge: "",
      available: true
    });
    setShowNewCategoryInput(false);
    setNewCategoryName("");
    setProductFormError("");
    setIsProductModalOpen(true);
  };

  const handleOpenEditModal = (product: DbProduct) => {
    setEditingProduct(product);
    setProductForm({
      name: product.name,
      category: product.category,
      price: product.price,
      desc: product.desc,
      image: product.image,
      badge: product.badge || "",
      available: product.available !== false
    });
    setShowNewCategoryInput(false);
    setNewCategoryName("");
    setProductFormError("");
    setIsProductModalOpen(true);
  };

  const handleProductSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setProductFormError("");

    if (!productForm.name.trim()) {
      setProductFormError("Product name is required.");
      return;
    }
    if (!productForm.image) {
      setProductFormError("Product image is required.");
      return;
    }

    let categoryToSave = productForm.category;
    if (showNewCategoryInput) {
      const trimmed = newCategoryName.trim().toLowerCase();
      if (!trimmed) {
        setProductFormError("Please enter a category name.");
        return;
      }
      categoryToSave = trimmed;
    }

    try {
      if (editingProduct) {
        const updatedProduct: DbProduct = {
          ...editingProduct,
          name: productForm.name.trim(),
          category: categoryToSave,
          price: productForm.price,
          desc: productForm.desc.trim(),
          image: productForm.image,
          badge: productForm.badge.trim(),
          available: productForm.available
        };
        await updateProduct(updatedProduct);
        // Immediately update local state (optimistic UI)
        setProducts(prev => prev.map(p => p.id === updatedProduct.id ? updatedProduct : p));
      } else {
        const newProduct = {
          name: productForm.name.trim(),
          category: categoryToSave,
          price: productForm.price,
          desc: productForm.desc.trim(),
          image: productForm.image,
          badge: productForm.badge.trim(),
          available: productForm.available
        };
        const saved = await addProduct(newProduct);
        // Immediately update local state (optimistic UI)
        setProducts(prev => [...prev, saved]);
      }
      setIsProductModalOpen(false);
    } catch (err: any) {
      setProductFormError("Database operation failed: " + (err.message || ""));
    }
  };

  const handleDeleteProduct = async (id: number) => {
    if (confirm("Are you sure you want to delete this product?")) {
      try {
        await deleteProduct(id);
        // Immediately update local state (optimistic UI)
        setProducts(prev => prev.filter(p => p.id !== id));
      } catch (err) {
        alert("Failed to delete product.");
      }
    }
  };

  // Review status handlers
  const handleApproveReview = async (id: string) => {
    try {
      await updateReviewStatus(id, "approved");
      // Immediately update local state (optimistic UI)
      setReviews(prev => prev.map(r => r.id === id ? { ...r, status: "approved" } : r));
    } catch (err) {
      alert("Failed to approve review.");
    }
  };

  const handleRejectReview = async (id: string) => {
    try {
      await updateReviewStatus(id, "rejected");
      // Immediately update local state (optimistic UI)
      setReviews(prev => prev.map(r => r.id === id ? { ...r, status: "rejected" } : r));
    } catch (err) {
      alert("Failed to reject review.");
    }
  };

  const handleDeleteReview = async (id: string) => {
    if (confirm("Are you sure you want to permanently delete this review?")) {
      try {
        await deleteReview(id);
        // Immediately update React state — don't wait for Firestore snapshot
        setReviews(prev => prev.filter(r => r.id !== id));
      } catch (err) {
        alert("Failed to delete review.");
      }
    }
  };

  // Order status handlers
  const handleStatusChange = async (orderId: string, newStatus: DbOrder["status"]) => {
    try {
      await updateOrderStatus(orderId, newStatus);
      // Immediately update local state (optimistic UI)
      setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status: newStatus } : o));
    } catch (err) {
      alert("Failed to update status.");
    }
  };

  // Filter and search orders
  const filteredOrders = orders.filter((o) => {
    const query = orderSearch.toLowerCase();
    const matchesSearch =
      o.id?.toLowerCase().includes(query) ||
      o.customerName.toLowerCase().includes(query) ||
      o.customerPhone.includes(query);
    const matchesFilter = orderFilter === "All" || o.status === orderFilter;
    return matchesSearch && matchesFilter;
  });

  // Calculate customer history
  const customerPastOrders = orders.filter(
    (o) => selectedCustomerPhone && o.customerPhone === selectedCustomerPhone
  );

  // Return loader while verifying session
  if (checkingAuth) {
    return (
      <div id="loader">
        <div className="loader-content">
          <div className="loader-logo">🧁 CHASHA BAKERS</div>
          <div className="loader-sub">Verifying credentials...</div>
          <div className="loader-bar"></div>
        </div>
      </div>
    );
  }

  // Render Login Panel if unauthenticated
  if (!isAuthenticated) {
    return (
      <div className="admin-login-wrapper" style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: "100vh", padding: "20px", background: "var(--cream)" }}>
        <div className="admin-login" style={{ width: "100%", maxWidth: "420px" }}>
          <div style={{ textAlign: "center", marginBottom: "30px" }}>
            <img src="/logo.png" alt="Chasha Bakers" width={70} style={{ marginBottom: "15px" }} />
            <h2 style={{ fontFamily: "Playfair Display, serif", fontSize: "1.8rem", color: "var(--text-dark)" }}>Admin Portal</h2>
            <p style={{ color: "var(--text-light)", fontSize: "0.9rem" }}>Enter your credentials to access the owner dashboard.</p>
          </div>

          {loginError && (
            <div className="login-error-banner" style={{ marginBottom: "20px" }}>
              {loginError}
            </div>
          )}

          <form onSubmit={handleLogin} className="login-form">
            <div className="form-group" style={{ marginBottom: "16px" }}>
              <label htmlFor="admin-username">Username</label>
              <input
                id="admin-username"
                type="text"
                placeholder="Enter username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
                disabled={loginLoading}
                style={{ width: "100%", padding: "12px", border: "2px solid var(--cream-dark)", borderRadius: "10px" }}
              />
            </div>
            <div className="form-group" style={{ marginBottom: "24px" }}>
              <label htmlFor="admin-password">Password</label>
              <input
                id="admin-password"
                type="password"
                placeholder="Enter password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                disabled={loginLoading}
                style={{ width: "100%", padding: "12px", border: "2px solid var(--cream-dark)", borderRadius: "10px" }}
              />
            </div>

            <button
              type="submit"
              className="login-submit-btn"
              disabled={loginLoading}
              style={{ width: "100%", height: "48px" }}
            >
              {loginLoading ? <span className="login-spinner"></span> : "Access Dashboard"}
            </button>
          </form>

          <div style={{ textAlign: "center", marginTop: "24px" }}>
            <button
              onClick={() => router.push("/")}
              style={{ background: "none", border: "none", color: "var(--text-light)", textDecoration: "underline", cursor: "pointer", fontSize: "0.9rem" }}
            >
              Back to Homepage
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Render Dashboard
  return (
    <div className="admin-section active" style={{ display: "block", minHeight: "100vh", padding: "100px 24px 60px", background: "var(--cream)" }}>
      <div className="admin-dashboard container">
        
        {/* Dashboard Header */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "40px", flexWrap: "wrap", gap: "20px" }}>
          <div>
            <h1 style={{ fontFamily: "Playfair Display, serif", fontSize: "2.4rem", color: "var(--text-dark)", fontWeight: "800" }}>
              Owner <span>Dashboard</span>
            </h1>
            <p style={{ color: "var(--text-light)" }}>Manage products, view real-time orders, and moderate reviews.</p>
            {isFirebaseConfigured && (
              <span style={{ fontSize: "0.75rem", color: "#27ae60", fontWeight: 600, display: "inline-block", marginTop: "5px" }}>
                🟢 Real-Time Sync Enabled (Firestore Active)
              </span>
            )}
          </div>
          <div style={{ display: "flex", gap: "10px" }}>
            <button className="btn-secondary" onClick={handleOpenCredsModal} style={{ display: "inline-flex", alignItems: "center", gap: "8px" }}>
              <i className="fas fa-key"></i> Change Credentials
            </button>
            <button className="btn-secondary" onClick={handleLogout} style={{ display: "inline-flex", alignItems: "center", gap: "8px" }}>
              <i className="fas fa-sign-out-alt"></i> Logout Admin
            </button>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="admin-tabs" style={{ display: "flex", gap: "12px", marginBottom: "30px" }}>
          <button
            className={`admin-tab ${activeTab === "products" ? "active" : ""}`}
            onClick={() => setActiveTab("products")}
          >
            <i className="fas fa-birthday-cake" style={{ marginRight: "8px" }}></i> Products ({products.length})
          </button>
          <button
            className={`admin-tab ${activeTab === "orders" ? "active" : ""}`}
            onClick={() => setActiveTab("orders")}
          >
            <i className="fas fa-receipt" style={{ marginRight: "8px" }}></i> Orders ({orders.length})
          </button>
          <button
            className={`admin-tab ${activeTab === "reviews" ? "active" : ""}`}
            onClick={() => setActiveTab("reviews")}
          >
            <i className="fas fa-star" style={{ marginRight: "8px" }}></i> Reviews ({reviews.length})
          </button>
        </div>

        {/* TAB 1: PRODUCT MANAGEMENT */}
        {activeTab === "products" && (
          <div className="admin-panel">
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
              <h3 style={{ fontFamily: "Playfair Display, serif", fontSize: "1.4rem", color: "var(--text-dark)" }}>Product List</h3>
              <button className="admin-add-btn" onClick={handleOpenAddModal} style={{ margin: 0 }}>
                <i className="fas fa-plus"></i> Add New Product
              </button>
            </div>

            <div style={{ overflowX: "auto" }}>
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Image</th>
                    <th>Name</th>
                    <th>Category</th>
                    <th>Price</th>
                    <th>Badge</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {products.length === 0 ? (
                    <tr>
                      <td colSpan={7} style={{ textAlign: "center", padding: "30px", color: "var(--text-light)" }}>
                        No products found. Add a product to get started.
                      </td>
                    </tr>
                  ) : (
                    products.map((p) => (
                      <tr key={p.id}>
                        <td>
                          <img src={p.image} alt={p.name} style={{ width: "50px", height: "50px", objectFit: "cover", borderRadius: "8px" }} />
                        </td>
                        <td style={{ fontWeight: "600", color: "var(--text-dark)" }}>{p.name}</td>
                        <td style={{ textTransform: "capitalize" }}>{p.category}</td>
                        <td style={{ fontWeight: "700" }}>{p.price === 0 ? "Price depends" : `₹${p.price}`}</td>
                        <td>{p.badge ? <span className="product-badge" style={{ position: "static", display: "inline-block" }}>{p.badge}</span> : "-"}</td>
                        <td>
                          <span
                            className={`status-badge ${p.available !== false ? "status-confirmed" : "status-new"}`}
                            style={{ background: p.available !== false ? "rgba(39, 174, 96, 0.1)" : "rgba(127, 140, 141, 0.1)", color: p.available !== false ? "#27ae60" : "#7f8c8d" }}
                          >
                            {p.available !== false ? "Available" : "Unavailable"}
                          </span>
                        </td>
                        <td>
                          <div style={{ display: "flex", gap: "8px" }}>
                            <button className="admin-btn admin-btn-edit" onClick={() => handleOpenEditModal(p)}>
                              <i className="fas fa-edit"></i> Edit
                            </button>
                            <button className="admin-btn admin-btn-delete" onClick={() => handleDeleteProduct(p.id)}>
                              <i className="fas fa-trash"></i> Delete
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB 2: ORDER MANAGEMENT */}
        {activeTab === "orders" && (
          <div className="admin-panel">
            <h3 style={{ fontFamily: "Playfair Display, serif", fontSize: "1.4rem", color: "var(--text-dark)", marginBottom: "20px" }}>Order Catalog</h3>

            {/* Filter controls */}
            <div style={{ display: "flex", gap: "16px", marginBottom: "24px", flexWrap: "wrap" }}>
              <div style={{ flexGrow: 1, minWidth: "250px" }}>
                <input
                  type="text"
                  placeholder="Search by Order ID, Name, or Phone..."
                  value={orderSearch}
                  onChange={(e) => setOrderSearch(e.target.value)}
                  style={{ width: "100%", padding: "10px 16px", border: "2px solid var(--cream-dark)", borderRadius: "10px" }}
                />
              </div>
              <div style={{ width: "180px" }}>
                <select
                  value={orderFilter}
                  onChange={(e) => setOrderFilter(e.target.value)}
                  style={{ width: "100%", padding: "10px 16px", border: "2px solid var(--cream-dark)", borderRadius: "10px" }}
                >
                  <option value="All">All Statuses</option>
                  <option value="New">New</option>
                  <option value="Preparing">Preparing</option>
                  <option value="Ready">Ready</option>
                  <option value="Delivered">Delivered</option>
                  <option value="Cancelled">Cancelled</option>
                </select>
              </div>
            </div>

            <div style={{ overflowX: "auto" }}>
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Order ID</th>
                    <th>Customer Name</th>
                    <th>Phone</th>
                    <th>Ordered Items</th>
                    <th>Total</th>
                    <th>Date & Time</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredOrders.length === 0 ? (
                    <tr>
                      <td colSpan={8} style={{ textAlign: "center", padding: "30px", color: "var(--text-light)" }}>
                        No orders match the search criteria.
                      </td>
                    </tr>
                  ) : (
                    filteredOrders.map((o) => (
                      <tr key={o.id}>
                        <td style={{ fontWeight: "700", color: "var(--primary)" }}>{o.id}</td>
                        <td>
                          <button
                            onClick={() => {
                              setSelectedCustomerPhone(o.customerPhone);
                              setSelectedCustomerName(o.customerName);
                            }}
                            style={{ background: "none", border: "none", color: "var(--text-dark)", fontWeight: "600", textDecoration: "underline", cursor: "pointer", textAlign: "left", padding: 0 }}
                            title="Click to view customer history"
                          >
                            {o.customerName}
                          </button>
                        </td>
                        <td>{o.customerPhone}</td>
                        <td style={{ maxWidth: "250px" }}>
                          <div style={{ fontSize: "0.85rem", lineHeight: "1.4" }}>
                            {o.items.map((item, idx) => (
                              <div key={idx}>
                                • {item.name} <span style={{ color: "var(--text-light)" }}>x{item.qty}</span>
                              </div>
                            ))}
                          </div>
                          {o.notes && (
                            <div style={{ fontSize: "0.75rem", fontStyle: "italic", color: "var(--primary-light)", marginTop: "4px" }}>
                              📝 Note: {o.notes}
                            </div>
                          )}
                        </td>
                        <td style={{ fontWeight: "700" }}>{o.totalAmount === 0 ? "TBD" : `₹${o.totalAmount}`}</td>
                        <td style={{ fontSize: "0.8rem", color: "var(--text-light)" }}>
                          {new Date(o.timestamp).toLocaleString("en-IN", { timeZone: "Asia/Kolkata" })}
                        </td>
                        <td>
                          <span
                            className="status-badge"
                            style={{
                              backgroundColor:
                                o.status === "New" ? "#e3f2fd" :
                                o.status === "Preparing" ? "#fff3e0" :
                                o.status === "Ready" ? "#f3e5f5" :
                                o.status === "Delivered" ? "#e8f5e9" : "#ffebee",
                              color:
                                o.status === "New" ? "#0d47a1" :
                                o.status === "Preparing" ? "#e65100" :
                                o.status === "Ready" ? "#4a148c" :
                                o.status === "Delivered" ? "#1b5e20" : "#b71c1c",
                            }}
                          >
                            {o.status}
                          </span>
                        </td>
                        <td>
                          <select
                            value={o.status}
                            onChange={(e) => handleStatusChange(o.id!, e.target.value as any)}
                            style={{ padding: "6px 12px", border: "1px solid var(--cream-dark)", borderRadius: "6px", fontSize: "0.8rem" }}
                          >
                            <option value="New">New</option>
                            <option value="Preparing">Preparing</option>
                            <option value="Ready">Ready</option>
                            <option value="Delivered">Delivered</option>
                            <option value="Cancelled">Cancelled</option>
                          </select>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB 3: REVIEW MANAGEMENT */}
        {activeTab === "reviews" && (
          <div className="admin-panel">
            <h3 style={{ fontFamily: "Playfair Display, serif", fontSize: "1.4rem", color: "var(--text-dark)", marginBottom: "20px" }}>Reviews Moderation</h3>

            <div style={{ overflowX: "auto" }}>
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Initial</th>
                    <th>Name</th>
                    <th>Rating</th>
                    <th>Review Text</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {reviews.length === 0 ? (
                    <tr>
                      <td colSpan={6} style={{ textAlign: "center", padding: "30px", color: "var(--text-light)" }}>
                        No reviews submitted yet.
                      </td>
                    </tr>
                  ) : (
                    reviews.map((r) => (
                      <tr key={r.id}>
                        <td>
                          <div className="testimonial-avatar" style={{ width: "36px", height: "36px", fontSize: "0.9rem" }}>{r.initial}</div>
                        </td>
                        <td style={{ fontWeight: "600", color: "var(--text-dark)" }}>{r.name}</td>
                        <td>
                          <div style={{ color: "#f39c12", fontSize: "0.8rem", whiteSpace: "nowrap" }}>
                            {Array.from({ length: 5 }).map((_, idx) => (
                              <i key={idx} className={idx < r.rating ? "fas fa-star" : "far fa-star"} />
                            ))}
                          </div>
                        </td>
                        <td style={{ maxWidth: "300px", wordBreak: "break-word" }}>{r.text}</td>
                        <td>
                          <span
                            className="status-badge"
                            style={{
                              backgroundColor:
                                r.status === "approved" ? "#e8f5e9" :
                                r.status === "pending" ? "#fff3e0" : "#ffebee",
                              color:
                                r.status === "approved" ? "#2e7d32" :
                                r.status === "pending" ? "#ef6c00" : "#c62828",
                            }}
                          >
                            {r.status}
                          </span>
                        </td>
                        <td>
                          <div style={{ display: "flex", gap: "8px" }}>
                            <button className="admin-btn admin-btn-delete" onClick={() => handleDeleteReview(r.id!)}>
                              <i className="fas fa-trash"></i> Delete
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* MODAL: Add/Edit Product */}
      {isProductModalOpen && (
        <div className="modal-overlay active" onClick={() => setIsProductModalOpen(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: "600px" }}>
            <button className="modal-close" onClick={() => setIsProductModalOpen(false)}>
              &times;
            </button>
            <h2>{editingProduct ? "Edit Product" : "Add New Product"}</h2>

            {productFormError && (
              <div className="login-error-banner" style={{ margin: "16px 0" }}>
                {productFormError}
              </div>
            )}

            <form onSubmit={handleProductSubmit} style={{ marginTop: "20px" }}>
              <div className="admin-form-grid">
                <div className="form-group">
                  <label>Product Name *</label>
                  <input
                    type="text"
                    placeholder="Vanilla Cupcake"
                    required
                    value={productForm.name}
                    onChange={(e) => setProductForm({ ...productForm, name: e.target.value })}
                  />
                </div>
                <div className="form-group">
                  <label>Category *</label>
                  <select
                    value={showNewCategoryInput ? "new" : productForm.category}
                    onChange={(e) => {
                      if (e.target.value === "new") {
                        setShowNewCategoryInput(true);
                      } else {
                        setShowNewCategoryInput(false);
                        setProductForm({ ...productForm, category: e.target.value });
                      }
                    }}
                  >
                    {Array.from(new Set([
                      "cupcakes",
                      "donuts",
                      "filled donuts",
                      "muffins",
                      "teacakes",
                      "brownies",
                      "custom cakes",
                      productForm.category.toLowerCase(),
                      ...products.map(p => p.category.toLowerCase()).filter(Boolean)
                    ])).filter(Boolean).sort().map(cat => (
                      <option key={cat} value={cat}>
                        {cat.split(" ").map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(" ")}
                      </option>
                    ))}
                    <option value="new">+ Add New Category...</option>
                  </select>
                </div>
              </div>

              {showNewCategoryInput && (
                <div className="form-group" style={{ marginTop: "-10px", marginBottom: "15px" }}>
                  <label>New Category Name *</label>
                  <div style={{ display: "flex", gap: "10px" }}>
                    <input
                      type="text"
                      placeholder="e.g. Pastries, Macarons"
                      value={newCategoryName}
                      onChange={(e) => setNewCategoryName(e.target.value)}
                      style={{ flexGrow: 1 }}
                    />
                    <button
                      type="button"
                      className="btn-secondary"
                      style={{ padding: "8px 16px", borderRadius: "10px", margin: 0 }}
                      onClick={() => {
                        const val = newCategoryName.trim().toLowerCase();
                        if (val) {
                          setProductForm({ ...productForm, category: val });
                          setShowNewCategoryInput(false);
                        }
                      }}
                    >
                      Confirm
                    </button>
                  </div>
                </div>
              )}

              <div className="admin-form-grid">
                <div className="form-group">
                  <label>Price (₹) *</label>
                  <input
                    type="number"
                    placeholder="299"
                    required
                    min={0}
                    value={productForm.price}
                    onChange={(e) => setProductForm({ ...productForm, price: Number(e.target.value) })}
                  />
                </div>
                <div className="form-group">
                  <label>Badge (Optional)</label>
                  <input
                    type="text"
                    placeholder="Bestseller, Popular, etc."
                    value={productForm.badge}
                    onChange={(e) => setProductForm({ ...productForm, badge: e.target.value })}
                  />
                </div>
              </div>

              <div className="form-group">
                <label>Description *</label>
                <textarea
                  placeholder="Provide product details..."
                  required
                  value={productForm.desc}
                  onChange={(e) => setProductForm({ ...productForm, desc: e.target.value })}
                  style={{ minHeight: "80px" }}
                />
              </div>

              <div className="form-group">
                <label>Product Image *</label>
                <div style={{ display: "flex", gap: "10px", alignItems: "center", marginBottom: "10px" }}>
                  <input
                    type="text"
                    placeholder="Paste image URL..."
                    value={productForm.image}
                    onChange={(e) => setProductForm({ ...productForm, image: e.target.value })}
                    style={{ flexGrow: 1 }}
                  />
                  <span style={{ color: "var(--text-light)", fontSize: "0.85rem" }}>or</span>
                  <label className="btn-secondary" style={{ padding: "8px 16px", fontSize: "0.85rem", cursor: "pointer", borderRadius: "10px", margin: 0, whiteSpace: "nowrap" }}>
                    <i className="fas fa-upload"></i> Upload
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleImageUpload}
                      style={{ display: "none" }}
                    />
                  </label>
                </div>
                {uploadingImage && <div style={{ fontSize: "0.85rem", color: "var(--primary-light)", margin: "5px 0" }}>Uploading/Processing Image...</div>}
                {productForm.image && (
                  <div style={{ display: "flex", alignItems: "center", gap: "10px", background: "var(--cream)", padding: "10px", borderRadius: "10px" }}>
                    <img src={productForm.image} alt="Preview" style={{ width: "60px", height: "60px", objectFit: "cover", borderRadius: "8px" }} />
                    <span style={{ fontSize: "0.75rem", color: "var(--text-light)", wordBreak: "break-all" }}>{productForm.image}</span>
                  </div>
                )}
              </div>

              <div className="form-group" style={{ display: "flex", alignItems: "center", gap: "10px", marginTop: "15px" }}>
                <input
                  id="product-avail-checkbox"
                  type="checkbox"
                  checked={productForm.available}
                  onChange={(e) => setProductForm({ ...productForm, available: e.target.checked })}
                  style={{ width: "20px", height: "20px", cursor: "pointer" }}
                />
                <label htmlFor="product-avail-checkbox" style={{ margin: 0, cursor: "pointer", fontWeight: "600" }}>Mark Product as Available</label>
              </div>

              <button type="submit" className="form-submit" style={{ marginTop: "24px" }} disabled={uploadingImage}>
                {editingProduct ? "Save Changes" : "Add Product"}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: Customer Order History */}
      {selectedCustomerPhone && (
        <div className="modal-overlay active" onClick={() => setSelectedCustomerPhone(null)}>
          <div className="modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: "650px" }}>
            <button className="modal-close" onClick={() => setSelectedCustomerPhone(null)}>
              &times;
            </button>
            <h2 style={{ fontFamily: "Playfair Display, serif", fontSize: "1.6rem" }}>
              Order History for <span>{selectedCustomerName}</span>
            </h2>
            <p style={{ color: "var(--text-light)", fontSize: "0.9rem", marginBottom: "20px" }}>Phone: {selectedCustomerPhone}</p>

            <div style={{ maxHeight: "400px", overflowY: "auto" }}>
              {customerPastOrders.length === 0 ? (
                <p style={{ textAlign: "center", padding: "20px", color: "var(--text-light)" }}>No orders found for this customer.</p>
              ) : (
                customerPastOrders.map((o) => (
                  <div key={o.id} style={{ border: "1px solid var(--cream-dark)", borderRadius: "12px", padding: "16px", marginBottom: "12px", background: "var(--cream)" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "8px" }}>
                      <strong style={{ color: "var(--primary)" }}>{o.id}</strong>
                      <span
                        className="status-badge"
                        style={{
                          backgroundColor:
                            o.status === "New" ? "#e3f2fd" :
                            o.status === "Preparing" ? "#fff3e0" :
                            o.status === "Ready" ? "#f3e5f5" :
                            o.status === "Delivered" ? "#e8f5e9" : "#ffebee",
                          color:
                            o.status === "New" ? "#0d47a1" :
                            o.status === "Preparing" ? "#e65100" :
                            o.status === "Ready" ? "#4a148c" :
                            o.status === "Delivered" ? "#1b5e20" : "#b71c1c",
                        }}
                      >
                        {o.status}
                      </span>
                    </div>
                    <div style={{ fontSize: "0.85rem", marginBottom: "8px" }}>
                      {o.items.map((item, idx) => (
                        <div key={idx}>
                          - {item.name} <span style={{ color: "var(--text-light)" }}>x{item.qty}</span>
                        </div>
                      ))}
                    </div>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: "0.8rem", color: "var(--text-light)", paddingTop: "8px", borderTop: "1px solid rgba(139,69,19,0.1)" }}>
                      <span>Total: <strong style={{ color: "var(--text-dark)", fontSize: "0.95rem" }}>₹{o.totalAmount}</strong></span>
                      <span>{new Date(o.timestamp).toLocaleString("en-IN")}</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* MODAL: Change Credentials */}
      {isCredsModalOpen && (
        <div className="modal-overlay active" onClick={() => setIsCredsModalOpen(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: "450px" }}>
            <button className="modal-close" onClick={() => setIsCredsModalOpen(false)}>
              &times;
            </button>
            <h2 style={{ fontFamily: "Playfair Display, serif", fontSize: "1.6rem" }}>
              Change Admin <span>Credentials</span>
            </h2>
            <p style={{ color: "var(--text-light)", fontSize: "0.9rem", marginBottom: "20px" }}>Update username and password to secure the portal.</p>

            {credsError && (
              <div className="login-error-banner" style={{ marginBottom: "16px" }}>
                {credsError}
              </div>
            )}

            <form onSubmit={handleCredsSubmit}>
              <div className="form-group" style={{ marginBottom: "16px" }}>
                <label>New Username *</label>
                <input
                  type="text"
                  placeholder="admin"
                  required
                  value={credsForm.newUsername}
                  onChange={(e) => setCredsForm({ ...credsForm, newUsername: e.target.value })}
                />
              </div>

              <div className="form-group" style={{ marginBottom: "16px" }}>
                <label>New Password *</label>
                <input
                  type="password"
                  placeholder="••••••••"
                  required
                  value={credsForm.newPassword}
                  onChange={(e) => setCredsForm({ ...credsForm, newPassword: e.target.value })}
                />
              </div>

              <div className="form-group" style={{ marginBottom: "24px" }}>
                <label>Confirm New Password *</label>
                <input
                  type="password"
                  placeholder="••••••••"
                  required
                  value={credsForm.confirmPassword}
                  onChange={(e) => setCredsForm({ ...credsForm, confirmPassword: e.target.value })}
                />
              </div>

              <button type="submit" className="form-submit" disabled={credsLoading} style={{ width: "100%", height: "48px" }}>
                {credsLoading ? "Updating..." : "Update Credentials"}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
