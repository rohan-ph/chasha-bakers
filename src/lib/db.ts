import { db, isFirebaseConfigured } from "./firebase";
import {
  collection,
  doc,
  getDocs,
  getDoc,
  setDoc,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  onSnapshot,
  Timestamp
} from "firebase/firestore";
import { PRODUCTS, Product } from "@/data/products";

// Interfaces
export interface DbProduct extends Product {
  available: boolean;
}

export interface DbReview {
  id?: string;
  name: string;
  initial: string;
  text: string;
  rating: number;
  status: "pending" | "approved" | "rejected";
  timestamp: any;
}

export interface DbOrderItem {
  productId: string;
  name: string;
  price: number;
  qty: number;
}

export interface DbOrder {
  id?: string;
  customerName: string;
  customerPhone: string;
  items: DbOrderItem[];
  quantity: number;
  totalAmount: number;
  notes: string;
  status: "New" | "Preparing" | "Ready" | "Delivered" | "Cancelled";
  timestamp: any;
}

// Local storage keys for cross-tab persistence
const LOCAL_STORAGE_KEYS = {
  products: "chasha_local_products",
  reviews: "chasha_local_reviews",
  orders: "chasha_local_orders",
};

// Initial load helpers
function getStoredProducts(): DbProduct[] {
  if (typeof window === "undefined") return PRODUCTS.map(p => ({ ...p, available: true }));
  try {
    const val = localStorage.getItem(LOCAL_STORAGE_KEYS.products);
    if (val) return JSON.parse(val);
  } catch (e) {}
  return PRODUCTS.map(p => ({ ...p, available: true }));
}

function getStoredReviews(): DbReview[] {
  const defaultReviews: DbReview[] = [
    { name: "Anitha R.", initial: "A", text: "The chocolate truffle cake was absolutely divine! Best bakery in town. Every order has been consistent in quality. Highly recommend CHASHA BAKERS!", rating: 5, status: "approved", timestamp: new Date() },
    { name: "Priya S.", initial: "P", text: "Ordered a custom birthday cake for my daughter and it was stunning! The taste was even better than expected. Thank you for making her day special!", rating: 5, status: "approved", timestamp: new Date() },
    { name: "Rohan K.", initial: "R", text: "Fresh, delicious, and beautifully packaged. The cookies are addictive! I've been ordering weekly for my family. Great service via WhatsApp too!", rating: 5, status: "approved", timestamp: new Date() }
  ];
  if (typeof window === "undefined") return defaultReviews;
  try {
    const val = localStorage.getItem(LOCAL_STORAGE_KEYS.reviews);
    if (val) {
      const parsed = JSON.parse(val);
      return parsed.map((r: any) => ({
        ...r,
        timestamp: new Date(r.timestamp)
      }));
    }
  } catch (e) {}
  return defaultReviews;
}

function getStoredOrders(): DbOrder[] {
  if (typeof window === "undefined") return [];
  try {
    const val = localStorage.getItem(LOCAL_STORAGE_KEYS.orders);
    if (val) {
      const parsed = JSON.parse(val);
      return parsed.map((o: any) => ({
        ...o,
        timestamp: new Date(o.timestamp)
      }));
    }
  } catch (e) {}
  return [];
}

// Fallback in-memory database for local/offline testing
export let localProducts: DbProduct[] = getStoredProducts();
let localReviews: DbReview[] = getStoredReviews();
let localOrders: DbOrder[] = getStoredOrders();

// Save helpers
function saveLocalProducts() {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(LOCAL_STORAGE_KEYS.products, JSON.stringify(localProducts));
  } catch (e) {}
}

function saveLocalReviews() {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(LOCAL_STORAGE_KEYS.reviews, JSON.stringify(localReviews));
  } catch (e) {}
}

function saveLocalOrders() {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(LOCAL_STORAGE_KEYS.orders, JSON.stringify(localOrders));
  } catch (e) {}
}

