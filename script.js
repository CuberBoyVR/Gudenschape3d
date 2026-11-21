/* ===== State ===== */
let filamentColors = [];
let products = [];
let cart = JSON.parse(localStorage.getItem("printforge-cart")) || [];
let currentFilter = "all";
let selectedProduct = null;
let selectedColor = null;

/* ===== DOM ===== */
const productGrid = document.getElementById("productGrid");
const cartBtn = document.getElementById("cartBtn");
const cartDrawer = document.getElementById("cartDrawer");
const cartOverlay = document.getElementById("cartOverlay");
const closeCart = document.getElementById("closeCart");
const cartItems = document.getElementById("cartItems");
const cartCount = document.getElementById("cartCount");
const cartTotal = document.getElementById("cartTotal");
const checkoutBtn = document.getElementById("checkoutBtn");
const toast = document.getElementById("toast");
const menuBtn = document.getElementById("menuBtn");
const nav = document.getElementById("nav");
const filterBtns = document.querySelectorAll(".filter-btn");

/* Modal elements */
const productModal = document.getElementById("productModal");
const modalOverlay = document.getElementById("modalOverlay");
const modalClose = document.getElementById("modalClose");
const modalEmoji = document.getElementById("modalEmoji");
const modalImage = document.getElementById("modalImage");
const modalTitle = document.getElementById("modalTitle");
const modalDesc = document.getElementById("modalDesc");
const modalPrice = document.getElementById("modalPrice");
const colorOptions = document.getElementById("colorOptions");
const modalAddBtn = document.getElementById("modalAddBtn");
const selectedColorLabel = document.getElementById("selectedColorLabel");

/* ===== Load products.json ===== */
async function loadProducts() {
  try {
    const res = await fetch("products.json?t=" + Date.now());
    if (!res.ok) throw new Error("Could not load products.json");
    const data = await res.json();

    filamentColors = data.colors || [];
    products = data.products || [];

    renderProducts();
    updateCartUI();
  } catch (err) {
    console.error(err);
    productGrid.innerHTML = `
      <p style="grid-column:1/-1;text-align:center;color:#ff6b6b;padding:2rem;">
        Could not load products.json<br>
        <small style="color:#8b9bb4">Make sure the file is in the same folder as index.html</small>
      </p>`;
  }
}

/* ===== Helpers ===== */
function getColor(id) {
  return filamentColors.find(c => c.id === id) || { id: "black", name: "Black", hex: "#1a1a1a" };
}

function productImageHTML(product) {
  if (product.image && product.image.trim() !== "") {
    return `<img src="${product.image}" alt="${product.title}" class="product-photo" onerror="this.style.display='none';this.nextElementSibling.style.display='flex'">
            <span class="product-emoji-fallback" style="display:none">${product.emoji || "📦"}</span>`;
  }
  return `<span class="product-emoji">${product.emoji || "📦"}</span>`;
}

/* ===== Render Products ===== */
function renderProducts() {
  const filtered = currentFilter === "all"
    ? products
    : products.filter(p => p.category === currentFilter);

  if (filtered.length === 0) {
    productGrid.innerHTML = `<p style="grid-column:1/-1;text-align:center;color:#8b9bb4;padding:2rem;">No products in this category yet.</p>`;
    return;
  }

  productGrid.innerHTML = filtered.map(p => `
    <article class="product-card" data-id="${p.id}">
      <div class="product-image" data-id="${p.id}">
        ${productImageHTML(p)}
        ${p.badge ? `<span class="product-badge">${p.badge}</span>` : ""}
      </div>
      <div class="product-body">
        <p class="product-category">${p.categoryLabel || p.category}</p>
        <h3 class="product-title">${p.title}</h3>
        <p class="product-desc">${p.description || ""}</p>
        <div class="product-colors-preview">
          ${(p.colors || []).slice(0, 6).map(cid => {
            const c = getColor(cid);
            return `<span class="color-dot" style="background:${c.hex}" title="${c.name}"></span>`;
          }).join("")}
          ${(p.colors || []).length > 6 ? `<span class="color-more">+${p.colors.length - 6}</span>` : ""}
        </div>
        <div class="product-footer">
          <span class="product-price">$${Number(p.price).toFixed(2)}</span>
          <button class="add-btn" data-id="${p.id}">Customize</button>
        </div>
      </div>
    </article>
  `).join("");

  document.querySelectorAll(".product-card").forEach(card => {
    card.addEventListener("click", () => openProductModal(+card.dataset.id));
  });
}

