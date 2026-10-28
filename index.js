document.addEventListener('DOMContentLoaded', () => {
    // ==========================================
    // MENÚ DEL DÍA (ACTUALIZAR DIARIAMENTE AQUÍ)
    // ==========================================
    const menuDelDia = {
        sopa: 'Plátano',
        principios: [
            'Verduras en crema de leche',
            'Espaguetis',
            'Fríjoles'
        ],
        acompanamientos: [
            'Chips de plátano verde',
            'Torta de zanahoria',
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
    const whatsappNumber = '573183821787';
    const PACKAGING_FEE = 1000;

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

    // Pricing Elements
    const serviceTypeSelect = document.getElementById('cart-service-type');
    const summarySubtotal = document.getElementById('summary-subtotal');
    const summaryEmpaque = document.getElementById('summary-empaque');
    const summaryTotal = document.getElementById('summary-total');
    const empaqueRow = document.getElementById('empaque-row');

    // Customer / Delivery / Payment Elements
    const nameInput = document.getElementById('cart-customer-name');
    const phoneInput = document.getElementById('cart-customer-phone');
    const tableInput = document.getElementById('cart-table-number');
    const addressInput = document.getElementById('cart-customer-address');
    const neighborhoodInput = document.getElementById('cart-customer-neighborhood');
    const cutlerySelect = document.getElementById('cart-cutlery');
    const paymentSelect = document.getElementById('cart-payment-method');
    const cashAmountInput = document.getElementById('cart-cash-amount');
    const fieldTable = document.getElementById('field-table');
    const fieldAddress = document.getElementById('field-address');
    const fieldNeighborhood = document.getElementById('field-neighborhood');
    const fieldCutlery = document.getElementById('field-cutlery');
    const fieldCashAmount = document.getElementById('field-cash-amount');
    const formErrorEl = document.getElementById('cart-form-error');

    const escapeHtml = (s) =>
        String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

    const refreshIcons = () => {
        if (window.lucide && typeof window.lucide.createIcons === 'function') {
            window.lucide.createIcons();
        }
    };

    // ==========================================
    // REGLAS DE PERSONALIZACIÓN POR PLATO
    // ==========================================
    function getDisallowedOptions(name) {
        const lower = name.toLowerCase();

        // Parrilla mixta has no principle and no side
        if (lower.includes('parrilla mixta')) {
            return {
                soup: true,
                principle: false,
                side: false,
                salad: false
            };
        }

        // Bandeja paisa, Combo Personal or fish/seafood dishes have ALL options disallowed
        const isStructured = lower.includes('bandeja paisa') ||
                             lower.includes('combo personal') ||
                             lower.includes('bagre') ||
                             lower.includes('robalo') ||
                             lower.includes('róbalo') ||
                             lower.includes('mojarra') ||
                             lower.includes('cazuela') ||
                             lower.includes('mariscos') ||
                             lower.includes('pescado');

        if (isStructured) {
            return {
                soup: false,
                principle: false,
                side: false,
                salad: false
            };
        }

        // 18k dishes: arroz con pollo, arroz campesino, arroz mixto, arroz paisa, arroz ranchero, espagueti con pollo, espagueti boloñesa, creps de pollo
        // Only soup and side allowed (no principle, no salad)
        const is18kSpecial = lower.includes('arroz con pollo') ||
                              lower.includes('arroz campesino') ||
                              lower.includes('arroz mixto') ||
                              lower.includes('arroz paisa') ||
                              lower.includes('arroz ranchero') ||
                              lower.includes('espagueti con pollo') ||
                              lower.includes('espaguetis con pollo') ||
                              lower.includes('espagueti boloñesa') ||
                              lower.includes('espaguetis boloñesa') ||
                              lower.includes('creps de pollo') ||
                              lower.includes('crep de pollo');

        if (is18kSpecial) {
            return {
                soup: true,
                principle: false,
                side: true,
                salad: false
            };
        }

        // Default: all options allowed
        return {
            soup: true,
            principle: true,
            side: true,
            salad: true
        };
    }

    // ==========================================
    // MEMORIA DEL CLIENTE (localStorage)
    // ==========================================
    const CUSTOMER_STORAGE_KEY = 'sanParrillaCustomer';
    const customerInputs = {
        name: nameInput,
        phone: phoneInput,
        address: addressInput,
        neighborhood: neighborhoodInput
    };

    function loadSavedCustomer() {
        try {
            const saved = JSON.parse(localStorage.getItem(CUSTOMER_STORAGE_KEY) || '{}');
            const fallbackLegacy = {
                name: localStorage.getItem('san_parrilla_name') || '',
                phone: localStorage.getItem('san_parrilla_phone') || '',
                address: localStorage.getItem('san_parrilla_address') || '',
                neighborhood: ''
            };
            Object.keys(customerInputs).forEach(key => {
                const input = customerInputs[key];
                const val = (typeof saved[key] === 'string' && saved[key]) ? saved[key] : fallbackLegacy[key];
                if (input && !input.value && val) {
                    input.value = val;
                }
            });
        } catch (err) {
            // localStorage unavailable or corrupted: ignore silently
        }
    }

    function saveCustomer() {
        try {
            const data = {};
            Object.keys(customerInputs).forEach(key => {
                const input = customerInputs[key];
                data[key] = input ? input.value.trim() : '';
            });
            localStorage.setItem(CUSTOMER_STORAGE_KEY, JSON.stringify(data));
        } catch (err) {
            // localStorage unavailable: ignore silently
        }
    }

    Object.keys(customerInputs).forEach(key => {
        const input = customerInputs[key];
        if (input) {
            input.addEventListener('input', saveCustomer);
            input.addEventListener('change', saveCustomer);
        }
    });

    // ==========================================
    // MEMORIA DEL PEDIDO EN CURSO (localStorage)
    // ==========================================
    const CART_STATE_KEY = 'sanParrillaCart';
    const CART_STATE_TTL_MS = 6 * 60 * 60 * 1000; // 6 horas

    function saveCartState() {
        try {
            if (cart.length === 0) {
                localStorage.removeItem(CART_STATE_KEY);
                return;
            }
            localStorage.setItem(
                CART_STATE_KEY,
                JSON.stringify({
                    savedAt: Date.now(),
                    cart,
                    service: serviceTypeSelect ? serviceTypeSelect.value : 'Mesa',
                    payment: paymentSelect ? paymentSelect.value : 'Efectivo',
                    table: tableInput ? tableInput.value : '',
                    cutlery: cutlerySelect ? cutlerySelect.value : 'No',
                    cash: cashAmountInput ? cashAmountInput.value : ''
                })
            );
        } catch (err) {
            // localStorage unavailable
        }
    }

    function sanitizeItem(raw) {
        if (!raw || typeof raw.name !== 'string' || !Number.isFinite(raw.price)) return null;
        const isPicada = raw.name.toLowerCase().includes('picada');
        const isCombo = raw.name.toLowerCase().includes('combo personal');
        const disallowed = getDisallowedOptions(raw.name);

        const soups = [menuDelDia.sopa, 'Sin Sopa'];
        const principles = [...menuDelDia.principios, 'Sin Principio'];
        const sides = [...menuDelDia.acompanamientos, 'Sin Acompañamiento'];
        const salads = ['Con ensalada', 'Sin ensalada'];
        const proteins = ['Milanesa de pollo', 'Lomo de cerdo a la plancha'];
        const beverages = ['Agua en botella', 'Gaseosa personal'];

        return {
            id: typeof raw.id === 'string' ? raw.id : `${Date.now()}${Math.random().toString(36).slice(2, 9)}`,
            name: raw.name,
            price: raw.price,
            soup: (!isPicada && disallowed.soup) ? (soups.includes(raw.soup) ? raw.soup : menuDelDia.sopa) : null,
            principle: (!isPicada && disallowed.principle) ? (principles.includes(raw.principle) ? raw.principle : menuDelDia.principios[0]) : null,
            side: (!isPicada && disallowed.side) ? (sides.includes(raw.side) ? raw.side : menuDelDia.acompanamientos[0]) : null,
            salad: (!isPicada && disallowed.salad) ? (salads.includes(raw.salad) ? raw.salad : 'Con ensalada') : null,
            protein: isCombo ? (proteins.includes(raw.protein) ? raw.protein : 'Milanesa de pollo') : null,
            beverage: isCombo ? (beverages.includes(raw.beverage) ? raw.beverage : 'Agua en botella') : null
        };
    }

    function restoreCartState() {
        try {
            const saved = JSON.parse(localStorage.getItem(CART_STATE_KEY) || 'null');
            if (!saved || !Array.isArray(saved.cart) || Date.now() - saved.savedAt > CART_STATE_TTL_MS) {
                localStorage.removeItem(CART_STATE_KEY);
                return;
            }
            cart = saved.cart.map(sanitizeItem).filter(Boolean);

            const setIfValid = (select, value) => {
                if (select && typeof value === 'string' && [...select.options].some(o => o.value === value)) {
                    select.value = value;
                }
            };
            setIfValid(serviceTypeSelect, saved.service);
            setIfValid(paymentSelect, saved.payment);
            setIfValid(cutlerySelect, saved.cutlery);
            if (tableInput && typeof saved.table === 'string') tableInput.value = saved.table;
            if (cashAmountInput && typeof saved.cash === 'string') cashAmountInput.value = saved.cash;
        } catch (err) {
            cart = [];
        }
    }

    // ==========================================
    // CAMPOS DINÁMICOS Y VALIDACIÓN
    // ==========================================
    function updateOrderFields() {
        const serviceType = serviceTypeSelect ? serviceTypeSelect.value : 'Mesa';
        const isDelivery = serviceType === 'Domicilio';
        const isTable = serviceType === 'Mesa';
        const isCash = paymentSelect && paymentSelect.value === 'Efectivo';

        if (fieldTable) fieldTable.classList.toggle('hidden', !isTable);
        if (fieldAddress) fieldAddress.classList.toggle('hidden', !isDelivery);
        if (fieldNeighborhood) fieldNeighborhood.classList.toggle('hidden', !isDelivery);
        if (fieldCutlery) fieldCutlery.classList.toggle('hidden', !isDelivery);
        if (fieldCashAmount) fieldCashAmount.classList.toggle('hidden', !(isDelivery && isCash));
        hideFormError();
    }

    function showFormError(message, field) {
        if (!formErrorEl) return;
        formErrorEl.textContent = message;
        formErrorEl.classList.remove('hidden');
        if (field) {
            field.classList.add('is-invalid');
            field.focus();
        }
    }

    function hideFormError() {
        if (!formErrorEl) return;
        formErrorEl.classList.add('hidden');
        formErrorEl.textContent = '';
        document.querySelectorAll('.cart-field input.is-invalid').forEach(el => el.classList.remove('is-invalid'));
    }

    // ==========================================
    // FUNCIONES DEL CARRITO
    // ==========================================
    function bindAddButtons() {
        const addCartButtons = document.querySelectorAll('.btn-add-fast, .picada-action .btn-add-cart');
        addCartButtons.forEach(btn => {
            btn.removeEventListener('click', handleAddClick);
            btn.addEventListener('click', handleAddClick);
        });
    }

    function handleAddClick(e) {
        const btn = e.currentTarget;
        if (btn.disabled || btn.classList.contains('disabled')) return;
        const name = btn.getAttribute('data-name');
        const price = parseInt(btn.getAttribute('data-price'), 10);
        if (!name || Number.isNaN(price)) return;
        addToCart(name, price);
    }

    function addToCart(name, price) {
        const id = `${Date.now()}${Math.random().toString(36).slice(2, 9)}`;
        const isPicada = name.toLowerCase().includes('picada');
        const isCombo = name.toLowerCase().includes('combo personal');
        const disallowed = getDisallowedOptions(name);

        const newItem = {
            id: id,
            name: name,
            price: price,
            soup: (!isPicada && disallowed.soup) ? menuDelDia.sopa : null,
            principle: (!isPicada && disallowed.principle) ? menuDelDia.principios[0] : null,
            side: (!isPicada && disallowed.side) ? menuDelDia.acompanamientos[0] : null,
            salad: (!isPicada && disallowed.salad) ? 'Con ensalada' : null,
            protein: isCombo ? 'Milanesa de pollo' : null,
            beverage: isCombo ? 'Agua en botella' : null
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
        if (!cartSummaryTrigger) return;
        cartSummaryTrigger.classList.add('flash-added');
        setTimeout(() => {
            cartSummaryTrigger.classList.remove('flash-added');
        }, 300);
    }

    function updateCartUI() {
        cartItemsList.innerHTML = '';

        if (cart.length === 0) {
            cartDrawer.classList.add('hidden');
            cartDetailsPanel.classList.add('hidden');
            cartSummaryTrigger.setAttribute('aria-expanded', 'false');
            cartChevron.setAttribute('data-lucide', 'chevron-up');
            document.body.classList.remove('cart-has-items');
            saveCartState();
            refreshIcons();
            return;
        }

        // Show cart drawer if hidden
        cartDrawer.classList.remove('hidden');
        document.body.classList.add('cart-has-items');

        let subtotal = 0;

        cart.forEach(item => {
            subtotal += item.price;

            const isPicada = item.name.toLowerCase().includes('picada');
            const isCombo = item.name.toLowerCase().includes('combo personal');
            const itemContainer = document.createElement('div');
            itemContainer.className = 'cart-item-container';
            itemContainer.setAttribute('data-id', item.id);

            let itemHtml = `
                <div class="cart-item-row">
                    <div class="cart-item-info">
                        <span class="cart-item-name">${escapeHtml(item.name)}</span>
                        <span class="cart-item-meta">$${item.price.toLocaleString('es-CO')}</span>
                    </div>
                    <div class="cart-item-actions">
                        <button type="button" class="btn-remove-item" data-id="${item.id}" aria-label="Quitar ${escapeHtml(item.name)}">
                            <i data-lucide="trash-2" style="width: 16px; height: 16px;"></i>
                        </button>
                    </div>
                </div>
            `;

            if (!isPicada && (item.soup || item.principle || item.side || item.salad)) {
                itemHtml += `<div class="cart-item-customizer">`;

                if (item.soup) {
                    const soupOptions = `
                        <option value="${escapeHtml(menuDelDia.sopa)}" ${item.soup === menuDelDia.sopa ? 'selected' : ''}>${escapeHtml(menuDelDia.sopa)}</option>
                        <option value="Sin Sopa" ${item.soup === 'Sin Sopa' ? 'selected' : ''}>Sin sopa</option>
                    `;
                    itemHtml += `
                        <div class="customizer-select-group">
                            <label>Sopa</label>
                            <select class="item-select-soup" data-id="${item.id}">
                                ${soupOptions}
                            </select>
                        </div>
                    `;
                }

                if (item.principle) {
                    const principleOptions = menuDelDia.principios.map(p => `
                        <option value="${escapeHtml(p)}" ${item.principle === p ? 'selected' : ''}>${escapeHtml(p)}</option>
                    `).join('') + `<option value="Sin Principio" ${item.principle === 'Sin Principio' ? 'selected' : ''}>Sin principio</option>`;
                    itemHtml += `
                        <div class="customizer-select-group">
                            <label>Principio</label>
                            <select class="item-select-principle" data-id="${item.id}">
                                ${principleOptions}
                            </select>
                        </div>
                    `;
                }

                if (item.side) {
                    const sideOptions = menuDelDia.acompanamientos.map(a => `
                        <option value="${escapeHtml(a)}" ${item.side === a ? 'selected' : ''}>${escapeHtml(a)}</option>
                    `).join('') + `<option value="Sin Acompañamiento" ${item.side === 'Sin Acompañamiento' ? 'selected' : ''}>Sin acompañamiento</option>`;
                    itemHtml += `
                        <div class="customizer-select-group">
                            <label>Acompañamiento</label>
                            <select class="item-select-side" data-id="${item.id}">
                                ${sideOptions}
                            </select>
                        </div>
                    `;
                }

                if (item.salad) {
                    itemHtml += `
                        <div class="customizer-select-group">
                            <label>Ensalada</label>
                            <select class="item-select-salad" data-id="${item.id}">
                                <option value="Con ensalada" ${item.salad === 'Con ensalada' ? 'selected' : ''}>Con ensalada</option>
                                <option value="Sin ensalada" ${item.salad === 'Sin ensalada' ? 'selected' : ''}>Sin ensalada</option>
                            </select>
                        </div>
                    `;
                }

                itemHtml += `</div>`;
            }

            if (isCombo) {
                const proteinOptions = `
                    <option value="Milanesa de pollo" ${item.protein === 'Milanesa de pollo' ? 'selected' : ''}>Milanesa de pollo</option>
                    <option value="Lomo de cerdo a la plancha" ${item.protein === 'Lomo de cerdo a la plancha' ? 'selected' : ''}>Lomo de cerdo a la plancha</option>
                `;
                const beverageOptions = `
                    <option value="Agua en botella" ${item.beverage === 'Agua en botella' ? 'selected' : ''}>Agua en botella</option>
                    <option value="Gaseosa personal" ${item.beverage === 'Gaseosa personal' ? 'selected' : ''}>Gaseosa personal</option>
                `;

                itemHtml += `
                    <div class="cart-item-customizer">
                        <div class="customizer-select-group">
                            <label>Proteína</label>
                            <select class="item-select-protein" data-id="${item.id}">
                                ${proteinOptions}
                            </select>
                        </div>
                        <div class="customizer-select-group">
                            <label>Bebida</label>
                            <select class="item-select-beverage" data-id="${item.id}">
                                ${beverageOptions}
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
        const isToGo = (serviceType === 'Domicilio' || serviceType === 'Recoger');
        const packagingFee = isToGo ? (cart.length * PACKAGING_FEE) : 0;
        const total = subtotal + packagingFee;

        // Render pricing fields
        if (summarySubtotal) summarySubtotal.textContent = `$${subtotal.toLocaleString('es-CO')}`;
        if (summaryEmpaque) summaryEmpaque.textContent = `$${packagingFee.toLocaleString('es-CO')}`;
        if (summaryTotal) summaryTotal.textContent = `$${total.toLocaleString('es-CO')}`;

        if (empaqueRow) {
            empaqueRow.classList.toggle('hidden', packagingFee === 0);
        }

        // Event listeners for Delete Buttons
        document.querySelectorAll('.btn-remove-item').forEach(btn => {
            btn.addEventListener('click', () => {
                const id = btn.getAttribute('data-id');
                removeFromCart(id);
            });
        });

        // Event listeners for Dropdowns changes (saving choice in State)
        const bindSelect = (selector, field) => {
            document.querySelectorAll(selector).forEach(select => {
                select.addEventListener('change', (e) => {
                    const id = e.target.getAttribute('data-id');
                    const item = cart.find(i => i.id === id);
                    if (item) {
                        item[field] = e.target.value;
                        saveCartState();
                    }
                });
            });
        };

        bindSelect('.item-select-soup', 'soup');
        bindSelect('.item-select-principle', 'principle');
        bindSelect('.item-select-side', 'side');
        bindSelect('.item-select-salad', 'salad');
        bindSelect('.item-select-protein', 'protein');
        bindSelect('.item-select-beverage', 'beverage');

        cartCountEl.textContent = `${cart.length} plato${cart.length > 1 ? 's' : ''}`;
        cartTotalEl.textContent = `$${total.toLocaleString('es-CO')}`;

        saveCartState();
        refreshIcons();
    }

    // ==========================================
    // EVENTOS DE INTERFAZ Y CHECKOUT WHATSAPP
    // ==========================================
    cartSummaryTrigger.addEventListener('click', () => {
        cartDetailsPanel.classList.toggle('hidden');
        const isOpen = !cartDetailsPanel.classList.contains('hidden');
        cartSummaryTrigger.setAttribute('aria-expanded', String(isOpen));
        cartChevron.setAttribute('data-lucide', isOpen ? 'chevron-down' : 'chevron-up');
        if (isOpen) loadSavedCustomer();
        refreshIcons();
    });

    if (serviceTypeSelect) {
        serviceTypeSelect.addEventListener('change', () => {
            updateOrderFields();
            updateCartUI();
        });
    }

    if (paymentSelect) {
        paymentSelect.addEventListener('change', () => {
            updateOrderFields();
            saveCartState();
        });
    }

    if (cartDrawer) {
        cartDrawer.addEventListener('input', saveCartState);
        cartDrawer.addEventListener('change', saveCartState);
    }

    [tableInput, cashAmountInput, nameInput, phoneInput, addressInput, neighborhoodInput].forEach(input => {
        if (input) input.addEventListener('input', hideFormError);
    });

    clearCartBtn.addEventListener('click', () => {
        cart = [];
        updateCartUI();
    });

    // Checkout via WhatsApp
    whatsappCheckoutBtn.addEventListener('click', () => {
        if (cart.length === 0) return;

        const formatMoney = (n) => `$${n.toLocaleString('es-CO')}`;
        const serviceType = serviceTypeSelect ? serviceTypeSelect.value : 'Mesa';
        const isDelivery = serviceType === 'Domicilio';
        const isTable = serviceType === 'Mesa';
        const isToGo = (isDelivery || serviceType === 'Recoger');
        const packagingFee = isToGo ? (cart.length * PACKAGING_FEE) : 0;
        const itemsSubtotal = cart.reduce((sum, item) => sum + item.price, 0);
        const total = itemsSubtotal + packagingFee;
        const paymentMethod = paymentSelect ? paymentSelect.value : 'Efectivo';
        const isCash = paymentMethod === 'Efectivo';

        // Collect and validate customer data
        hideFormError();
        const customerName = nameInput ? nameInput.value.trim() : '';
        const customerPhone = phoneInput ? phoneInput.value.trim() : '';
        const tableNumber = tableInput ? tableInput.value.trim() : '';
        const address = addressInput ? addressInput.value.trim() : '';
        const neighborhood = neighborhoodInput ? neighborhoodInput.value.trim() : '';
        const cashDigits = cashAmountInput ? cashAmountInput.value.replace(/\D/g, '') : '';
        const cashAmount = cashDigits ? parseInt(cashDigits, 10) : 0;

        if (!customerName) return showFormError('Por favor escribe tu nombre.', nameInput);
        if (!customerPhone) return showFormError('Por favor escribe tu teléfono.', phoneInput);
        if (isTable && !tableNumber) return showFormError('Indica el número de tu mesa.', tableInput);
        if (isDelivery && !address) return showFormError('Escribe la dirección completa de entrega.', addressInput);
        if (isDelivery && !neighborhood) return showFormError('Escribe tu barrio o indicaciones de entrega.', neighborhoodInput);
        if (isDelivery && isCash && cashAmount > 0 && cashAmount < total) {
            return showFormError(`El monto con el que pagas debe ser mayor o igual al total (${formatMoney(total)}).`, cashAmountInput);
        }

        // Save customer data in localStorage
        saveCustomer();

        // Build WhatsApp message
        let orderText = '🛒 *NUEVO PEDIDO - SAN PARRILLA*\n\n';
        orderText += `👤 *Nombre:* ${customerName}\n`;
        orderText += `📞 *Teléfono:* ${customerPhone}\n`;

        let serviceEmoji = '🍽️';
        if (isDelivery) serviceEmoji = '🛵';
        if (serviceType === 'Recoger') serviceEmoji = '🛍️';
        orderText += `${serviceEmoji} *Tipo de Servicio:* ${serviceType}\n`;

        if (isTable) {
            orderText += `🪑 *Mesa:* ${tableNumber}\n`;
        }
        if (isDelivery) {
            orderText += `📍 *Dirección:* ${address}\n`;
            orderText += `🏘️ *Barrio / Indicaciones:* ${neighborhood}\n`;
            orderText += `🍴 *Cubiertos plásticos:* ${cutlerySelect ? cutlerySelect.value : 'No'}\n`;
        }

        // Payment
        orderText += `\n💳 *Método de pago:* ${paymentMethod}\n`;
        if (isDelivery && isCash && cashAmount > 0) {
            orderText += `💵 *Paga con:* ${formatMoney(cashAmount)} (cambio: ${formatMoney(cashAmount - total)})\n`;
        }

        // Items
        orderText += '\n📋 *PEDIDO*\n\n';
        cart.forEach((item, index) => {
            orderText += `*${index + 1}. ${item.name}* (${formatMoney(item.price)})\n`;

            const isPicada = item.name.toLowerCase().includes('picada');
            if (!isPicada) {
                if (item.soup) orderText += `   🥣 Sopa: ${item.soup}\n`;
                if (item.principle) orderText += `   🍚 Principio: ${item.principle}\n`;
                if (item.side) orderText += `   🍟 Acompañante: ${item.side}\n`;
                if (item.salad) orderText += `   🥗 Ensalada: ${item.salad}\n`;
            }

            const isCombo = item.name.toLowerCase().includes('combo personal');
            if (isCombo) {
                if (item.protein) orderText += `   🍗 Proteína: ${item.protein}\n`;
                if (item.beverage) orderText += `   🥤 Bebida: ${item.beverage}\n`;
            }
            orderText += '\n';
        });

        // Totals
        orderText += `🧾 *Subtotal:* ${formatMoney(itemsSubtotal)}\n`;
        if (packagingFee > 0) {
            orderText += `📦 *Costo de Empaque:* ${formatMoney(packagingFee)} ($1.000 x ${cart.length} artículo${cart.length > 1 ? 's' : ''})\n`;
        }
        orderText += `💰 *TOTAL A PAGAR:* ${formatMoney(total)}\n\n`;
        orderText += '¡Muchas gracias! Espero mi confirmación del pedido por este medio.';

        const encodedMessage = encodeURIComponent(orderText);
        const url = `https://wa.me/${whatsappNumber}?text=${encodedMessage}`;

        window.open(url, '_blank');
    });

    // Initialize state and bindings
    loadSavedCustomer();
    restoreCartState();
    updateOrderFields();
    updateCartUI();
    bindAddButtons();
});
