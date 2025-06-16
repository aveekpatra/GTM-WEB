// Shopping Cart functionality
let cart = JSON.parse(localStorage.getItem("shoppingCart")) || [];
let cartCount = 0;

// Initialize page
document.addEventListener("DOMContentLoaded", function () {
  updateCartCount();
  initializeEventListeners();

  // GTM Page View tracking
  dataLayer = window.dataLayer || [];
  dataLayer.push({
    event: "page_view",
    page_title: document.title,
    page_location: window.location.href,
  });
});

// Update cart count display
function updateCartCount() {
  cartCount = cart.reduce((total, item) => total + item.quantity, 0);
  const cartCountElement = document.getElementById("cart-count");
  if (cartCountElement) {
    cartCountElement.textContent = cartCount;
  }
}

// Add to cart functionality
function addToCart(productId, productName, productPrice) {
  const existingItem = cart.find((item) => item.id === productId);

  if (existingItem) {
    existingItem.quantity += 1;
  } else {
    cart.push({
      id: productId,
      name: productName,
      price: parseFloat(productPrice),
      quantity: 1,
    });
  }

  localStorage.setItem("shoppingCart", JSON.stringify(cart));
  updateCartCount();

  // GTM Add to Cart tracking
  dataLayer.push({
    event: "add_to_cart",
    currency: "USD",
    value: parseFloat(productPrice),
    items: [
      {
        item_id: productId,
        item_name: productName,
        price: parseFloat(productPrice),
        quantity: 1,
      },
    ],
  });

  showMessage("Product added to cart!", "success");
}

// Remove from cart
function removeFromCart(productId) {
  const itemIndex = cart.findIndex((item) => item.id === productId);
  if (itemIndex > -1) {
    const removedItem = cart[itemIndex];
    cart.splice(itemIndex, 1);
    localStorage.setItem("shoppingCart", JSON.stringify(cart));
    updateCartCount();

    // GTM Remove from Cart tracking
    dataLayer.push({
      event: "remove_from_cart",
      currency: "USD",
      value: removedItem.price * removedItem.quantity,
      items: [
        {
          item_id: removedItem.id,
          item_name: removedItem.name,
          price: removedItem.price,
          quantity: removedItem.quantity,
        },
      ],
    });

    renderCart();
  }
}

// Initialize event listeners
function initializeEventListeners() {
  // Add to cart buttons
  document.querySelectorAll(".add-to-cart-btn").forEach((button) => {
    button.addEventListener("click", function () {
      const productCard = this.closest(".product-card");
      const productId = productCard.dataset.productId;
      const productName = productCard.dataset.productName;
      const productPrice = productCard.dataset.productPrice;

      addToCart(productId, productName, productPrice);
    });
  });

  // Newsletter form
  const newsletterForm = document.querySelector(".newsletter-form");
  if (newsletterForm) {
    newsletterForm.addEventListener("submit", function (e) {
      e.preventDefault();
      const email = this.querySelector('input[type="email"]').value;

      // GTM Newsletter signup tracking
      dataLayer.push({
        event: "newsletter_signup",
        user_email: email,
      });

      showMessage("Thank you for subscribing to our newsletter!", "success");
      this.reset();
    });
  }

  // Contact form
  const contactForm = document.querySelector(".contact-form");
  if (contactForm) {
    contactForm.addEventListener("submit", function (e) {
      e.preventDefault();

      // GTM Contact form submission tracking
      dataLayer.push({
        event: "contact_form_submit",
        form_name: "contact",
      });

      showMessage(
        "Thank you for your message! We'll get back to you soon.",
        "success"
      );
      this.reset();
    });
  }

  // CTA button clicks
  document.querySelectorAll("[data-gtm-event]").forEach((element) => {
    element.addEventListener("click", function () {
      const event = this.dataset.gtmEvent;
      const location = this.dataset.gtmLocation || "";

      dataLayer.push({
        event: event,
        click_location: location,
        click_text: this.textContent.trim(),
      });
    });
  });

  // Product filter buttons
  document.querySelectorAll(".filter-btn").forEach((button) => {
    button.addEventListener("click", function () {
      document
        .querySelectorAll(".filter-btn")
        .forEach((btn) => btn.classList.remove("active"));
      this.classList.add("active");

      const category = this.dataset.category;
      filterProducts(category);

      // GTM Filter tracking
      dataLayer.push({
        event: "product_filter",
        filter_category: category,
      });
    });
  });

  // Checkout button
  const checkoutBtn = document.querySelector(".checkout-btn");
  if (checkoutBtn) {
    checkoutBtn.addEventListener("click", function () {
      if (cart.length === 0) {
        showMessage("Your cart is empty!", "error");
        return;
      }

      const totalValue = cart.reduce(
        (total, item) => total + item.price * item.quantity,
        0
      );

      // GTM Begin Checkout tracking
      dataLayer.push({
        event: "begin_checkout",
        currency: "USD",
        value: totalValue,
        items: cart.map((item) => ({
          item_id: item.id,
          item_name: item.name,
          price: item.price,
          quantity: item.quantity,
        })),
      });

      showMessage("Redirecting to checkout...", "success");
      // Simulate checkout redirect
      setTimeout(() => {
        showMessage("Thank you for your purchase! (This is a demo)", "success");

        // GTM Purchase tracking
        dataLayer.push({
          event: "purchase",
          transaction_id: "TXN-" + Date.now(),
          currency: "USD",
          value: totalValue,
          items: cart.map((item) => ({
            item_id: item.id,
            item_name: item.name,
            price: item.price,
            quantity: item.quantity,
          })),
        });

        // Clear cart after purchase
        cart = [];
        localStorage.setItem("shoppingCart", JSON.stringify(cart));
        updateCartCount();
        renderCart();
      }, 2000);
    });
  }
}

