/* ==========================================================
   校園外送 app.js（全站共用）
   購物車、訂單、會員資料都存在 localStorage，
   換頁或重新整理都不會消失（資料只存在使用者自己的瀏覽器）。

   菜單資料由菜單頁自己維護，「加入購物車」按鈕只要帶上：
     data-add-to-cart="餐點名稱"
     data-price="價格"
     data-restaurant="餐廳代號"（用來合併同一間店的餐點）
     data-restaurant-name="餐廳名稱"（購物車顯示用）
   app.js 就會自動接手購物車與下單流程。
   ========================================================== */

/* 要真正開始接單時，把這裡換成店家實際收單的信箱 */
const ORDER_EMAIL = "support@example.com";

const DELIVERY_FEE = 30;

/* 訂單進度：依下單後經過的分鐘數推進（尚未串接店家端的暫行做法） */
const ORDER_STEPS = [
  { minutes: 0, label: "店家接單", desc: "店家已確認訂單" },
  { minutes: 2, label: "餐點製作中", desc: "餐點準備中" },
  { minutes: 8, label: "外送途中", desc: "外送員正在路上" },
  { minutes: 15, label: "已送達", desc: "餐點已送達，請享用" },
];

/* ---------- localStorage ---------- */
function readStore(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}

function writeStore(key, value) {
  localStorage.setItem(key, JSON.stringify(value));
}

const getCart = () => readStore("sd_cart", []);
const getOrders = () => readStore("sd_orders", []);
const saveOrders = (orders) => writeStore("sd_orders", orders);
const getProfile = () => readStore("sd_profile", {});
const saveProfile = (profile) => writeStore("sd_profile", profile);

function saveCart(cart) {
  writeStore("sd_cart", cart);
  updateCartCount();
}

/* ---------- 共用工具 ---------- */
const money = (n) => `NT$${n}`;
const cartQty = () => getCart().reduce((sum, line) => sum + line.qty, 0);
const cartSubtotal = () => getCart().reduce((sum, line) => sum + line.qty * line.price, 0);

function updateCartCount() {
  const count = cartQty();
  document.querySelectorAll("[data-cart-count]").forEach((element) => {
    element.textContent = count;
  });
}

function setStatusMessage(text) {
  const element = document.querySelector("[data-status-message]");
  if (element) element.textContent = text;
}