/* ===== Product Modal ===== */
function openProductModal(id) {
  const product = products.find(p => p.id === id);
  if (!product) return;

  selectedProduct = product;
  selectedColor = (product.colors && product.colors[0]) || "black";

  const imageEl = document.getElementById("modalImage");
  const emojiEl = document.getElementById("modalEmoji");

  if (product.image && product.image.trim() !== "") {
    imageEl.src = product.image;
    imageEl.style.display = "block";
    emojiEl.style.display = "none";
    imageEl.onerror = () => {
      imageEl.style.display = "none";
      emojiEl.style.display = "block";
      emojiEl.textContent = product.emoji || "📦";
    };
  } else {
    imageEl.style.display = "none";
    emojiEl.style.display = "block";
    emojiEl.textContent = product.emoji || "📦";
  }

  modalTitle.textContent = product.title;
  modalDesc.textContent = product.description || "";
  modalPrice.textContent = `$${Number(product.price).toFixed(2)}`;

  colorOptions.innerHTML = (product.colors || []).map(cid => {
    const c = getColor(cid);
    const isActive = cid === selectedColor ? "active" : "";
    return `
      <button class="color-swatch ${isActive}"
              data-color="${cid}"
              style="--swatch-color: ${c.hex}"
              title="${c.name}"
              aria-label="${c.name}">
      </button>
    `;
  }).join("");

  updateSelectedColorLabel();

  colorOptions.querySelectorAll(".color-swatch").forEach(btn => {
    btn.addEventListener("click", (e) => {
      e.stopPropagation();
      selectedColor = btn.dataset.color;
      colorOptions.querySelectorAll(".color-swatch").forEach(b => b.classList.remove("active"));
      btn.classList.add("active");
      updateSelectedColorLabel();
    });
  });

  productModal.classList.add("open");
  modalOverlay.classList.add("open");
  document.body.style.overflow = "hidden";
}

function closeProductModal() {
  productModal.classList.remove("open");
  modalOverlay.classList.remove("open");
  document.body.style.overflow = "";
  selectedProduct = null;
  selectedColor = null;
}

function updateSelectedColorLabel() {
  if (!selectedColor) return;
  const c = getColor(selectedColor);
  selectedColorLabel.textContent = c.name;
  selectedColorLabel.style.color = (c.hex === "#f5f5f5" || c.hex === "#e6a817") ? "#ccc" : c.hex;
}

/* ===== Cart Functions ===== */
function saveCart() {
  localStorage.setItem("printforge-cart", JSON.stringify(cart));
  updateCartUI();
}

function addToCartWithColor() {
  if (!selectedProduct || !selectedColor) return;

  const color = getColor(selectedColor);
  const cartKey = `${selectedProduct.id}-${selectedColor}`;

  const existing = cart.find(item => item.cartKey === cartKey);
  if (existing) {
    existing.qty += 1;
  } else {
    cart.push({
      cartKey,
      id: selectedProduct.id,
      title: selectedProduct.title,
      price: Number(selectedProduct.price),
      emoji: selectedProduct.emoji || "📦",
      image: selectedProduct.image || "",
      colorId: selectedColor,
      colorName: color.name,
      colorHex: color.hex,
      qty: 1
    });
  }

  saveCart();
  showToast(`${selectedProduct.title} (${color.name}) added to cart`);
  closeProductModal();
}

function removeFromCart(cartKey) {
  cart = cart.filter(item => item.cartKey !== cartKey);
  saveCart();
}

function changeQty(cartKey, delta) {
  const item = cart.find(i => i.cartKey === cartKey);
  if (!item) return;
  item.qty += delta;
  if (item.qty <= 0) {
    removeFromCart(cartKey);
  } else {
    saveCart();
  }
}