let localAdminCredentials = { username: "admin", passwordHash: "8c6976e5b5410415bde908bd4dee15dfb167a9c873fc4bb8a81f6f2ab448a918" }; // SHA256 of "admin"

// Check if we should use Firestore
const useFirestore = isFirebaseConfigured && db !== null;

// Helpers to seed Firestore with initial data if empty or missing items
export async function seedDatabaseIfEmpty() {
  if (!useFirestore || !db) return;

  try {
    // 1. Seed Products (make sure all PRODUCTS are in Firestore)
    const productsCol = collection(db, "products");
    const productsSnap = await getDocs(productsCol);
    const existingIds = new Set(productsSnap.docs.map(doc => doc.id));

    for (const p of PRODUCTS) {
      if (!existingIds.has(p.id.toString())) {
        console.log(`Seeding missing product in Firestore: ${p.name}`);
        await setDoc(doc(db, "products", p.id.toString()), {
          id: p.id,
          name: p.name,
          category: p.category,
          price: p.price,
          desc: p.desc,
          image: p.image,
          badge: p.badge || "",
          available: true
        });
      }
    }

    // 2. Seed Reviews
    const reviewsCol = collection(db, "reviews");
    const reviewsSnap = await getDocs(reviewsCol);
    if (reviewsSnap.empty) {
      console.log("Seeding reviews in Firestore...");
      const defaultReviews = [
        { name: "Anitha R.", initial: "A", text: "The chocolate truffle cake was absolutely divine! Best bakery in town. Every order has been consistent in quality. Highly recommend CHASHA BAKERS!", rating: 5, status: "approved", timestamp: Timestamp.now() },
        { name: "Priya S.", initial: "P", text: "Ordered a custom birthday cake for my daughter and it was stunning! The taste was even better than expected. Thank you for making her day special!", rating: 5, status: "approved", timestamp: Timestamp.now() },
        { name: "Rohan K.", initial: "R", text: "Fresh, delicious, and beautifully packaged. The cookies are addictive! I've been ordering weekly for my family. Great service via WhatsApp too!", rating: 5, status: "approved", timestamp: Timestamp.now() }
      ];
      for (const r of defaultReviews) {
        await addDoc(reviewsCol, r);
      }
    }

    // 3. Seed Admin Credentials
    const adminCol = collection(db, "admin_credentials");
    const adminSnap = await getDocs(adminCol);
    if (adminSnap.empty) {
      console.log("Seeding admin credentials in Firestore...");
      await setDoc(doc(db, "admin_credentials", "admin"), {
        username: "admin",
        passwordHash: "8c6976e5b5410415bde908bd4dee15dfb167a9c873fc4bb8a81f6f2ab448a918" // admin
      });
    }
  } catch (err) {
    console.error("Database seeding failed:", err);
  }
}

// Automatically try seeding
if (typeof window !== "undefined") {
  seedDatabaseIfEmpty();
}

// Merge function to guarantee all static products are present and updated with DB edits
export function mergeDbWithStaticProducts(dbProducts: DbProduct[]): DbProduct[] {
  const productMap = new Map<number, DbProduct>();
  
  // Initialize with all static products
  PRODUCTS.forEach((p) => {
    productMap.set(p.id, { ...p, available: true });
  });

  // Overwrite or append with database products
  dbProducts.forEach((p) => {
    productMap.set(p.id, p);
  });

  return Array.from(productMap.values()).sort((a, b) => a.id - b.id);
}

// --- PRODUCT MANAGEMENT ---

