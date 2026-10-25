// ===== Bắt buộc đăng nhập =====
const currentUser = JSON.parse(localStorage.getItem("currentUser"));
if (!currentUser) {
  window.location.href = "./login.html";
}

// ===== Hàm dùng chung =====
function formatPrice(n) {
  return n.toLocaleString("vi-VN") + "₫";
}

function showToast(message) {
  const toast = document.getElementById("toast");
  if (!toast) return;
  toast.textContent = message;
  toast.classList.add("show");
  setTimeout(() => toast.classList.remove("show"), 2200);
}

// ===== Render thông số kỹ thuật (Dùng cho Popup) =====
function renderSpecs(specs) {
  if (!specs || specs.length === 0) return "";
  return `
    <div class="specs-block">
      <h4>Thông số kỹ thuật</h4>
      <table class="specs-table">
        <tbody>
          ${specs
            .map(
              (s) => `
            <tr>
              <th>${s.label}</th>
              <td>${s.value}</td>
            </tr>
          `,
            )
            .join("")}
        </tbody>
      </table>
    </div>
  `;
}

// ===== Khai báo DOM =====
const cartModal = document.getElementById("cart-modal");
const cartItemsDiv = document.getElementById("cart-items");
const productModal = document.getElementById("product-modal");
const listDiv = document.getElementById("product-list");
const statusEl = document.getElementById("product-status");
const searchInput = document.getElementById("product-search");
const filterSelect = document.getElementById("product-filter");

let products = [];
let modalQty = 1; // Biến lưu số lượng khi chọn trong popup

// ===== Giỏ hàng =====
function getCart() {
  return JSON.parse(localStorage.getItem("cart")) || [];
}

function updateCartCount() {
  const el = document.getElementById("cart-count");
  if (el) el.textContent = getCart().reduce((sum, item) => sum + item.qty, 0);
}

function saveCart(cart) {
  localStorage.setItem("cart", JSON.stringify(cart));
  updateCartCount();
  renderCart();
}

// Cập nhật lại hàm buyProduct để nhận số lượng truyền vào
function buyProduct(product, quantity = 1) {
  if (!product) return;
  const cart = getCart();
  const found = cart.find((item) => item.id === product.id);
  if (found) found.qty += quantity;
  else cart.push({ id: product.id, qty: quantity });

  saveCart(cart);
  showToast(`Đã thêm ${quantity} "${product.name}" vào giỏ hàng`);
}

function renderCart() {
  if (!cartItemsDiv) return;
  const cart = getCart();

  if (cart.length === 0) {
    cartItemsDiv.innerHTML = `<p class="cart-empty">Giỏ hàng đang trống.</p>`;
    const totalEl = document.getElementById("cart-total");
    if (totalEl) totalEl.textContent = formatPrice(0);
    return;
  }

  cartItemsDiv.innerHTML = cart
    .map((item) => {
      const product = products.find((p) => p.id === item.id);
      if (!product) return "";
      return `
      <div class="cart-row">
        <div class="cart-info">
          <strong>${product.name}</strong>
          <span>${formatPrice(product.price)}</span>
        </div>
        <div class="cart-qty">
          <button type="button" data-action="minus" data-id="${item.id}">−</button>
          <span>${item.qty}</span>
          <button type="button" data-action="plus" data-id="${item.id}">+</button>
        </div>
        <button type="button" class="cart-remove" data-action="remove" data-id="${item.id}" aria-label="Xóa">🗑</button>
      </div>
    `;
    })
    .join("");

  const total = cart.reduce((sum, item) => {
    const product = products.find((p) => p.id === item.id);
    return product ? sum + product.price * item.qty : sum;
  }, 0);
  const totalEl = document.getElementById("cart-total");
  if (totalEl) totalEl.textContent = formatPrice(total);
}

// ===== Sự kiện giỏ hàng =====
if (cartItemsDiv) {
  cartItemsDiv.addEventListener("click", function (e) {
    const btn = e.target.closest("button");
    if (!btn) return;
    const id = Number(btn.dataset.id);
    let cart = getCart();

    if (btn.dataset.action === "remove") {
      cart = cart.filter((item) => item.id !== id);
    } else if (btn.dataset.action === "plus") {
      const item = cart.find((i) => i.id === id);
      if (item) item.qty += 1;
    } else if (btn.dataset.action === "minus") {
      const item = cart.find((i) => i.id === id);
      if (item) {
        item.qty -= 1;
        if (item.qty <= 0) cart = cart.filter((i) => i.id !== id);
      }
    }
    saveCart(cart);
  });
}

const cartClearBtn = document.getElementById("cart-clear");
if (cartClearBtn) {
  cartClearBtn.addEventListener("click", function () {
    if (getCart().length === 0) return;
    if (confirm("Xóa tất cả sản phẩm trong giỏ?")) saveCart([]);
  });
}

const cartBtn = document.getElementById("cart-btn");
if (cartBtn) {
  cartBtn.addEventListener("click", function () {
    renderCart();
    cartModal.showModal();
  });
}