function updateCartUI() {
  const totalItems = cart.reduce((sum, i) => sum + i.qty, 0);
  cartCount.textContent = totalItems;

  if (cart.length === 0) {
    cartItems.innerHTML = `<p class="cart-empty">Your cart is empty</p>`;
  } else {
    cartItems.innerHTML = cart.map(item => `
      <div class="cart-item">
        <div class="cart-item-img">
          ${item.image ? `<img src="${item.image}" alt="" onerror="this.parentElement.textContent='${item.emoji}'">` : item.emoji}
        </div>
        <div class="cart-item-info">
          <div class="cart-item-title">${item.title}</div>
          <div class="cart-item-meta">
            <span class="cart-color-dot" style="background:${item.colorHex}"></span>
            ${item.colorName} · $${Number(item.price).toFixed(2)}
          </div>
          <div class="cart-item-actions">
            <button class="qty-btn" data-action="dec" data-key="${item.cartKey}">−</button>
            <span>${item.qty}</span>
            <button class="qty-btn" data-action="inc" data-key="${item.cartKey}">+</button>
            <button class="remove-btn" data-key="${item.cartKey}">Remove</button>
          </div>
        </div>
      </div>
    `).join("");

    cartItems.querySelectorAll(".qty-btn").forEach(btn => {
      btn.addEventListener("click", () => {
        changeQty(btn.dataset.key, btn.dataset.action === "inc" ? 1 : -1);
      });
    });
    cartItems.querySelectorAll(".remove-btn").forEach(btn => {
      btn.addEventListener("click", () => removeFromCart(btn.dataset.key));
    });
  }

  const total = cart.reduce((sum, i) => sum + i.price * i.qty, 0);
  cartTotal.textContent = `$${total.toFixed(2)}`;
}

/* ===== Cart Open/Close ===== */
function openCart() {
  cartDrawer.classList.add("open");
  cartOverlay.classList.add("open");
  document.body.style.overflow = "hidden";
}

function closeCartDrawer() {
  cartDrawer.classList.remove("open");
  cartOverlay.classList.remove("open");
  document.body.style.overflow = "";
}

/* ===== Toast ===== */
function showToast(message) {
  toast.textContent = message;
  toast.classList.add("show");
  setTimeout(() => toast.classList.remove("show"), 2200);
}

/* ===== Forms (demo) ===== */
document.getElementById("quoteForm").addEventListener("submit", e => {
  e.preventDefault();
  showToast("Quote request received! We'll reply within 24h.");
  e.target.reset();
});

document.getElementById("contactForm").addEventListener("submit", e => {
  e.preventDefault();
  showToast("Message sent. We'll get back to you soon.");
  e.target.reset();
});

checkoutBtn.addEventListener("click", async () => {
  if (cart.length === 0) {
    showToast("Your cart is empty");
    return;
  }

  // Ask for customer details
  const name = prompt("Your name:");
  if (!name) return;

  const email = prompt("Your email:");
  if (!email) return;

  const phone = prompt("Your phone (optional):") || "Not provided";

  // Build order summary
  const lines = cart.map(item => {
    return `• ${item.title} (${item.colorName}) × ${item.qty} = $${(item.price * item.qty).toFixed(2)}`;
  });

  const total = cart.reduce((sum, i) => sum + i.price * i.qty, 0);
  const summary = lines.join("\n") + `\n\nTOTAL: $${total.toFixed(2)}`;

  showToast("Sending your order...");

  try {
    const res = await fetch("https://api.web3forms.com/submit", {
      method: "POST",
      headers: { "Content-Type": "application/json", "Accept": "application/json" },
      body: JSON.stringify({
        access_key: "cdf3cecf-fa99-4d0a-b716-c5fac7258b18",
        subject: "New PrintForge Order",
        from_name: "PrintForge Shop",
        name: name,
        email: email,
        phone: phone,
        message: summary,
        total: `$${total.toFixed(2)}`
      })
    });

    const data = await res.json();
    if (data.success) {
      showToast("Order sent! We'll contact you soon.");
      cart = [];
      saveCart();
      closeCartDrawer();
    } else {
      showToast("Something went wrong. Please try again or email us.");
      console.error(data);
    }
  } catch (err) {
    console.error(err);
    showToast("Could not send order. Please try again.");
  }
});

/* ===== Filters ===== */
filterBtns.forEach(btn => {
  btn.addEventListener("click", () => {
    filterBtns.forEach(b => b.classList.remove("active"));
    btn.classList.add("active");
    currentFilter = btn.dataset.filter;
    renderProducts();
  });
});

/* ===== Mobile Menu ===== */
menuBtn.addEventListener("click", () => {
  nav.classList.toggle("open");
});

nav.querySelectorAll("a").forEach(link => {
  link.addEventListener("click", () => nav.classList.remove("open"));
});

/* ===== Event Listeners ===== */
cartBtn.addEventListener("click", openCart);
closeCart.addEventListener("click", closeCartDrawer);
cartOverlay.addEventListener("click", closeCartDrawer);

modalClose.addEventListener("click", closeProductModal);
modalOverlay.addEventListener("click", closeProductModal);
modalAddBtn.addEventListener("click", addToCartWithColor);

/* ===== Init ===== */
loadProducts();