export async function fetchProducts(): Promise<DbProduct[]> {
  if (useFirestore && db) {
    try {
      const q = query(collection(db, "products"));
      const snap = await getDocs(q);
      const list: DbProduct[] = [];
      snap.forEach((docSnap) => {
        const data = docSnap.data();
        list.push({
          id: Number(data.id || docSnap.id),
          name: data.name,
          category: data.category,
          price: data.price,
          desc: data.desc,
          image: data.image,
          badge: data.badge || undefined,
          available: data.available !== false
        });
      });
      return mergeDbWithStaticProducts(list);
    } catch (e) {
      console.error("Failed to fetch products from Firestore, falling back:", e);
    }
  }
  return localProducts;
}

export async function addProduct(product: Omit<DbProduct, "id"> & { id?: number }): Promise<DbProduct> {
  const nextId = product.id || (useFirestore ? Date.now() : (localProducts.length > 0 ? Math.max(...localProducts.map(p => p.id)) + 1 : 1));
  const fullProduct: DbProduct = {
    ...product,
    id: nextId,
    badge: product.badge || "",
    available: product.available !== false
  };

  localProducts.push(fullProduct);
  saveLocalProducts();

  if (useFirestore && db) {
    setDoc(doc(db, "products", nextId.toString()), fullProduct)
      .catch((err) => console.warn("Background addProduct to Firestore failed:", err));
  }
  return fullProduct;
}

export async function updateProduct(product: DbProduct): Promise<void> {
  localProducts = localProducts.map(p => p.id === product.id ? product : p);
  saveLocalProducts();

  if (useFirestore && db) {
    updateDoc(doc(db, "products", product.id.toString()), {
      name: product.name,
      category: product.category,
      price: product.price,
      desc: product.desc,
      image: product.image,
      badge: product.badge || "",
      available: product.available
    }).catch((err) => console.warn("Background updateProduct to Firestore failed:", err));
  }
}

export async function deleteProduct(productId: number): Promise<void> {
  localProducts = localProducts.filter(p => p.id !== productId);
  saveLocalProducts();

  if (useFirestore && db) {
    deleteDoc(doc(db, "products", productId.toString()))
      .catch((err) => console.warn("Background deleteProduct to Firestore failed:", err));
  }
}

// --- REVIEW MANAGEMENT ---

export async function fetchReviews(approvedOnly = true): Promise<DbReview[]> {
  if (useFirestore && db) {
    try {
      const col = collection(db, "reviews");
      let q = approvedOnly 
        ? query(col, where("status", "==", "approved"), orderBy("timestamp", "desc"))
        : query(col, orderBy("timestamp", "desc"));
      
      const snap = await getDocs(q);
      const list: DbReview[] = [];
      snap.forEach((docSnap) => {
        const data = docSnap.data();
        list.push({
          id: docSnap.id,
          name: data.name,
          initial: data.initial,
          text: data.text,
          rating: data.rating,
          status: data.status,
          timestamp: data.timestamp?.toDate() || new Date()
        });
      });
      return list;
    } catch (e) {
      console.error("Failed to fetch reviews from Firestore, falling back:", e);
    }
  }
  
  const reviews = approvedOnly 
    ? localReviews.filter(r => r.status === "approved")
    : localReviews;
  return reviews.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
}

export async function submitReview(review: Omit<DbReview, "status" | "timestamp">): Promise<DbReview> {
  const newReview: DbReview = {
    ...review,
    status: "approved", // Post automatically and make visible to everyone
    timestamp: new Date(),
    id: Math.random().toString(36).substr(2, 9)
  };

  // Update local memory list instantly so UI gets it immediately
  localReviews = [newReview, ...localReviews];
  saveLocalReviews();

  if (useFirestore && db) {
    // Run Firestore write in the background completely asynchronously.
    // The user UI receives the returned review instantly and doesn't wait!
    const tempId = newReview.id!;
    addDoc(collection(db, "reviews"), {
      ...newReview,
      timestamp: Timestamp.fromDate(newReview.timestamp)
    }).then((docRef) => {
      // Replace the temporary local ID with the real Firestore doc ID
      // so that future delete/update operations use the correct ID
      newReview.id = docRef.id;
      localReviews = localReviews.map(r => r.id === tempId ? { ...r, id: docRef.id } : r);
      saveLocalReviews();
    }).catch((err) => {
      console.warn("Background review write to Firestore failed:", err);
    });
  }

  return newReview;
}