const cartCloseBtn = document.getElementById("cart-close");
if (cartCloseBtn)
  cartCloseBtn.addEventListener("click", () => cartModal.close());

if (cartModal) {
  cartModal.addEventListener("click", (e) => {
    if (e.target === cartModal) cartModal.close();
  });
}
if (productModal) {
  productModal.addEventListener("click", (e) => {
    if (e.target === productModal) productModal.close();
  });
}

// ===== Ảnh sản phẩm =====
function productImage(p) {
  return `<img class="product-photo" src="${p.image}" alt="${p.name}" loading="lazy"
    onerror="this.outerHTML='<span class=\\'emoji-fallback\\' style=\\'font-size:2rem; display:flex; align-items:center; justify-content:center; width:100%; height:100%;\\'>${p.emoji}</span>'">`;
}

// ===== Tải dữ liệu sản phẩm =====
const API_URL = "../data/products.json";

async function loadProducts() {
  statusEl.textContent = "Đang tải sản phẩm...";
  try {
    const response = await fetch(API_URL);
    if (!response.ok) throw new Error("HTTP " + response.status);
    products = await response.json();
    products = products.concat(getCustomProducts()); // thêm sản phẩm do người dùng tạo
    applyFilter();
    updateCartCount();
    renderCart();
  } catch (error) {
    console.error(error);
    statusEl.textContent =
      "Không tải được sản phẩm. Hãy chạy bằng Live Server hoặc GitHub Pages.";
    statusEl.className = "player-status api-error";
  }
}

function applyFilter() {
  const keyword = searchInput.value.trim().toLowerCase();
  const category = filterSelect.value;
  const result = products.filter(
    (p) =>
      p.name.toLowerCase().includes(keyword) &&
      (category === "all" || p.category === category),
  );
  renderProducts(result);
}

function renderProducts(list) {
  listDiv.innerHTML = "";
  if (list.length === 0) {
    statusEl.textContent = "Không tìm thấy sản phẩm phù hợp.";
    return;
  }
  statusEl.textContent = `Hiển thị ${list.length} sản phẩm`;

  list.forEach((p, i) => {
    const card = document.createElement("article");
    card.className = "product-card";
    card.dataset.id = p.id;
    card.style.setProperty("--i", i);
    card.innerHTML = `
      <div class="product-img" data-action="detail" role="button" tabindex="0" aria-label="Xem chi tiết ${p.name}">
        ${p.custom ? `<button class="btn-delete" type="button" data-action="delete" aria-label="Xóa sản phẩm">🗑 Xóa</button>` : ""}
        <span class="stock-tag ${p.stock <= 15 ? "low" : ""}">${p.stock <= 15 ? "Sắp hết · " : "Còn "}${p.stock}</span>
        <div class="product-emoji">${productImage(p)}</div>
      </div>

      <div class="product-body">
        <div class="product-cat"><span class="chip">${p.category}</span><span class="rating">⭐ ${p.rating}</span></div>
        <h3 data-action="detail">${p.name}</h3>
        <div class="price">${formatPrice(p.price)}</div>

        <div class="product-desc" id="desc-${p.id}">
          <div>
            <p>${p.description}</p>
            <button type="button" class="link-detail" data-action="detail">Xem chi tiết →</button>
          </div>
        </div>
      </div>

      <div class="product-actions">
        <button class="btn btn-detail" type="button" data-action="desc" aria-expanded="false" aria-controls="desc-${p.id}">Mô tả ▾</button>
        <button class="btn btn-buy" type="button" data-action="buy">🛒 Mua</button>
      </div>
    `;
    listDiv.appendChild(card);
  });
}

// ===== Sự kiện click trong danh sách sản phẩm =====
listDiv.addEventListener("click", function (e) {
  const el = e.target.closest("[data-action]");
  if (!el) return;

  const card = el.closest(".product-card");
  const id = Number(card.dataset.id);
  const action = el.dataset.action;

  if (action === "detail") {
    showDetail(id);
  } else if (action === "desc") {
    const isOpen = card.classList.toggle("open");
    el.setAttribute("aria-expanded", isOpen);
    el.textContent = isOpen ? "Thu gọn ▴" : "Mô tả ▾";
  } else if (action === "delete") {
    deleteCustomProduct(id);
  } else if (action === "buy") {
    if (el.disabled) return;
    buyProduct(
      products.find((p) => p.id === id),
      1,
    ); // Mua ở ngoài thì mặc định +1
    el.classList.add("added");
    el.textContent = "✓ Đã thêm";
    el.disabled = true;
    setTimeout(() => {
      el.classList.remove("added");
      el.textContent = "🛒 Mua";
      el.disabled = false;
    }, 1200);
  }
});

listDiv.addEventListener("keydown", function (e) {
  if (e.key === "Enter" && e.target.matches('[role="button"]'))
    e.target.click();
});

