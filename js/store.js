const CART_KEY = "inspirarte-cart";

function getCart() {
  try {
    return JSON.parse(localStorage.getItem(CART_KEY)) || [];
  } catch {
    return [];
  }
}

function saveCart(cart) {
  localStorage.setItem(CART_KEY, JSON.stringify(cart));
  updateCartCount();
}

function formatPrice(value) {
  return `${new Intl.NumberFormat("es-CO").format(value)} COP`;
}

function cartQuantity(cart) {
  return cart.reduce((total, item) => total + item.quantity, 0);
}

function cartSubtotal(cart) {
  return cart.reduce((total, item) => total + item.price * item.quantity, 0);
}

function updateCartCount() {
  const cart = getCart();
  const quantity = cartQuantity(cart);
  document.querySelectorAll("#cart-count").forEach((element) => {
    element.textContent = String(quantity);
  });
  document.querySelectorAll(".cart-link").forEach((link) => {
    link.setAttribute("aria-label", `Carrito de compras, ${quantity} artículos`);
  });
}

function addToCart(button) {
  const cart = getCart();
  const id = button.dataset.id;
  const existing = cart.find((item) => item.id === id);

  if (existing) {
    existing.quantity += 1;
  } else {
    cart.push({
      id,
      name: button.dataset.name,
      price: Number(button.dataset.price),
      image: button.dataset.image,
      quantity: 1
    });
  }
  saveCart(cart);

  const message = document.querySelector("#cart-message");
  if (message) message.textContent = `${button.dataset.name} añadido a la bolsa.`;
  button.textContent = "Añadido";
  window.setTimeout(() => { button.textContent = "Añadir a la bolsa"; }, 900);
}

function removeFromCart(id) {
  saveCart(getCart().filter((item) => item.id !== id));
  renderCart();
}

function changeQuantity(id, amount) {
  const cart = getCart();
  const item = cart.find((product) => product.id === id);
  if (!item) return;
  item.quantity += amount;
  if (item.quantity <= 0) {
    removeFromCart(id);
    return;
  }
  saveCart(cart);
  renderCart();
}

function renderCart() {
  const container = document.querySelector("#contenedor-pedido");
  if (!container) return;
  const cart = getCart();

  if (!cart.length) {
    container.innerHTML = `
      <div class="empty-cart">
        <p class="eyebrow">Tu bolsa está lista para estrenar</p>
        <h2>Aún no has agregado accesorios</h2>
        <a class="button" href="index.html#productos">Explorar la colección</a>
      </div>`;
  } else {
    container.innerHTML = cart.map((item) => `
      <article class="cart-item">
        <img src="${item.image}" alt="${item.name}">
        <div class="cart-item-info">
          <p class="product-category">InspirArte</p>
          <h3>${item.name}</h3>
          <strong>${formatPrice(item.price)}</strong>
          <div class="quantity-control" aria-label="Cantidad de ${item.name}">
            <button type="button" data-action="minus" data-id="${item.id}" aria-label="Reducir cantidad">−</button>
            <span>${item.quantity}</span>
            <button type="button" data-action="plus" data-id="${item.id}" aria-label="Aumentar cantidad">+</button>
          </div>
        </div>
        <button class="remove-button" type="button" data-action="remove" data-id="${item.id}" aria-label="Eliminar ${item.name}">Eliminar</button>
      </article>`).join("");
  }

  const subtotal = cartSubtotal(cart);
  const shipping = cart.length ? 12000 : 0;
  const subtotalElement = document.querySelector("#subtotal");
  const shippingElement = document.querySelector("#shipping");
  const totalElement = document.querySelector("#total");
  if (subtotalElement) subtotalElement.textContent = formatPrice(subtotal);
  if (shippingElement) shippingElement.textContent = formatPrice(shipping);
  if (totalElement) totalElement.textContent = formatPrice(subtotal + shipping);

  container.querySelectorAll("[data-action]").forEach((button) => {
    button.addEventListener("click", () => {
      if (button.dataset.action === "remove") removeFromCart(button.dataset.id);
      if (button.dataset.action === "plus") changeQuantity(button.dataset.id, 1);
      if (button.dataset.action === "minus") changeQuantity(button.dataset.id, -1);
    });
  });
}

function renderCheckout() {
  const container = document.querySelector("#checkout-items");
  if (!container) return;
  const cart = getCart();
  const subtotal = cartSubtotal(cart);
  const shipping = cart.length ? 12000 : 0;

  container.innerHTML = cart.length ? cart.map((item) => `
    <div class="checkout-item">
      <img src="${item.image}" alt="${item.name}">
      <div><h3>${item.name}</h3><p>Cantidad: ${item.quantity}</p></div>
      <strong>${formatPrice(item.price * item.quantity)}</strong>
    </div>`).join("") : '<p class="empty-checkout">Tu bolsa está vacía.</p>';

  const total = document.querySelector("#checkout-total");
  if (total) total.textContent = formatPrice(subtotal + shipping);
}

document.querySelectorAll(".filter-button").forEach((button) => {
  button.addEventListener("click", () => {
    const selectedCategory = button.dataset.filter;
    document.querySelectorAll(".filter-button").forEach((filter) => {
      filter.setAttribute("aria-pressed", String(filter === button));
    });
    document.querySelectorAll(".product-card").forEach((card) => {
      card.hidden = selectedCategory !== "todos" && card.dataset.category !== selectedCategory;
    });
  });
});

document.querySelectorAll(".add-button").forEach((button) => {
  button.addEventListener("click", () => addToCart(button));
});

renderCart();
renderCheckout();
updateCartCount();

const cardNumber = document.querySelector("#card-number");
if (cardNumber) {
  cardNumber.addEventListener("input", () => {
    cardNumber.value = cardNumber.value.replace(/\D/g, "").slice(0, 16).replace(/(.{4})/g, "$1 ").trim();
  });
}

const expiry = document.querySelector("#expiry");
if (expiry) {
  expiry.addEventListener("input", () => {
    const digits = expiry.value.replace(/\D/g, "").slice(0, 4);
    expiry.value = digits.length > 2 ? `${digits.slice(0, 2)}/${digits.slice(2)}` : digits;
  });
}

const paymentForm = document.querySelector("#payment-form");
if (paymentForm) {
  paymentForm.addEventListener("submit", (event) => {
    event.preventDefault();
    const message = document.querySelector("#payment-message");
    if (!getCart().length) {
      message.textContent = "Agrega un producto antes de confirmar tu pedido.";
      return;
    }
    message.textContent = "¡Pedido confirmado! InspirArte preparará tu compra.";
    saveCart([]);
    renderCheckout();
  });
}