export async function updateReviewStatus(reviewId: string, status: "approved" | "rejected"): Promise<void> {
  localReviews = localReviews.map(r => r.id === reviewId ? { ...r, status } : r);
  saveLocalReviews();

  if (useFirestore && db) {
    updateDoc(doc(db, "reviews", reviewId), { status })
      .catch((err) => console.warn("Background updateReviewStatus to Firestore failed:", err));
  }
}

export async function deleteReview(reviewId: string): Promise<void> {
  localReviews = localReviews.filter(r => r.id !== reviewId);
  saveLocalReviews();

  if (useFirestore && db) {
    deleteDoc(doc(db, "reviews", reviewId))
      .catch((err) => console.warn("Background deleteReview to Firestore failed:", err));
  }
}

// --- ORDER MANAGEMENT ---

export async function fetchOrders(): Promise<DbOrder[]> {
  if (useFirestore && db) {
    try {
      const q = query(collection(db, "orders"), orderBy("timestamp", "desc"));
      const snap = await getDocs(q);
      const list: DbOrder[] = [];
      snap.forEach((docSnap) => {
        const data = docSnap.data();
        list.push({
          id: docSnap.id,
          customerName: data.customerName,
          customerPhone: data.customerPhone,
          items: data.items,
          quantity: data.quantity,
          totalAmount: data.totalAmount,
          notes: data.notes || "",
          status: data.status,
          timestamp: data.timestamp?.toDate() || new Date()
        });
      });
      return list;
    } catch (e) {
      console.error("Failed to fetch orders from Firestore, falling back:", e);
    }
  }
  return localOrders.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
}

export async function saveOrder(order: Omit<DbOrder, "id" | "status" | "timestamp">): Promise<DbOrder> {
  // Generate a friendly human-readable order ID: e.g., CB-10492
  const orderNum = Math.floor(10000 + Math.random() * 90000);
  const orderId = `CB-${orderNum}`;

  const newOrder: DbOrder = {
    ...order,
    id: orderId,
    status: "New",
    timestamp: new Date()
  };

  localOrders = [newOrder, ...localOrders];
  saveLocalOrders();

  if (useFirestore && db) {
    setDoc(doc(db, "orders", orderId), {
      ...newOrder,
      timestamp: Timestamp.fromDate(newOrder.timestamp)
    }).catch((err) => console.warn("Background saveOrder to Firestore failed:", err));
  }
  return newOrder;
}

export async function updateOrderStatus(orderId: string, status: DbOrder["status"]): Promise<void> {
  localOrders = localOrders.map(o => o.id === orderId ? { ...o, status } : o);
  saveLocalOrders();

  if (useFirestore && db) {
    updateDoc(doc(db, "orders", orderId), { status })
      .catch((err) => console.warn("Background updateOrderStatus to Firestore failed:", err));
  }
}

// --- REAL-TIME LISTENERS ---