function escapeHtml(text) {
  return String(text).replace(/[&<>"']/g, (ch) => (
    { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[ch]
  ));
}

/* ---------- 加入購物車 ---------- */
function addToCartFromButton(button) {
  const name = button.dataset.addToCart;
  if (!name) return null;

  let price = Number(button.dataset.price);
  if (!Number.isFinite(price)) price = 0;
  const restaurantId = button.dataset.restaurant ?? "";
  const restaurantName = button.dataset.restaurantName ?? "";

  // 讀取同一張卡片上的數量加減器（沒有的話就當 1）
  const qtyElement = button.closest(".card")?.querySelector(".qty-val");
  const qty = Math.max(1, parseInt(qtyElement?.textContent ?? "1", 10) || 1);

  const cart = getCart();
  const line = cart.find((l) => l.restaurantId === restaurantId && l.name === name);
  if (line) {
    line.qty += qty;
  } else {
    cart.push({ restaurantId, restaurantName, name, price, qty });
  }
  saveCart(cart);

  if (qtyElement) qtyElement.textContent = "1";
  return { name, qty };
}

/* ---------- 全站點擊事件（加入購物車、購物車明細操作） ---------- */
document.addEventListener("click", (event) => {
  const addButton = event.target.closest("[data-add-to-cart]");
  if (addButton) {
    const added = addToCartFromButton(addButton);
    if (added) setStatusMessage(`已加入「${added.name}」× ${added.qty}`);
    return;
  }

  const lineButton = event.target.closest("[data-line-action]");
  if (lineButton) {
    const cart = getCart();
    const line = cart[Number(lineButton.dataset.lineIndex)];
    if (!line) return;

    const action = lineButton.dataset.lineAction;
    if (action === "plus") line.qty += 1;
    if (action === "minus") line.qty = Math.max(1, line.qty - 1);
    if (action === "remove") cart.splice(Number(lineButton.dataset.lineIndex), 1);
    saveCart(cart);
    renderCartPage();
  }
});

/* ---------- 購物車頁 ---------- */
function renderCartPage() {
  const root = document.querySelector("[data-cart-root]");
  if (!root) return;

  const cart = getCart();
  const checkoutSection = document.querySelector("[data-checkout-section]");

  if (!cart.length) {
    root.innerHTML = `
      <p class="muted">購物車目前是空的。</p>
      <a class="button" href="restaurants.html">去逛逛餐廳</a>
    `;
    if (checkoutSection) checkoutSection.hidden = true;
    return;
  }
  if (checkoutSection) checkoutSection.hidden = false;

  const subtotal = cartSubtotal();
  const lines = cart
    .map((line, index) => `
      <li class="cart-line">
        <span>
          <strong>${escapeHtml(line.name)}</strong>
          <span class="item-detail muted">${line.restaurantName ? `${escapeHtml(line.restaurantName)}・` : ""}${money(line.price)}</span>
        </span>
        <span class="line-actions">
          <span class="qty-control">
            <button type="button" class="qty-btn" data-line-action="minus" data-line-index="${index}" aria-label="減少數量">−</button>
            <span class="qty-val">${line.qty}</span>
            <button type="button" class="qty-btn" data-line-action="plus" data-line-index="${index}" aria-label="增加數量">+</button>
          </span>
          <span class="line-total">${money(line.price * line.qty)}</span>
          <button type="button" class="remove-btn" data-line-action="remove" data-line-index="${index}">移除</button>
        </span>
      </li>
    `)
    .join("");

  root.innerHTML = `
    <ul class="cart-lines">
      ${lines}
      <li class="cart-line"><span>小計</span><span>${money(subtotal)}</span></li>
      <li class="cart-line"><span>運費</span><span>${money(DELIVERY_FEE)}</span></li>
      <li class="cart-line total"><span>總金額</span><span>${money(subtotal + DELIVERY_FEE)}</span></li>
    </ul>
  `;
}

function buildOrderMailto(order) {
  const paymentLabel = order.customer.payment === "cash" ? "送達時現金付款" : order.customer.payment;
  const body = [
    `訂單編號：${order.id}`,
    `訂購人：${order.customer.name}（${order.customer.phone}）`,
    `送達地點：${order.customer.place}`,
    `付款方式：${paymentLabel}`,
    order.customer.note ? `備註：${order.customer.note}` : null,
    "",
    "餐點內容：",
    ...order.items.map((l) => `${l.restaurantName ? `${l.restaurantName}｜` : ""}${l.name} × ${l.qty}＝${money(l.price * l.qty)}`),
    "",
    `小計：${money(order.subtotal)}`,
    `運費：${money(order.deliveryFee)}`,
    `總金額：${money(order.total)}`,
  ]
    .filter((line) => line !== null)
    .join("\n");

  return `mailto:${ORDER_EMAIL}?subject=${encodeURIComponent(`新訂單 ${order.id}`)}&body=${encodeURIComponent(body)}`;
}

function initCartPage() {
  const form = document.querySelector("[data-checkout-form]");
  if (!form) return;

  renderCartPage();

  // 帶入會員中心儲存的常用資料
  const profile = getProfile();
  if (profile.name) form.elements.name.value = profile.name;
  if (profile.phone) form.elements.phone.value = profile.phone;
  if (profile.place) form.elements.place.value = profile.place;

  form.addEventListener("submit", (event) => {
    event.preventDefault();
    const cart = getCart();
    if (!cart.length) return;

    const customer = {
      name: form.elements.name.value.trim(),
      phone: form.elements.phone.value.trim(),
      place: form.elements.place.value.trim(),
      payment: form.elements.payment.value,
      note: form.elements.note.value.trim(),
    };
    saveProfile({ name: customer.name, phone: customer.phone, place: customer.place });

    const subtotal = cartSubtotal();
    const order = {
      id: `SD-${Date.now().toString(36).toUpperCase()}`,
      createdAt: Date.now(),
      items: cart,
      subtotal,
      deliveryFee: DELIVERY_FEE,
      total: subtotal + DELIVERY_FEE,
      customer,
    };

    const orders = getOrders();
    orders.unshift(order);
    saveOrders(orders);
    saveCart([]);

    document.querySelector("[data-order-id]").textContent = order.id;
    const mailtoLink = document.querySelector("[data-order-mailto]");
    if (mailtoLink) mailtoLink.href = buildOrderMailto(order);

    document.querySelector("[data-cart-section]").hidden = true;
    document.querySelector("[data-checkout-section]").hidden = true;
    const result = document.querySelector("[data-order-result]");
    result.hidden = false;
    result.scrollIntoView({ behavior: "smooth" });
  });
}

/* ---------- 訂單狀態頁 ---------- */
function orderStepIndex(order) {
  const minutes = (Date.now() - order.createdAt) / 60000;
  let index = 0;
  ORDER_STEPS.forEach((step, i) => {
    if (minutes >= step.minutes) index = i;
  });
  return index;
}

function formatTime(timestamp) {
  return new Date(timestamp).toLocaleString("zh-TW", { hour12: false });
}

function renderOrdersPage() {
  const root = document.querySelector("[data-orders-page]");
  if (!root) return;

  const orders = getOrders();
  if (!orders.length) {
    root.innerHTML = `
      <section class="panel">
        <h2>目前沒有訂單</h2>
        <p class="muted">先去看看有什麼好吃的吧。</p>
        <a class="button" href="restaurants.html">瀏覽餐廳</a>
      </section>
    `;
    return;
  }

  root.innerHTML = orders
    .map((order) => {
      const current = orderStepIndex(order);
      const done = current === ORDER_STEPS.length - 1;
      const steps = ORDER_STEPS
        .map((step, i) => {
          const state = done || i < current ? "is-complete" : i === current ? "is-current" : "";
          const ariaCurrent = !done && i === current ? ' aria-current="step"' : "";
          return `<li class="progress-step ${state}"${ariaCurrent}><strong>${step.label}</strong><span>${step.desc}</span></li>`;
        })
        .join("");
      const items = order.items.map((l) => `${escapeHtml(l.name)} × ${l.qty}`).join("、");

      return `
        <section class="panel">
          <h2>訂單 ${order.id}</h2>
          <p class="muted">${formatTime(order.createdAt)}・送達地點：${escapeHtml(order.customer.place)}</p>
          <p>${items}｜總金額 ${money(order.total)}</p>
          <ol class="order-progress">${steps}</ol>
        </section>
      `;
    })
    .join("");
}

/* ---------- 會員中心頁 ---------- */
function initProfilePage() {
  const form = document.querySelector("[data-profile-form]");
  if (!form) return;

  const greeting = document.querySelector("[data-profile-greeting]");
  const profile = getProfile();
  if (profile.name) {
    if (greeting) greeting.textContent = `你好，${profile.name}`;
    form.elements.name.value = profile.name;
  }
  if (profile.phone) form.elements.phone.value = profile.phone;
  if (profile.place) form.elements.place.value = profile.place;

  form.addEventListener("submit", (event) => {
    event.preventDefault();
    const next = {
      name: form.elements.name.value.trim(),
      phone: form.elements.phone.value.trim(),
      place: form.elements.place.value.trim(),
    };
    saveProfile(next);
    if (greeting && next.name) greeting.textContent = `你好，${next.name}`;
    const saved = document.querySelector("[data-profile-saved]");
    if (saved) saved.textContent = "已儲存，下次結帳會自動帶入。";
  });
}

/* ---------- 每頁初始化 ---------- */
updateCartCount();
initCartPage();
renderCartPage();
renderOrdersPage();
initProfilePage();

// 訂單狀態頁：每 30 秒更新一次進度
if (document.querySelector("[data-orders-page]")) {
  setInterval(renderOrdersPage, 30000);
}
