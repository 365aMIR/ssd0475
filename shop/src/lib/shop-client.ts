// Browser side of the shop: the product popup and the receipt cart.
// Products come in as JSON from the page (see index.astro), so this file has
// no copy of the catalogue to keep in sync.
import type { Product, ShippingZone } from '../data/products';

interface Line {
    id: string;
    size: string;
    qty: number;
}

const CART_KEY = 'ssd:cart';
const ZONE_KEY = 'ssd:zone';

const euro = (value: number) => '€ ' + value.toFixed(2).replace('.', ',');

function el<T extends HTMLElement>(id: string): T {
    const node = document.getElementById(id);
    if (!node) throw new Error(`#${id} missing`);
    return node as T;
}

export function startShop() {
    const dataNode = document.getElementById('ssd-products');
    if (!dataNode?.textContent) return;
    const { products, zones } = JSON.parse(dataNode.textContent) as {
        products: Product[];
        zones: ShippingZone[];
    };
    const byId = new Map(products.map((p) => [p.id, p]));

    /* ---------- cart state ---------- */
    let cart: Line[] = [];
    try {
        const raw = JSON.parse(localStorage.getItem(CART_KEY) || '[]');
        // Drop anything that is no longer for sale, so an old cart can't break.
        if (Array.isArray(raw)) cart = raw.filter((l) => byId.has(l?.id) && l.qty > 0);
    } catch {}

    const persist = () => {
        try {
            localStorage.setItem(CART_KEY, JSON.stringify(cart));
        } catch {}
    };

    /* ---------- receipt ---------- */
    const bon = el<HTMLDialogElement>('cart');
    const lines = el<HTMLUListElement>('bon-lines');

    el('bon-date').textContent = new Date().toLocaleDateString('nl-NL');

    // Where it ships to: picked on the receipt, sets the shipping cost here
    // and the countries Stripe accepts at checkout.
    const zoneSelect = el<HTMLSelectElement>('bon-zone');
    let zone = 0;
    try {
        zone = Number(localStorage.getItem(ZONE_KEY) ?? 0);
    } catch {}
    if (!(zone >= 0 && zone < zones.length)) zone = 0;
    zoneSelect.replaceChildren(
        ...zones.map((z, i) => {
            const option = document.createElement('option');
            option.value = String(i);
            option.textContent = z.name;
            return option;
        }),
    );
    zoneSelect.value = String(zone);
    zoneSelect.addEventListener('change', () => {
        zone = Number(zoneSelect.value);
        try {
            localStorage.setItem(ZONE_KEY, String(zone));
        } catch {}
        renderCart();
    });

    function renderCart() {
        let subtotal = 0;
        lines.replaceChildren(
            ...cart.map((line, index) => {
                const product = byId.get(line.id)!;
                const sum = product.price * line.qty;
                subtotal += sum;

                const li = document.createElement('li');
                const top = document.createElement('div');
                top.className = 'block-cart-line-top';
                const name = document.createElement('span');
                name.className = 'block-cart-line-name';
                name.textContent = product.name;
                const total = document.createElement('span');
                total.className = 'block-cart-line-sum';
                total.textContent = euro(sum);
                top.append(name, total);

                const ctrl = document.createElement('div');
                ctrl.className = 'block-cart-line-ctrl';
                const size = document.createElement('span');
                size.className = 'block-cart-line-size';
                size.textContent = line.size;
                const spacer = document.createElement('span');
                spacer.className = 'block-cart-line-spacer';
                const minus = document.createElement('button');
                minus.type = 'button';
                minus.textContent = '−';
                minus.setAttribute('aria-label', `Eén ${product.name} minder`);
                minus.addEventListener('click', () => changeQty(index, -1));
                const qty = document.createElement('span');
                qty.className = 'block-cart-line-qty';
                qty.textContent = String(line.qty);
                const plus = document.createElement('button');
                plus.type = 'button';
                plus.textContent = '+';
                plus.setAttribute('aria-label', `Eén ${product.name} meer`);
                plus.addEventListener('click', () => changeQty(index, 1));
                ctrl.append(size, spacer, minus, qty, plus);

                li.append(top, ctrl);
                return li;
            }),
        );

        el('bon-empty').hidden = cart.length > 0;
        el('bon-subtotal').textContent = euro(subtotal);
        const shipping = zones[zone]?.price ?? 0;
        el('bon-shipping').textContent = cart.length ? euro(shipping) : euro(0);
        el('bon-total').textContent = euro(cart.length ? subtotal + shipping : 0);
        checkout.disabled = cart.length === 0 || zones.length === 0;

        // Each product in the cart puts its own class on the receipt (rojo,
        // angelo…), so the backdrop takes on that hoodie's stripes.
        products.forEach((p) => {
            if (p.cartClass)
                bon.classList.toggle(
                    p.cartClass,
                    cart.some((l) => l.id === p.id),
                );
        });

        const count = cart.reduce((n, l) => n + l.qty, 0);
        document.querySelectorAll('[data-cart-count]').forEach((n) => {
            n.textContent = String(count);
        });
    }

    /* ---------- checkout ---------- */
    // Sends the cart to pages/api/checkout.ts, which checks prices and stock in
    // the admin and answers with the Stripe payment page to go to.
    const checkout = el<HTMLButtonElement>('bon-checkout');
    const note = el('bon-note');
    const noteText = note.textContent;
    checkout.addEventListener('click', async () => {
        checkout.disabled = true;
        checkout.textContent = 'even wachten…';
        note.classList.remove('error');
        note.textContent = noteText;
        try {
            const res = await fetch('/api/checkout', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ lines: cart, zone }),
            });
            const data = await res.json();
            if (res.ok && data.url) {
                location.href = data.url;
                return;
            }
            throw new Error(data.error || 'Er ging iets mis, probeer het opnieuw.');
        } catch (error) {
            note.textContent = error instanceof Error ? error.message : 'Er ging iets mis, probeer het opnieuw.';
            note.classList.add('error');
            checkout.disabled = false;
            checkout.textContent = 'checkout';
        }
    });

    function changeQty(index: number, delta: number) {
        cart = cart.map((l, i) => (i === index ? { ...l, qty: l.qty + delta } : l)).filter((l) => l.qty > 0);
        persist();
        renderCart();
    }

    function addToCart(id: string, size: string) {
        const existing = cart.find((l) => l.id === id && l.size === size);
        if (existing) existing.qty += 1;
        else cart.push({ id, size, qty: 1 });
        persist();
        renderCart();
    }

    // A click on the backdrop (the dialog element itself, not its contents) closes.
    const closeOnBackdrop = (dialog: HTMLDialogElement) =>
        dialog.addEventListener('click', (e) => {
            if (e.target === dialog) dialog.close();
        });
    closeOnBackdrop(bon);

    document.querySelectorAll('[data-cart-open]').forEach((btn) =>
        btn.addEventListener('click', () => {
            renderCart();
            bon.showModal();
        }),
    );

    /* ---------- product popup ---------- */
    const modal = el<HTMLDialogElement>('product-modal');
    closeOnBackdrop(modal);
    const photo = el<HTMLImageElement>('pm-photo');
    const sizeRow = el('pm-sizes');
    const thumbs = el('pm-thumbs');

    let current: Product | null = null;
    let photoIndex = 0;
    let size = '';

    function showPhoto(i: number) {
        if (!current) return;
        const n = current.photos.length;
        photoIndex = ((i % n) + n) % n;
        photo.src = current.photos[photoIndex];
        photo.alt = `${current.name}, foto ${photoIndex + 1} van ${n}`;
        thumbs.querySelectorAll('button').forEach((b, k) => {
            b.setAttribute('aria-current', String(k === photoIndex));
        });
    }

    function pickSize(next: string) {
        size = next;
        sizeRow.querySelectorAll('button').forEach((b) => {
            b.setAttribute('aria-checked', String(b.dataset.size === size));
        });
    }

    function openProduct(id: string) {
        const product = byId.get(id);
        if (!product) return;
        current = product;

        el('pm-name').textContent = product.name;
        el('pm-price').textContent = euro(product.price);

        const description = el('pm-description');
        description.replaceChildren(
            ...product.description.map((text) => {
                const p = document.createElement('p');
                p.textContent = text;
                return p;
            }),
        );
        description.hidden = product.description.length === 0;

        sizeRow.setAttribute('role', 'radiogroup');
        sizeRow.setAttribute('aria-label', 'Maat');
        sizeRow.replaceChildren(
            ...product.sizes.map((s) => {
                const b = document.createElement('button');
                b.type = 'button';
                b.setAttribute('role', 'radio');
                b.dataset.size = s;
                b.textContent = s;
                // Sold out sizes stay visible but can't be picked.
                if (product.soldOut?.includes(s)) {
                    b.disabled = true;
                    b.title = 'uitverkocht';
                }
                b.addEventListener('click', () => pickSize(s));
                return b;
            }),
        );
        const available = product.sizes.filter((s) => !product.soldOut?.includes(s));
        pickSize(available.includes('m') ? 'm' : (available[0] ?? ''));
        el<HTMLButtonElement>('pm-add').disabled = available.length === 0;

        thumbs.replaceChildren(
            ...product.photos.map((src, k) => {
                const b = document.createElement('button');
                b.type = 'button';
                b.setAttribute('aria-label', `Foto ${k + 1}`);
                const img = document.createElement('img');
                img.src = src;
                img.alt = '';
                b.append(img);
                b.addEventListener('click', () => showPhoto(k));
                return b;
            }),
        );
        showPhoto(0);
        modal.showModal();
    }

    /* ---------- gallery ---------- */
    const gallery = el<HTMLDialogElement>('product-gallery');
    closeOnBackdrop(gallery);

    // Every photo stacked in one window, starting at the one that was showing.
    el('pm-zoom').addEventListener('click', () => {
        if (!current) return;
        const product = current;
        el('pg-name').textContent = product.name;
        const photos = el('pg-photos');
        photos.replaceChildren(
            ...product.photos.map((src, k) => {
                const img = document.createElement('img');
                img.src = src;
                img.alt = `${product.name}, foto ${k + 1} van ${product.photos.length}`;
                return img;
            }),
        );
        gallery.showModal();
        photos.children[photoIndex]?.scrollIntoView({ block: 'start' });
    });

    el('pm-prev').addEventListener('click', () => showPhoto(photoIndex - 1));
    el('pm-next').addEventListener('click', () => showPhoto(photoIndex + 1));
    modal.addEventListener('keydown', (e) => {
        if (e.key === 'ArrowLeft') showPhoto(photoIndex - 1);
        if (e.key === 'ArrowRight') showPhoto(photoIndex + 1);
    });

    el('pm-add').addEventListener('click', () => {
        if (!current || !size) return;
        addToCart(current.id, size);
        modal.close();
        bon.showModal();
    });

    document.addEventListener('click', (e) => {
        const opener = (e.target as HTMLElement).closest<HTMLElement>('[data-product-open]');
        if (opener?.dataset.productOpen) openProduct(opener.dataset.productOpen);
    });

    renderCart();
}