export function subscribeToProducts(callback: (products: DbProduct[]) => void) {
  let hasReceivedSnapshot = false;

  const timeoutId = setTimeout(() => {
    if (!hasReceivedSnapshot) {
      console.warn("Firestore products snapshot listener timed out, falling back to local storage");
      callback(localProducts);
    }
  }, 1500);

  if (useFirestore && db) {
    const unsub = onSnapshot(query(collection(db, "products")), (snap) => {
      hasReceivedSnapshot = true;
      clearTimeout(timeoutId);
      const list: DbProduct[] = [];
      snap.forEach((docSnap) => {
        const data = docSnap.data();
        list.push({
          id: Number(data.id || docSnap.id),
          name: data.name,
          category: data.category,
          price: data.price,
          desc: data.desc,
          image: data.image,
          badge: data.badge || undefined,
          available: data.available !== false
        });
      });
      callback(mergeDbWithStaticProducts(list));
    }, (err) => {
      hasReceivedSnapshot = true;
      clearTimeout(timeoutId);
      console.error("Error in products snapshot subscriber:", err);
      callback(localProducts);
    });

    if (typeof window !== "undefined") {
      const handleStorage = (e: StorageEvent) => {
        if (e.key === LOCAL_STORAGE_KEYS.products) {
          localProducts = getStoredProducts();
          if (!hasReceivedSnapshot) {
            callback(localProducts);
          }
        }
      };
      window.addEventListener("storage", handleStorage);
      return () => {
        unsub();
        window.removeEventListener("storage", handleStorage);
      };
    }
    return unsub;
  }
  
  clearTimeout(timeoutId);
  callback(localProducts);
  if (typeof window !== "undefined") {
    const handleStorage = (e: StorageEvent) => {
      if (e.key === LOCAL_STORAGE_KEYS.products) {
        localProducts = getStoredProducts();
        callback(localProducts);
      }
    };
    window.addEventListener("storage", handleStorage);
    return () => window.removeEventListener("storage", handleStorage);
  }
  return () => {};
}

export function subscribeToApprovedReviews(callback: (reviews: DbReview[]) => void) {
  let hasReceivedSnapshot = false;

  const timeoutId = setTimeout(() => {
    if (!hasReceivedSnapshot) {
      console.warn("Firestore approved reviews snapshot listener timed out, falling back to local storage");
      callback(localReviews.filter(r => r.status === "approved"));
    }
  }, 1500);

  if (useFirestore && db) {
    const q = query(collection(db, "reviews"), where("status", "==", "approved"), orderBy("timestamp", "desc"));
    const unsub = onSnapshot(q, (snap) => {
      hasReceivedSnapshot = true;
      clearTimeout(timeoutId);
      const list: DbReview[] = [];
      snap.forEach((docSnap) => {
        const data = docSnap.data();
        list.push({
          id: docSnap.id,
          name: data.name,
          initial: data.initial,
          text: data.text,
          rating: data.rating,
          status: data.status,
          timestamp: data.timestamp?.toDate() || new Date()
        });
      });
      callback(list);
    }, (err) => {
      hasReceivedSnapshot = true;
      clearTimeout(timeoutId);
      console.error("Error in reviews snapshot subscriber:", err);
      callback(localReviews.filter(r => r.status === "approved"));
    });

    if (typeof window !== "undefined") {
      const handleStorage = (e: StorageEvent) => {
        if (e.key === LOCAL_STORAGE_KEYS.reviews) {
          localReviews = getStoredReviews();
          if (!hasReceivedSnapshot) {
            callback(localReviews.filter(r => r.status === "approved"));
          }
        }
      };
      window.addEventListener("storage", handleStorage);
      return () => {
        unsub();
        window.removeEventListener("storage", handleStorage);
      };
    }
    return unsub;
  }

  clearTimeout(timeoutId);
  callback(localReviews.filter(r => r.status === "approved"));
  if (typeof window !== "undefined") {
    const handleStorage = (e: StorageEvent) => {
      if (e.key === LOCAL_STORAGE_KEYS.reviews) {
        localReviews = getStoredReviews();
        callback(localReviews.filter(r => r.status === "approved"));
      }
    };
    window.addEventListener("storage", handleStorage);
    return () => window.removeEventListener("storage", handleStorage);
  }
  return () => {};
}