// ===== Chi tiết sản phẩm (Popup - Có chứa thông số kỹ thuật và Bộ chọn số lượng) =====
function showDetail(id) {
  const p = products.find((item) => item.id === id);
  if (!p) return;

  modalQty = 1; // Reset lại số lượng về 1 mỗi lần mở popup

  document.getElementById("modal-body").innerHTML = `
    <div class="detail-box">
      <div class="detail-media">
        <div class="product-emoji big">${productImage(p)}</div>
      </div>
      <div class="detail-info">
        <span class="chip">${p.category}</span>
        <h3>${p.name}</h3>
        <div class="detail-meta">
          <span>⭐ ${p.rating}</span>
          <span>${p.brand}</span>
          <span>Còn ${p.stock} sản phẩm</span>
        </div>
        <div class="detail-price">${formatPrice(p.price)}</div>
        <h4>Mô tả</h4>
        <p>${p.description}</p>
        ${renderSpecs(p.specs)}
        
        <div class="modal-actions">
          <div class="modal-qty-selector">
            <button type="button" id="modal-qty-minus">−</button>
            <input type="text" id="modal-qty-input" value="1" readonly>
            <button type="button" id="modal-qty-plus">+</button>
          </div>
          <button class="btn btn-buy" type="button" id="modal-buy">🛒 Thêm vào giỏ hàng</button>
        </div>
      </div>
    </div>
  `;

  // Logic cho nút + và -
  const qtyInput = document.getElementById("modal-qty-input");
  const btnMinus = document.getElementById("modal-qty-minus");
  const btnPlus = document.getElementById("modal-qty-plus");

  btnMinus.addEventListener("click", () => {
    if (modalQty > 1) {
      modalQty--;
      qtyInput.value = modalQty;
    }
  });

  btnPlus.addEventListener("click", () => {
    if (modalQty < p.stock) {
      modalQty++;
      qtyInput.value = modalQty;
    } else {
      showToast("Số lượng đã đạt giới hạn tồn kho!");
    }
  });

  // Nút thêm vào giỏ hàng
  document.getElementById("modal-buy").addEventListener("click", function () {
    buyProduct(p, modalQty); // Truyền số lượng đã chọn
    productModal.close();
  });

  productModal.showModal();
}

const modalCloseBtn = document.getElementById("modal-close");
if (modalCloseBtn)
  modalCloseBtn.addEventListener("click", () => productModal.close());

searchInput.addEventListener("input", applyFilter);
filterSelect.addEventListener("change", applyFilter);

// ===== Thêm / xóa sản phẩm (lưu trong localStorage) =====
const addModal = document.getElementById("add-modal");
const addForm = document.getElementById("add-form");

function getCustomProducts() {
  return JSON.parse(localStorage.getItem("customProducts")) || [];
}

function saveCustomProducts(list) {
  localStorage.setItem("customProducts", JSON.stringify(list));
}

function escapeText(s) {
  return String(s).replace(
    /[&<>"']/g,
    (c) =>
      ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#39;",
      })[c],
  );
}

const addBtn = document.getElementById("add-btn");
if (addBtn) addBtn.addEventListener("click", () => addModal.showModal());

const addCloseBtn = document.getElementById("add-close");
if (addCloseBtn) addCloseBtn.addEventListener("click", () => addModal.close());

const addCancelBtn = document.getElementById("add-cancel");
if (addCancelBtn) {
  addCancelBtn.addEventListener("click", () => {
    addForm.reset();
    addModal.close();
  });
}

if (addModal) {
  addModal.addEventListener("click", (e) => {
    if (e.target === addModal) addModal.close();
  });
}

if (addForm) {
  addForm.addEventListener("submit", function (e) {
    e.preventDefault();

    const newProduct = {
      id: Date.now(), // id dạng số, giống các sản phẩm có sẵn
      name: escapeText(document.getElementById("new-name").value.trim()),
      brand: "Khác",
      category: document.getElementById("new-category").value,
      price: Number(document.getElementById("new-price").value),
      image:
        document.getElementById("new-image").value.trim() ||
        "../images/none.png",
      emoji: "🏸",
      description:
        escapeText(document.getElementById("new-desc").value.trim()) ||
        "Chưa có mô tả.",
      rating: "Mới",
      specs: [],
      custom: true,
    };

    const custom = getCustomProducts();
    custom.push(newProduct);
    saveCustomProducts(custom);
    products.push(newProduct);

    addForm.reset();
    addModal.close();
    applyFilter();
    showToast(`Đã thêm "${newProduct.name}"`);
  });
}

function deleteCustomProduct(id) {
  const p = products.find((item) => item.id === id);
  if (!p || !p.custom) return;
  if (!confirm(`Xóa "${p.name}"?`)) return;

  saveCustomProducts(getCustomProducts().filter((item) => item.id !== id));
  products = products.filter((item) => item.id !== id);
  saveCart(getCart().filter((item) => item.id !== id)); // bỏ khỏi giỏ hàng nếu có
  applyFilter();
  showToast("Đã xóa sản phẩm");
}

// ===== Khởi động =====
updateCartCount();
loadProducts();
