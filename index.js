document.addEventListener('DOMContentLoaded', () => {
    // ==========================================
    // MENÚ DEL DÍA (ACTUALIZAR DIARIAMENTE AQUÍ)
    // ==========================================
    const menuDelDia = {
        sopa: 'Sancocho',
        principios: [
            'Ensalada semirrusa',
            'Frijoles',
            'Espaguetis'
        ],
        acompanamientos: [
            'Torta de mazorca',
            'Puré de papa',
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

    // Domicilio Fields
    const phoneInput = document.getElementById('cart-phone');
    const addressInput = document.getElementById('cart-address');
    const domicilioContainer = document.getElementById('domicilio-fields-container');

    // Restore and save delivery data to localStorage
    if (phoneInput) {
        phoneInput.value = localStorage.getItem('san_parrilla_phone') || '';
        phoneInput.addEventListener('input', (e) => {
            localStorage.setItem('san_parrilla_phone', e.target.value);
        });
    }
    if (addressInput) {
        addressInput.value = localStorage.getItem('san_parrilla_address') || '';
        addressInput.addEventListener('input', (e) => {
            localStorage.setItem('san_parrilla_address', e.target.value);
        });
    }

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
    function getDisallowedOptions(name) {
        const lower = name.toLowerCase();
        
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
        
        // 18k dishes: arroz con pollo, arroz campesino, espagueti con pollo, espagueti boloñesa, creps de pollo
        // Only soup and side allowed (no principle, no salad)
        const is18kSpecial = lower.includes('arroz con pollo') || 
                             lower.includes('arroz campesino') || 
                             lower.includes('espagueti con pollo') || 
                             lower.includes('espagueti boloñesa') || 
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

    function addToCart(name, price) {
        const id = Date.now() + Math.random().toString(36).substr(2, 9);
        const isPicada = name.toLowerCase().includes('picada');
        const isCombo = name.toLowerCase().includes('combo personal');
        const disallowed = getDisallowedOptions(name);

        const newItem = {
            id: id,
            name: name,
            price: price,
            // Defaults for daily specials (only if not a picada and option is allowed)
            soup: (!isPicada && disallowed.soup) ? menuDelDia.sopa : null,
            principle: (!isPicada && disallowed.principle) ? menuDelDia.principios[0] : null,
            side: (!isPicada && disallowed.side) ? menuDelDia.acompanamientos[0] : null,
            salad: (!isPicada && disallowed.salad) ? 'Con ensalada' : null,
            // Custom options for Combo Personal
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
            if (!isPicada && (item.soup || item.principle || item.side || item.salad)) {
                itemHtml += `
                    <div class="cart-item-customizer">
                `;

                if (item.soup) {
                    const soupOptions = `
                        <option value="${menuDelDia.sopa}" ${item.soup === menuDelDia.sopa ? 'selected' : ''}>${menuDelDia.sopa}</option>
                        <option value="Sin Sopa" ${item.soup === 'Sin Sopa' ? 'selected' : ''}>Sin sopa</option>
                    `;
                    itemHtml += `
                        <div class="customizer-select-group">
                            <label>Sopa:</label>
                            <select class="item-select-soup" data-id="${item.id}">
                                ${soupOptions}
                            </select>
                        </div>
                    `;
                }

                if (item.principle) {
                    const principleOptions = menuDelDia.principios.map(p => `
                        <option value="${p}" ${item.principle === p ? 'selected' : ''}>${p}</option>
                    `).join('') + `<option value="Sin Principio" ${item.principle === 'Sin Principio' ? 'selected' : ''}>Sin principio</option>`;
                    itemHtml += `
                        <div class="customizer-select-group">
                            <label>Principio:</label>
                            <select class="item-select-principle" data-id="${item.id}">
                                ${principleOptions}
                            </select>
                        </div>
                    `;
                }

                if (item.side) {
                    const sideOptions = menuDelDia.acompanamientos.map(a => `
                        <option value="${a}" ${item.side === a ? 'selected' : ''}>${a}</option>
                    `).join('') + `<option value="Sin Acompañamiento" ${item.side === 'Sin Acompañamiento' ? 'selected' : ''}>Sin acompañamiento</option>`;
                    itemHtml += `
                        <div class="customizer-select-group">
                            <label>Acompañamiento:</label>
                            <select class="item-select-side" data-id="${item.id}">
                                ${sideOptions}
                            </select>
                        </div>
                    `;
                }

                if (item.salad) {
                    itemHtml += `
                        <div class="customizer-select-group">
                            <label>Ensalada:</label>
                            <select class="item-select-salad" data-id="${item.id}">
                                <option value="Con ensalada" ${item.salad === 'Con ensalada' ? 'selected' : ''}>Con ensalada</option>
                                <option value="Sin ensalada" ${item.salad === 'Sin ensalada' ? 'selected' : ''}>Sin ensalada</option>
                            </select>
                        </div>
                    `;
                }

                itemHtml += `
                    </div>
                `;
            }

            // If it's Combo Personal, render its custom selectors
            const isCombo = item.name.toLowerCase().includes('combo personal');
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
                            <label>Proteína:</label>
                            <select class="item-select-protein" data-id="${item.id}">
                                ${proteinOptions}
                            </select>
                        </div>
                        <div class="customizer-select-group">
                            <label>Bebida:</label>
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

        const cubiertosContainer = document.getElementById('cubiertos-selector-container');
        if (cubiertosContainer) {
            if (isToGo) {
                cubiertosContainer.classList.remove('hidden');
            } else {
                cubiertosContainer.classList.add('hidden');
                const selectElement = document.getElementById('cart-cubiertos');
                if (selectElement) selectElement.value = 'No necesito';
            }
        }

        const domicilioContainer = document.getElementById('domicilio-fields-container');
        if (domicilioContainer) {
            if (serviceType === 'Domicilio') {
                domicilioContainer.classList.remove('hidden');
            } else {
                domicilioContainer.classList.add('hidden');
            }
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

        document.querySelectorAll('.item-select-protein').forEach(select => {
            select.addEventListener('change', (e) => {
                const id = e.target.getAttribute('data-id');
                const val = e.target.value;
                const item = cart.find(i => i.id === id);
                if (item) item.protein = val;
            });
        });

        document.querySelectorAll('.item-select-beverage').forEach(select => {
            select.addEventListener('change', (e) => {
                const id = e.target.getAttribute('data-id');
                const val = e.target.value;
                const item = cart.find(i => i.id === id);
                if (item) item.beverage = val;
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

        // Validation for Domicilio fields
        if (serviceType === 'Domicilio') {
            const phoneVal = phoneInput ? phoneInput.value.trim() : '';
            const addressVal = addressInput ? addressInput.value.trim() : '';
            if (!phoneVal || !addressVal) {
                alert('Por favor ingresa tu número de celular y dirección de entrega antes de enviar el pedido.');
                return;
            }
        }

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

        const total = subtotal + packagingFee;

        if (packagingFee > 0) {
            orderText += `📦 *Costo de Empaque:* $${packagingFee.toLocaleString('es-CO')} ($1.000 x ${cart.length} artículo${cart.length > 1 ? 's' : ''})\n`;
        }

        if (isToGo) {
            const cubiertosSelect = document.getElementById('cart-cubiertos');
            const cubiertosValue = cubiertosSelect ? cubiertosSelect.value : 'No necesito';
            orderText += `🍴 *Cubiertos:* ${cubiertosValue}\n`;
        }

        if (serviceType === 'Domicilio') {
            const phoneVal = phoneInput ? phoneInput.value.trim() : '';
            const addressVal = addressInput ? addressInput.value.trim() : '';
            orderText += `📞 *Teléfono:* ${phoneVal}\n`;
            orderText += `📍 *Dirección:* ${addressVal}\n`;
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