// Show message function
function showMessage(message, type) {
  const messageDiv = document.createElement("div");
  messageDiv.className = `message ${type}`;
  messageDiv.textContent = message;

  document.body.appendChild(messageDiv);

  setTimeout(() => {
    messageDiv.remove();
  }, 3000);
}

// Filter products function
function filterProducts(category) {
  const products = document.querySelectorAll(".product-card");

  products.forEach((product) => {
    if (category === "all" || product.dataset.category === category) {
      product.style.display = "block";
      product.classList.add("fade-in");
    } else {
      product.style.display = "none";
    }
  });
}

// Render cart page
function renderCart() {
  const cartContainer = document.querySelector(".cart-items");
  const cartTotal = document.querySelector(".cart-total-amount");

  if (!cartContainer) return;

  if (cart.length === 0) {
    cartContainer.innerHTML = "<p>Your cart is empty.</p>";
    if (cartTotal) cartTotal.textContent = "$0.00";
    return;
  }

  let cartHTML = "";
  let total = 0;

  cart.forEach((item) => {
    const itemTotal = item.price * item.quantity;
    total += itemTotal;

    cartHTML += `
            <div class="cart-item">
                <div class="item-info">
                    <h4>${item.name}</h4>
                    <p>Price: $${item.price.toFixed(2)}</p>
                    <p>Quantity: ${item.quantity}</p>
                </div>
                <div class="item-total">
                    <p>$${itemTotal.toFixed(2)}</p>
                    <button onclick="removeFromCart('${
                      item.id
                    }')" class="remove-btn">Remove</button>
                </div>
            </div>
        `;
  });

  cartContainer.innerHTML = cartHTML;
  if (cartTotal) cartTotal.textContent = `$${total.toFixed(2)}`;
}

// Search functionality
function initializeSearch() {
  const searchInput = document.querySelector(".search-input");
  if (searchInput) {
    searchInput.addEventListener("input", function () {
      const query = this.value.toLowerCase();
      const products = document.querySelectorAll(".product-card");

      products.forEach((product) => {
        const productName = product.dataset.productName.toLowerCase();
        if (productName.includes(query)) {
          product.style.display = "block";
        } else {
          product.style.display = "none";
        }
      });

      // GTM Search tracking
      if (query.length > 2) {
        dataLayer.push({
          event: "search",
          search_term: query,
        });
      }
    });
  }
}

// Initialize search on page load
document.addEventListener("DOMContentLoaded", initializeSearch);

// Scroll tracking for GTM
let scrollTracked = false;
window.addEventListener("scroll", function () {
  if (!scrollTracked && window.scrollY > document.body.scrollHeight * 0.25) {
    dataLayer.push({
      event: "scroll_depth",
      scroll_depth: "25%",
    });
    scrollTracked = true;
  }
});

// Page timing tracking
window.addEventListener("load", function () {
  const loadTime =
    window.performance.timing.loadEventEnd -
    window.performance.timing.navigationStart;

  dataLayer.push({
    event: "page_timing",
    page_load_time: loadTime,
    page_url: window.location.href,
  });
});
