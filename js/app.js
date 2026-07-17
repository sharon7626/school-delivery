let cartCount = 0;
const cartCountElements = document.querySelectorAll("[data-cart-count]");
const statusMessage = document.querySelector("[data-status-message]");

document.addEventListener("click", (event) => {
  const button = event.target.closest("[data-add-to-cart]");

  if (!button) return;

  cartCount += 1;
  cartCountElements.forEach((element) => {
    element.textContent = cartCount;
  });

  if (statusMessage) {
    statusMessage.textContent = `已加入「${button.dataset.addToCart}」`;
  }
});
