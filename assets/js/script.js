// =====================================================
// script.js
// Al JavaScript er samlet i én fil, men opdelt i tre "regioner"
// efter MVC-princippet, så det stadig er nemt at finde noget:
//   MODEL      - data
//   VIEW       - HTML/skabeloner
//   CONTROLLER - knapper/events
// =====================================================


// #region MODEL
// -----------------------------------------------------
// MODEL: al appens DATA bor her, og funktionerne der ÆNDRER dataen.
// Denne del kender IKKE noget til HTML eller knapper - kun data.
// -----------------------------------------------------

const model = {
    view: 'wishlist',        // hvilken side er aktiv: 'wishlist' | 'products' | 'menu'
    wishes: [],                // listen af ønsker, fx { id: 1, text: "En ny cykel" }
    nextId: 1,                  // bruges til at give hvert nyt ønske et unikt id

    products: [],                // ALLE produkter hentet fra dummyjson
    categories: [],               // alle kategori-navne fra dummyjson
    selectedCategory: 'all',       // hvilken kategori er valgt lige nu ('all' = ingen filter)
};

// Skifter hvilken side der er aktiv
function setView(viewName) {
    model.view = viewName;
}

// Tilføjer et nyt (fritekst) ønske til listen
function addWish(text) {
    model.wishes.push({ id: model.nextId, text: text, image: null });
    model.nextId = model.nextId + 1; // næste ønske skal have et nyt (højere) id
}

// Tilføjer et produkt (fra Products-siden) til ønskelisten.
// Genbruger samme liste som addWish, men gemmer også et billede.
function addProductToWishlist(product) {
    model.wishes.push({
        id: model.nextId,
        text: `${product.title} - $${product.price}`,
        image: product.thumbnail,
    });
    model.nextId = model.nextId + 1;
}

// Fjerner et ønske ud fra dets id
function deleteWish(id) {
    model.wishes = model.wishes.filter(wish => wish.id !== id);
}

// Gemmer de produkter vi har hentet fra dummyjson
function setProducts(products) {
    model.products = products;
}

// Gemmer de kategorier vi har hentet fra dummyjson
function setCategories(categories) {
    model.categories = categories;
}

// Skifter hvilken kategori der er valgt
function setSelectedCategory(category) {
    model.selectedCategory = category;
}

// Returnerer kun de produkter der matcher den valgte kategori.
// Hvis "all" er valgt, får vi bare alle produkterne.
function getFilteredProducts() {
    if (model.selectedCategory === 'all') {
        return model.products;
    }
    return model.products.filter(product => product.category === model.selectedCategory);
}
// #endregion MODEL


// #region VIEW
// -----------------------------------------------------
// VIEW: bygger HTML ud fra modellens data, med "template strings".
// Denne del ÆNDRER ALDRIG dataen - den læser kun fra "model" og viser den.
// -----------------------------------------------------

function renderMenu() {
    return `
        <nav id="menu-view">
            <h1>Menu</h1>
            <button class="nav-btn" data-target="wishlist">Wishlist</button>
            <button class="nav-btn" data-target="products">Products list</button>
        </nav>
    `;
}

function renderWishlist() {
    return `
        <section id="wishlist-view">
            <div class="page-header">
                <h1>Wishlist</h1>
                <!-- Stjernen ER menu-knappen, ligesom i Figma -->
                <button id="menu-toggle" class="star-btn">★</button>
            </div>

            <div class="add-row">
                <input type="text" id="wish-input" placeholder="Skriv et ønske...">
                <button id="add-wish-btn">Tilføj</button>
            </div>

            <ul id="wishlist-list" class="item-list">
                ${model.wishes.map(wish => `
                    <li class="wish-item">
                        <div class="wish-content">
                            ${wish.image ? `<img class="wish-thumb" src="${wish.image}" alt="">` : ''}
                            <span>${wish.text}</span>
                        </div>
                        <button class="delete-wish-btn" data-id="${wish.id}">X</button>
                    </li>
                `).join('')}
            </ul>

            <button class="nav-btn secondary" data-target="products">Products list</button>
        </section>
    `;
}

function renderProducts() {
    // Mens vi venter på svar fra dummyjson, er model.products stadig tom
    if (model.products.length === 0) {
        return `
            <section id="products-view">
                <div class="page-header">
                    <h1>Products list</h1>
                    <button id="menu-toggle" class="star-btn">★</button>
                </div>
                <p style="padding: 16px;">Henter produkter...</p>
            </section>
        `;
    }

    const products = getFilteredProducts();

    return `
        <section id="products-view">
            <div class="page-header">
                <h1>Products list</h1>
                <!-- Stjernen ER menu-knappen, ligesom i Figma -->
                <button id="menu-toggle" class="star-btn">★</button>
            </div>

            <div id="categories" class="categories">
                <select id="category-select">
                    <option value="all" ${model.selectedCategory === 'all' ? 'selected' : ''}>Alle</option>
                    ${model.categories.map(category => `
                        <option value="${category}" ${model.selectedCategory === category ? 'selected' : ''}>${category}</option>
                    `).join('')}
                </select>
            </div>

            <ul id="products-list" class="item-list">
                ${products.map(product => `
                    <li class="product-item">
                        <img class="product-thumb" src="${product.thumbnail}" alt="${product.title}">
                        <div class="product-info">
                            <strong>${product.title}</strong>
                            <p class="product-description">${product.description}</p>
                            <span class="product-price">$${product.price}</span>
                            <button class="add-to-wishlist-btn" data-id="${product.id}">Tilføj til ønskeliste</button>
                        </div>
                    </li>
                `).join('')}
            </ul>
        </section>
    `;
}

