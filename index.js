document.addEventListener('DOMContentLoaded', () => {
    // ==========================================
    // MENÚ DEL DÍA (ACTUALIZAR DIARIAMENTE AQUÍ)
    // ==========================================
    const menuDelDia = {
        sopa: 'Sancocho',
        principios: [
            'Ensalada primaveral',
            'Lentejas caseras',
            'Frijoles caseros'
        ],
        acompanamientos: [
            'Moneditas de plátano verde',
            'Papa en salsa criolla',
            'Tajadas maduras'
        ]
    };

    // Render daily specials on the page dynamically
    function renderDailySpecialsMenu() {
        const soupDisplay = document.getElementById('daily-soup-display');
        const principlesDisplay = document.getElementById('daily-principles-display');
        const sidesDisplay = document.getElementById('daily-sides-display');

        if (soupDisplay) soupDisplay.textContent = menuDelDia.sopa;

        if (principlesDisplay) {
            principlesDisplay.innerHTML = menuDelDia.principios.map(p => `
                <li>
                    <i data-lucide="check" class="check-icon"></i>
                    <span>${p}</span>
                </li>
            `).join('');
        }

        if (sidesDisplay) {
            sidesDisplay.innerHTML = menuDelDia.acompanamientos.map(s => `
                <li>
                    <i data-lucide="check" class="check-icon"></i>
                    <span>${s}</span>
                </li>
            `).join('');
        }

        // Refresh icons so Lucide icons render correctly
        if (window.lucide && typeof window.lucide.createIcons === 'function') {
            window.lucide.createIcons();
        }
    }

    // Call dynamic rendering immediately
    renderDailySpecialsMenu();

    // Shopping Cart State: Array of objects with unique IDs
    let cart = [];
    const whatsappNumber = '573183821787'; // Target phone number for real testing

    // Elements
    const cartDrawer = document.getElementById('cart-drawer');
    const cartSummaryTrigger = document.getElementById('cart-summary-trigger');
    const cartDetailsPanel = document.getElementById('cart-details-panel');
    const cartItemsList = document.getElementById('cart-items-list');
    const cartCountEl = document.getElementById('cart-count');
    const cartTotalEl = document.getElementById('cart-total');
    const cartChevron = document.getElementById('cart-chevron');
    const clearCartBtn = document.getElementById('clear-cart-btn');
    const whatsappCheckoutBtn = document.getElementById('whatsapp-checkout-btn');
    
    // New Elements
    const serviceTypeSelect = document.getElementById('cart-service-type');
    const summarySubtotal = document.getElementById('summary-subtotal');
    const summaryEmpaque = document.getElementById('summary-empaque');
    const summaryTotal = document.getElementById('summary-total');
    const empaqueRow = document.getElementById('empaque-row');

    // Add item to cart event delegator or direct binding
    function bindAddButtons() {
        const addCartButtons = document.querySelectorAll('.btn-add-fast');
        addCartButtons.forEach(btn => {
            btn.removeEventListener('click', handleAddClick);
            btn.addEventListener('click', handleAddClick);
        });

        // Also bind the picadas add buttons which have .btn-add-cart
        const addPicadaButtons = document.querySelectorAll('.picada-action .btn-add-cart');
        addPicadaButtons.forEach(btn => {
            btn.removeEventListener('click', handleAddClick);
            btn.addEventListener('click', handleAddClick);
        });
    }

    function handleAddClick(e) {
        const btn = e.currentTarget;
        const name = btn.getAttribute('data-name');
        const price = parseInt(btn.getAttribute('data-price'), 10);
        addToCart(name, price);
    }

    // Toggle Cart panel
    cartSummaryTrigger.addEventListener('click', () => {
        cartDetailsPanel.classList.toggle('hidden');
        if (cartDetailsPanel.classList.contains('hidden')) {
            cartChevron.setAttribute('data-lucide', 'chevron-up');
        } else {
            cartChevron.setAttribute('data-lucide', 'chevron-down');
        }
        lucide.createIcons();
    });

    // Event listener for Service Type change
    if (serviceTypeSelect) {
        serviceTypeSelect.addEventListener('change', () => {
            updateCartUI();
        });
    }

    // Clear cart
    clearCartBtn.addEventListener('click', () => {
        cart = [];
        updateCartUI();
    });

    // Core Cart Functions
    function addToCart(name, price) {
        const id = Date.now() + Math.random().toString(36).substr(2, 9);
        const isPicada = name.toLowerCase().includes('picada');

        const newItem = {
            id: id,
            name: name,
            price: price,
            // Defaults for daily specials (only if not a picada)
            soup: isPicada ? null : menuDelDia.sopa,
            principle: isPicada ? null : menuDelDia.principios[0],
            side: isPicada ? null : menuDelDia.acompanamientos[0],
            salad: isPicada ? null : 'Con ensalada'
        };

        cart.push(newItem);
        showCartBannerFeedback();
        updateCartUI();
    }

    function removeFromCart(id) {
        cart = cart.filter(item => item.id !== id);
        updateCartUI();
    }

    function showCartBannerFeedback() {
        cartSummaryTrigger.style.background = 'rgba(39, 174, 96, 0.2)';
        setTimeout(() => {
            cartSummaryTrigger.style.background = 'rgba(211, 84, 0, 0.05)';
        }, 300);
    }

    function updateCartUI() {
        cartItemsList.innerHTML = '';
        
        if (cart.length === 0) {
            cartDrawer.classList.add('hidden');
            cartDetailsPanel.classList.add('hidden');
            cartChevron.setAttribute('data-lucide', 'chevron-up');
            lucide.createIcons();
            return;
        }

        // Show cart drawer if hidden
        cartDrawer.classList.remove('hidden');

        let subtotal = 0;

        cart.forEach(item => {
            subtotal += item.price;

            const isPicada = item.name.toLowerCase().includes('picada');
            const itemContainer = document.createElement('div');
            itemContainer.className = 'cart-item-container';
            itemContainer.setAttribute('data-id', item.id);

            // Row with name and delete button
            let itemHtml = `
                <div class="cart-item-row">
                    <div class="cart-item-info">
                        <span class="cart-item-name">${item.name}</span>
                        <span class="cart-item-meta">$${item.price.toLocaleString('es-CO')}</span>
                    </div>
                    <div class="cart-item-actions">
                        <button class="btn-remove-item" data-id="${item.id}">
                            <i data-lucide="trash-2" style="width: 16px; height: 16px;"></i>
                        </button>
                    </div>
                </div>
            `;

            // If not a picada, add selectors inside this specific card
            if (!isPicada) {
                const soupOptions = `
                    <option value="${menuDelDia.sopa}" ${item.soup === menuDelDia.sopa ? 'selected' : ''}>${menuDelDia.sopa}</option>
                    <option value="Sin Sopa" ${item.soup === 'Sin Sopa' ? 'selected' : ''}>Sin sopa</option>
                `;

                const principleOptions = menuDelDia.principios.map(p => `
                    <option value="${p}" ${item.principle === p ? 'selected' : ''}>${p}</option>
                `).join('') + `<option value="Sin Principio" ${item.principle === 'Sin Principio' ? 'selected' : ''}>Sin principio</option>`;

                const sideOptions = menuDelDia.acompanamientos.map(a => `
                    <option value="${a}" ${item.side === a ? 'selected' : ''}>${a}</option>
                `).join('') + `<option value="Sin Acompañamiento" ${item.side === 'Sin Acompañamiento' ? 'selected' : ''}>Sin acompañamiento</option>`;

                itemHtml += `
                    <div class="cart-item-customizer">
                        <div class="customizer-select-group">
                            <label>Sopa:</label>
                            <select class="item-select-soup" data-id="${item.id}">
                                ${soupOptions}
                            </select>
                        </div>
                        <div class="customizer-select-group">
                            <label>Principio:</label>
                            <select class="item-select-principle" data-id="${item.id}">
                                ${principleOptions}
                            </select>
                        </div>
                        <div class="customizer-select-group">
                            <label>Acompañamiento:</label>
                            <select class="item-select-side" data-id="${item.id}">
                                ${sideOptions}
                            </select>
                        </div>
                        <div class="customizer-select-group">
                            <label>Ensalada:</label>
                            <select class="item-select-salad" data-id="${item.id}">
                                <option value="Con ensalada" ${item.salad === 'Con ensalada' ? 'selected' : ''}>Con ensalada</option>
                                <option value="Sin ensalada" ${item.salad === 'Sin ensalada' ? 'selected' : ''}>Sin ensalada</option>
                            </select>
                        </div>
                    </div>
                `;
            }

            itemContainer.innerHTML = itemHtml;
            cartItemsList.appendChild(itemContainer);
        });

        // Calculate Packaging Fee (Empaque)
        const serviceType = serviceTypeSelect ? serviceTypeSelect.value : 'Mesa';
        // Add $1.000 empaque fee for ALL items if it is Domicilio or Mostrador
        const isToGo = (serviceType === 'Domicilio' || serviceType === 'Mostrador');
        const packagingFee = isToGo ? (cart.length * 1000) : 0;
        const total = subtotal + packagingFee;

        // Render pricing fields
        if (summarySubtotal) summarySubtotal.textContent = `$${subtotal.toLocaleString('es-CO')}`;
        if (summaryEmpaque) summaryEmpaque.textContent = `$${packagingFee.toLocaleString('es-CO')}`;
        if (summaryTotal) summaryTotal.textContent = `$${total.toLocaleString('es-CO')}`;

        if (packagingFee > 0) {
            empaqueRow.classList.remove('hidden');
        } else {
            empaqueRow.classList.add('hidden');
        }

        // Event listeners for Delete Buttons
        document.querySelectorAll('.btn-remove-item').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const id = btn.closest('.btn-remove-item').getAttribute('data-id');
                removeFromCart(id);
            });
        });

        // Event listeners for Dropdowns changes (saving choice in State)
        document.querySelectorAll('.item-select-soup').forEach(select => {
            select.addEventListener('change', (e) => {
                const id = e.target.getAttribute('data-id');
                const val = e.target.value;
                const item = cart.find(i => i.id === id);
                if (item) item.soup = val;
            });
        });

        document.querySelectorAll('.item-select-principle').forEach(select => {
            select.addEventListener('change', (e) => {
                const id = e.target.getAttribute('data-id');
                const val = e.target.value;
                const item = cart.find(i => i.id === id);
                if (item) item.principle = val;
            });
        });

        document.querySelectorAll('.item-select-side').forEach(select => {
            select.addEventListener('change', (e) => {
                const id = e.target.getAttribute('data-id');
                const val = e.target.value;
                const item = cart.find(i => i.id === id);
                if (item) item.side = val;
            });
        });

        document.querySelectorAll('.item-select-salad').forEach(select => {
            select.addEventListener('change', (e) => {
                const id = e.target.getAttribute('data-id');
                const val = e.target.value;
                const item = cart.find(i => i.id === id);
                if (item) item.salad = val;
            });
        });

        cartCountEl.textContent = `${cart.length} plato${cart.length > 1 ? 's' : ''}`;
        cartTotalEl.textContent = `$${total.toLocaleString('es-CO')}`;
        
        lucide.createIcons();
    }

    // Checkout via WhatsApp
    whatsappCheckoutBtn.addEventListener('click', () => {
        if (cart.length === 0) return;

        const serviceType = serviceTypeSelect ? serviceTypeSelect.value : 'Mesa';
        const isToGo = (serviceType === 'Domicilio' || serviceType === 'Mostrador');
        const packagingFee = isToGo ? (cart.length * 1000) : 0;
        let subtotal = 0;

        // Collect order details
        let orderText = '🔥 *NUEVO PEDIDO - RESTAURANTE SAN PARRILLA* 🔥\n\n';
        
        // Add service type
        let serviceEmoji = '🍽️';
        if (serviceType === 'Domicilio') serviceEmoji = '🛵';
        if (serviceType === 'Mostrador') serviceEmoji = '🛍️';
        orderText += `${serviceEmoji} *Tipo de Servicio:* ${serviceType}\n\n`;

        cart.forEach((item, index) => {
            orderText += `*${index + 1}. ${item.name}* ($${item.price.toLocaleString('es-CO')})\n`;
            subtotal += item.price;
            
            const isPicada = item.name.toLowerCase().includes('picada');
            if (!isPicada) {
                orderText += `   🥣 Sopa: ${item.soup || 'No elegida'}\n`;
                orderText += `   🍚 Principio: ${item.principle || 'No elegido'}\n`;
                orderText += `   🍟 Acompañante: ${item.side || 'No elegido'}\n`;
                orderText += `   🥗 Ensalada: ${item.salad || 'Con ensalada'}\n`;
            }
            orderText += '\n';
        });

        const total = subtotal + packagingFee;

        if (packagingFee > 0) {
            orderText += `📦 *Costo de Empaque:* $${packagingFee.toLocaleString('es-CO')} ($1.000 x ${cart.length} artículo${cart.length > 1 ? 's' : ''})\n`;
        }
        orderText += `💵 *TOTAL A PAGAR:* $${total.toLocaleString('es-CO')}\n\n`;
        orderText += '¡Muchas gracias! Espero mi confirmación del pedido por este medio.';

        // Encode message and open WhatsApp link
        const encodedMessage = encodeURIComponent(orderText);
        const url = `https://wa.me/${whatsappNumber}?text=${encodedMessage}`;

        window.open(url, '_blank');
    });

    // Initialize bindings
    bindAddButtons();
});
