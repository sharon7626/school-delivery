/* ==========================================================
   校園外送 app.js（全站共用）
   購物車、訂單、會員資料都存在 localStorage，
   換頁或重新整理都不會消失（資料只存在使用者自己的瀏覽器）。
   ========================================================== */

/* 要真正開始接單時，把這裡換成店家實際收單的信箱 */
const ORDER_EMAIL = "support@example.com";

const DELIVERY_FEE = 30;

const RESTAURANTS = {
  "sunny-cafe": {
    name: "晴天咖啡",
    tag: "咖啡輕食",
    hours: "08:00–18:00",
    menu: [
      { id: "latte", name: "經典拿鐵", desc: "嚴選優質咖啡豆與鮮乳的完美比例，口感綿密滑順，每日晨間首選。", price: 120 },
      { id: "panini", name: "燻雞帕尼尼", desc: "香熱現烤熱壓吐司，內含飽滿鮮嫩燻雞肉與牽絲起司，香氣四溢。", price: 150 },
      { id: "americano", name: "美式黑咖啡", desc: "經典純粹的黑咖啡，保留最原始的香醇與清爽回甘，無糖零負擔。", price: 90 },
    ],
  },
  "good-meal": {
    name: "好食便當",
    tag: "台式便當",
    hours: "10:30–20:00",
    menu: [
      { id: "chicken-leg", name: "香滷雞腿便當", desc: "滷到入味的去骨雞腿，附三樣時蔬與白飯，午餐人氣第一名。", price: 110 },
      { id: "pork-chop", name: "酥炸排骨便當", desc: "現炸厚切排骨，外酥內嫩，配菜每日更換。", price: 100 },
      { id: "veggie", name: "田園蔬食便當", desc: "六樣季節蔬食搭配五穀飯，清爽無負擔。", price: 90 },
    ],
  },
  "pasta-together": {
    name: "義起吃",
    tag: "義大利麵",
    hours: "11:00–21:00",
    menu: [
      { id: "carbonara", name: "培根奶油白醬麵", desc: "濃郁白醬與煙燻培根，經典不敗的人氣款。", price: 160 },
      { id: "pomodoro", name: "番茄鮮蔬紅醬麵", desc: "新鮮番茄慢熬紅醬，酸甜開胃。", price: 140 },
      { id: "aglio", name: "蒜香橄欖油麵", desc: "清炒蒜片與辣椒，簡單卻香氣十足。", price: 130 },
    ],
  },
};

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

function addToCart(restaurantId, itemId, qty) {
  const item = RESTAURANTS[restaurantId]?.menu.find((m) => m.id === itemId);
  if (!item) return null;

  const cart = getCart();
  const line = cart.find((l) => l.restaurantId === restaurantId && l.itemId === itemId);
  if (line) {
    line.qty += qty;
  } else {
    cart.push({ restaurantId, itemId, name: item.name, price: item.price, qty });
  }
  saveCart(cart);
  return item;
}

/* ---------- 全站點擊事件（數量加減、加入購物車、購物車明細操作） ---------- */
document.addEventListener("click", (event) => {
  const qtyButton = event.target.closest("[data-qty-step]");
  if (qtyButton) {
    const valueElement = qtyButton.closest(".qty-control").querySelector("[data-qty]");
    const next = Math.max(1, parseInt(valueElement.textContent, 10) + Number(qtyButton.dataset.qtyStep));
    valueElement.textContent = next;
    return;
  }

  const addButton = event.target.closest("[data-add-to-cart]");
  if (addButton) {
    const qtyElement = addButton.closest(".add-row")?.querySelector("[data-qty]");
    const qty = qtyElement ? parseInt(qtyElement.textContent, 10) : 1;
    const item = addToCart(addButton.dataset.restaurant, addButton.dataset.addToCart, qty);
    if (item) setStatusMessage(`已加入「${item.name}」× ${qty}`);
    if (qtyElement) qtyElement.textContent = 1;
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

/* ---------- 菜單頁 ---------- */
function initMenuPage() {
  const grid = document.querySelector("[data-menu-grid]");
  if (!grid) return;

  const requested = new URLSearchParams(window.location.search).get("restaurant");
  const restaurantId = RESTAURANTS[requested] ? requested : "sunny-cafe";
  const restaurant = RESTAURANTS[restaurantId];

  document.title = `校園外送｜${restaurant.name}菜單`;
  const titleElement = document.querySelector("[data-menu-title]");
  if (titleElement) titleElement.textContent = `${restaurant.name}菜單`;
  const hoursElement = document.querySelector("[data-menu-hours]");
  if (hoursElement) hoursElement.textContent = `${restaurant.tag}・營業時間 ${restaurant.hours}`;

  const tabs = document.querySelector("[data-menu-tabs]");
  if (tabs) {
    tabs.innerHTML = Object.entries(RESTAURANTS)
      .map(([id, r]) => `<a href="menu.html?restaurant=${id}"${id === restaurantId ? ' class="is-active" aria-current="page"' : ""}>${r.name}</a>`)
      .join("");
  }

  grid.innerHTML = restaurant.menu
    .map((item) => `
      <div class="card">
        <h3>${item.name}</h3>
        <p class="muted">${item.desc}</p>
        <p class="price">${money(item.price)}</p>
        <div class="add-row">
          <span class="qty-control">
            <button type="button" class="qty-btn" data-qty-step="-1" aria-label="減少數量">−</button>
            <span class="qty-val" data-qty>1</span>
            <button type="button" class="qty-btn" data-qty-step="1" aria-label="增加數量">+</button>
          </span>
          <button type="button" class="button add-btn" data-add-to-cart="${item.id}" data-restaurant="${restaurantId}">加入購物車</button>
        </div>
      </div>
    `)
    .join("");
}

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
          <strong>${line.name}</strong>
          <span class="item-detail muted">${RESTAURANTS[line.restaurantId]?.name ?? ""}・${money(line.price)}</span>
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
    ...order.items.map((l) => `${RESTAURANTS[l.restaurantId]?.name ?? ""}｜${l.name} × ${l.qty}＝${money(l.price * l.qty)}`),
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
initMenuPage();
initCartPage();
renderCartPage();
renderOrdersPage();
initProfilePage();

// 訂單狀態頁：每 30 秒更新一次進度
if (document.querySelector("[data-orders-page]")) {
  setInterval(renderOrdersPage, 30000);
}
