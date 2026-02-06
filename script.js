const cardsContainer = document.getElementById('cards-container');
const [showBtn, resetBtn, rulesBtn] = ['show-btn', 'reset-btn', 'rules-btn'].map(id => document.getElementById(id));
const rulesModal = document.getElementById('rules-modal');
const closeBtn = document.querySelector('.close-btn');

let deckId = null;
let currentCards = [];
const CARD_BACK_URL = 'card_back.png';
const API_BASE = 'https://deckofcardsapi.com/api/deck';

const fetchJson = async (url) => (await fetch(url)).json();

async function initializeGame() {
    try {
        const { deck_id } = await fetchJson(`${API_BASE}/new/shuffle/?deck_count=1`);
        deckId = deck_id;
        await drawCards();
    } catch (err) { console.error("Init Error:", err); }
}

async function drawCards() {
    if (!deckId) return;
    try {
        const { cards } = await fetchJson(`${API_BASE}/${deckId}/draw/?count=3`);
        currentCards = cards;
        renderCards();
    } catch (err) { console.error("Draw Error:", err); }
}

function renderCards() {
    cardsContainer.innerHTML = currentCards.map(card => `
        <div class="card-container">
            <div class="card-inner">
                <div class="card-front"><img src="${card.image}" class="card-img" alt="${card.code}"></div>
                <div class="card-back"><img src="${CARD_BACK_URL}" class="card-img" alt="Back"></div>
            </div>
        </div>
    `).join('');
}

showBtn.addEventListener('click', () => {
    document.querySelectorAll('.card-container').forEach((card, i) => {
        setTimeout(() => card.classList.add('flip'), i * 100);
    });
});

resetBtn.addEventListener('click', async () => {
    // 1. Flip back immediately
    document.querySelectorAll('.card-container').forEach(c => c.classList.remove('flip'));
    resetBtn.disabled = true;

    try {
        // 2. Fetch new cards while animating (Parallel execution)
        const fetchPromise = (async () => {
            if (!deckId) {
                const { deck_id } = await fetchJson(`${API_BASE}/new/shuffle/?deck_count=1`);
                deckId = deck_id;
            } else {
                await fetch(`${API_BASE}/${deckId}/shuffle/`);
            }
            const { cards } = await fetchJson(`${API_BASE}/${deckId}/draw/?count=3`);
            return cards;
        })();

        // 3. Wait for animation (600ms) + fetch
        const [newCards] = await Promise.all([
            fetchPromise,
            new Promise(r => setTimeout(r, 600))
        ]);

        // 4. Update UI
        currentCards = newCards;
        renderCards();
    } catch (err) {
        console.error("Reset Error:", err);
    } finally {
        resetBtn.disabled = false;
    }
});

// Modal Logic
const toggleModal = (show) => rulesModal.classList.toggle('hidden', !show);
rulesBtn.addEventListener('click', () => toggleModal(true));
closeBtn.addEventListener('click', () => toggleModal(false));
window.addEventListener('click', (e) => e.target === rulesModal && toggleModal(false));

initializeGame();