// Bygger den side der er aktiv lige nu (ud fra model.view)
function renderApp() {
    return `
        ${model.view === 'menu' ? renderMenu() : ''}
        ${model.view === 'wishlist' ? renderWishlist() : ''}
        ${model.view === 'products' ? renderProducts() : ''}
    `;
}

// Tegner appen på skærmen: bygger HTML'en og sætter den ind i #app.
// Kaldes fra CONTROLLER hver gang noget har ændret sig.
function render() {
    const app = document.getElementById('app');
    app.innerHTML = renderApp();
    attachEvents(); // knapperne skal sættes op igen (se CONTROLLER)
}
// #endregion VIEW


// #region CONTROLLER
// -----------------------------------------------------
// CONTROLLER: lytter efter klik, og er "bindeleddet" mellem
// MODEL (data) og VIEW (HTML). Henter også data udefra (dummyjson).
// Reglen: en knap opdaterer ALTID model FØRST, og kalder SÅ render().
// -----------------------------------------------------

// Sætter click-events på de knapper der findes lige nu på skærmen.
// Skal køres igen efter hver render(), fordi innerHTML sletter de gamle
// knapper (og deres click-events) hver gang siden bygges om.
function attachEvents() {
    // Stjerne-knappen (menu-toggle) findes KUN på Wishlist- og Products-siden
    const menuToggle = document.getElementById('menu-toggle');
    if (menuToggle) {
        menuToggle.addEventListener('click', () => {
            setView('menu');   // 1. opdater model
            render();           // 2. tegn view igen
        });
    }

    // Alle knapper der skifter side (Menu-siden + "Products list"-knappen)
    const navButtons = document.querySelectorAll('.nav-btn');
    navButtons.forEach(button => {
        button.addEventListener('click', () => {
            setView(button.dataset.target); // 1. opdater model
            render();                        // 2. tegn view igen
        });
    });

    // "Tilføj"-knappen: læser teksten fra input-feltet og tilføjer et ønske
    const addWishBtn = document.getElementById('add-wish-btn');
    if (addWishBtn) {
        addWishBtn.addEventListener('click', () => {
            const input = document.getElementById('wish-input');
            const text = input.value.trim(); // trim fjerner mellemrum foran/bagved

            if (text !== '') {
                addWish(text); // 1. opdater model
                render();       // 2. tegn view igen
            }
        });
    }

    // Alle "X"-knapper i wishlisten (der kan være flere, én pr. ønske)
    const deleteButtons = document.querySelectorAll('.delete-wish-btn');
    deleteButtons.forEach(button => {
        button.addEventListener('click', () => {
            const id = Number(button.dataset.id); // dataset er altid tekst, så vi laver det om til et tal
            deleteWish(id); // 1. opdater model
            render();        // 2. tegn view igen
        });
    });

    // Kategori-dropdown'en på Products-siden
    const categorySelect = document.getElementById('category-select');
    if (categorySelect) {
        categorySelect.addEventListener('change', () => {
            setSelectedCategory(categorySelect.value); // 1. opdater model
            render();                                    // 2. tegn view igen
        });
    }

    // "Tilføj til ønskeliste"-knapperne på Products-siden (én pr. produkt)
    const addToWishlistButtons = document.querySelectorAll('.add-to-wishlist-btn');
    addToWishlistButtons.forEach(button => {
        button.addEventListener('click', () => {
            const id = Number(button.dataset.id);
            // Vi slår produktet op i model.products (den fulde liste), så det
            // virker uanset hvilken kategori der er valgt lige nu
            const product = model.products.find(p => p.id === id);

            if (product) {
                addProductToWishlist(product); // 1. opdater model
                render();                        // 2. tegn view igen
            }
        });
    });
}

// Henter produkter og kategorier fra dummyjson.com.
// "async" betyder at funktionen må vente på svar fra internettet,
// uden at hele siden fryser imens.
async function loadProducts() {
    const productsResponse = await fetch('https://dummyjson.com/products?limit=100');
    const productsData = await productsResponse.json();
    setProducts(productsData.products);

    const categoriesResponse = await fetch('https://dummyjson.com/products/categories');
    const categoriesData = await categoriesResponse.json();
    // dummyjson giver os objekter som { slug, name, url } - vi vil bare bruge "slug"
    setCategories(categoriesData.map(category => category.slug));

    render(); // tegn siden igen, nu hvor vi har data
}

// Starter appen: tegner siden med det samme (tom liste),
// og henter så produkterne i baggrunden
render();
loadProducts();
// #endregion CONTROLLER