export function subscribeToAllReviews(callback: (reviews: DbReview[]) => void) {
  let hasReceivedSnapshot = false;

  const timeoutId = setTimeout(() => {
    if (!hasReceivedSnapshot) {
      console.warn("Firestore reviews snapshot listener timed out, falling back to local storage");
      callback(localReviews);
    }
  }, 1500);

  if (useFirestore && db) {
    const q = query(collection(db, "reviews"), orderBy("timestamp", "desc"));
    const unsub = onSnapshot(q, (snap) => {
      hasReceivedSnapshot = true;
      clearTimeout(timeoutId);
      const list: DbReview[] = [];
      snap.forEach((docSnap) => {
        const data = docSnap.data();
        list.push({
          id: docSnap.id,
          name: data.name,
          initial: data.initial,
          text: data.text,
          rating: data.rating,
          status: data.status,
          timestamp: data.timestamp?.toDate() || new Date()
        });
      });
      callback(list);
    }, (err) => {
      hasReceivedSnapshot = true;
      clearTimeout(timeoutId);
      console.error("Error in admin reviews snapshot subscriber:", err);
      callback(localReviews);
    });

    if (typeof window !== "undefined") {
      const handleStorage = (e: StorageEvent) => {
        if (e.key === LOCAL_STORAGE_KEYS.reviews) {
          localReviews = getStoredReviews();
          if (!hasReceivedSnapshot) {
            callback(localReviews);
          }
        }
      };
      window.addEventListener("storage", handleStorage);
      return () => {
        unsub();
        window.removeEventListener("storage", handleStorage);
      };
    }
    return unsub;
  }

  clearTimeout(timeoutId);
  callback(localReviews);
  if (typeof window !== "undefined") {
    const handleStorage = (e: StorageEvent) => {
      if (e.key === LOCAL_STORAGE_KEYS.reviews) {
        localReviews = getStoredReviews();
        callback(localReviews);
      }
    };
    window.addEventListener("storage", handleStorage);
    return () => window.removeEventListener("storage", handleStorage);
  }
  return () => {};
}

export function subscribeToOrders(callback: (orders: DbOrder[]) => void) {
  let hasReceivedSnapshot = false;

  const timeoutId = setTimeout(() => {
    if (!hasReceivedSnapshot) {
      console.warn("Firestore orders snapshot listener timed out, falling back to local storage");
      callback(localOrders);
    }
  }, 1500);

  if (useFirestore && db) {
    const q = query(collection(db, "orders"), orderBy("timestamp", "desc"));
    const unsub = onSnapshot(q, (snap) => {
      hasReceivedSnapshot = true;
      clearTimeout(timeoutId);
      const list: DbOrder[] = [];
      snap.forEach((docSnap) => {
        const data = docSnap.data();
        list.push({
          id: docSnap.id,
          customerName: data.customerName,
          customerPhone: data.customerPhone,
          items: data.items,
          quantity: data.quantity,
          totalAmount: data.totalAmount,
          notes: data.notes || "",
          status: data.status,
          timestamp: data.timestamp?.toDate() || new Date()
        });
      });
      callback(list);
    }, (err) => {
      hasReceivedSnapshot = true;
      clearTimeout(timeoutId);
      console.error("Error in admin orders snapshot subscriber:", err);
      callback(localOrders);
    });

    if (typeof window !== "undefined") {
      const handleStorage = (e: StorageEvent) => {
        if (e.key === LOCAL_STORAGE_KEYS.orders) {
          localOrders = getStoredOrders();
          if (!hasReceivedSnapshot) {
            callback(localOrders);
          }
        }
      };
      window.addEventListener("storage", handleStorage);
      return () => {
        unsub();
        window.removeEventListener("storage", handleStorage);
      };
    }
    return unsub;
  }

  clearTimeout(timeoutId);
  callback(localOrders);
  if (typeof window !== "undefined") {
    const handleStorage = (e: StorageEvent) => {
      if (e.key === LOCAL_STORAGE_KEYS.orders) {
        localOrders = getStoredOrders();
        callback(localOrders);
      }
    };
    window.addEventListener("storage", handleStorage);
    return () => window.removeEventListener("storage", handleStorage);
  }
  return () => {};
}
