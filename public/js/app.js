/**
 * Халачи Гостиница - Frontend JavaScript
 * Updated: 2026-02-17
 */

const API_BASE = ''; // Same origin

// ===== API FUNCTIONS =====
async function apiGet(endpoint) {
  const response = await fetch(`${API_BASE}${endpoint}`);
  if (!response.ok) throw new Error(`API error: ${response.status}`);
  return response.json();
}

async function apiPost(endpoint, data) {
  const response = await fetch(`${API_BASE}${endpoint}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  });
  return response.json();
}

// ===== RENDER FUNCTIONS =====
function renderRooms(rooms) {
  const grid = document.getElementById('roomsGrid');
  if (!grid) return;
  
  if (!rooms || rooms.length === 0) {
    grid.innerHTML = '<p style="text-align: center; color: var(--gray); padding: 40px;">Номера скоро появятся</p>';
    return;
  }
  
  grid.innerHTML = rooms.map(room => `
    <article class="room-card" data-id="${room.id}">
      <div class="room-image">
        <img src="${getRoomImage(room)}" alt="${room.name}" loading="lazy" />
        ${room.popular ? '<span class="room-badge">Хит продаж</span>' : ''}
      </div>
      <div class="room-content">
        <h3 class="room-title">${room.name}</h3>
        <p style="color: var(--text-secondary); font-size: 14px; margin-bottom: 12px;">${(room.description || '').substring(0, 80)}...</p>
        <div class="room-features">
          ${(room.features || []).slice(0, 4).map(f => `<span>${f}</span>`).join('')}
          ${(room.features || []).length > 4 ? `<span>+${(room.features || []).length - 4}</span>` : ''}
        </div>
        <div class="room-footer">
          <div class="room-price">
            от ${formatPrice(room.price_from || 0)} <span>/ ночь</span>
          </div>
          <button class="btn btn-primary btn-sm" onclick="bookRoom('${room.id}')">Забронировать</button>
        </div>
      </div>
    </article>
  `).join('');
}

function renderServices(services) {
  const grid = document.getElementById('servicesGrid');
  if (!grid) return;
  
  if (!services || services.length === 0) {
    grid.innerHTML = '<p style="text-align: center; color: var(--gray);">Услуги загружаются...</p>';
    return;
  }
  
  grid.innerHTML = services.map(service => `
    <div class="service-card">
      <div class="service-icon">${service.icon || '✨'}</div>
      <span class="service-name">${service.name || ''}</span>
    </div>
  `).join('');
}

function renderTours(tours) {
  const grid = document.getElementById('toursGrid');
  if (!grid) return;
  
  if (!tours || tours.length === 0) {
    grid.innerHTML = '<p style="text-align: center; color: var(--gray);">Туры скоро появятся</p>';
    return;
  }
  
  grid.innerHTML = tours.map(tour => `
    <article class="tour-card" data-category="${tour.category || ''}">
      <div class="tour-image">
        <img src="${getTourImage(tour)}" alt="${tour.title || ''}" loading="lazy" />
        ${tour.featured ? '<span class="tour-badge">Рекомендуем</span>' : ''}
      </div>
      <div class="tour-content">
        <h3 class="tour-title">${tour.title || ''}</h3>
        <p style="color: var(--text-secondary); font-size: 14px; margin-bottom: 12px;">${tour.short_desc || ''}</p>
        <div class="tour-meta">
          <span>⏱️ ${tour.duration || ''}</span>
          <span>📍 ${tour.location || ''}</span>
        </div>
        <div class="tour-footer">
          <div class="tour-price">${formatPrice(tour.price || 0)}</div>
          <div class="tour-rating">
            <span class="stars">★</span>
            <span>${tour.rating || 0}</span>
          </div>
        </div>
      </div>
    </article>
  `).join('');
}

function renderCategories(categories) {
  const filter = document.getElementById('categoryFilter');
  if (!filter) return;
  
  filter.innerHTML = `
    <button class="filter-btn active" data-category="all">Все</button>
    ${categories.map(cat => `
      <button class="filter-btn" data-category="${cat.id}">${cat.icon} ${cat.name}</button>
    `).join('')}
  `;
  
  filter.querySelectorAll('.filter-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      filter.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      filterTours(btn.dataset.category);
    });
  });
}

function renderNearby(nearby) {
  const container = document.getElementById('nearbyPlaces');
  if (!container) return;
  
  container.innerHTML = `
    <h4>Что рядом:</h4>
    ${nearby.map(place => `
      <div class="nearby-item">
        <span>${place.name}</span>
        <span>${place.distance}</span>
      </div>
    `).join('')}
  `;
}

function renderReviews(reviews) {
  const grid = document.getElementById('reviewsGrid');
  if (!grid) return;
  
  if (!reviews || reviews.length === 0) {
    grid.innerHTML = '<p style="text-align: center; color: var(--gray); padding: 40px;">Отзывов пока нет</p>';
    return;
  }
  
  grid.innerHTML = reviews.map(review => `
    <div class="review-card">
      <div class="review-header">
        <div class="review-avatar">${(review.name || 'Г').charAt(0)}</div>
        <div>
          <div class="review-name">${review.name || 'Гость'}</div>
          <div class="review-date">${formatDate(review.date)}</div>
        </div>
      </div>
      <div class="review-stars">${'★'.repeat(review.rating || 5)}${'☆'.repeat(5 - (review.rating || 5))}</div>
      <p class="review-text">${review.text || ''}</p>
    </div>
  `).join('');
}

function renderHotelInfo(hotel) {
  // Address
  const addressEl = document.getElementById('addressText');
  if (addressEl) addressEl.textContent = hotel.address || '';
  
  const contactAddress = document.getElementById('contactAddress');
  if (contactAddress) contactAddress.textContent = hotel.address || '';
  
  // About
  const aboutText = document.getElementById('aboutText');
  if (aboutText) aboutText.textContent = hotel.description || '';
  
  // Visitor counter
  const visitorCount = document.getElementById('visitorCount');
  const footerVisitor = document.getElementById('footerVisitorCount');
  
  if (hotel.visitor_count && visitorCount) {
    animateCounter(visitorCount, hotel.visitor_count);
  }
  if (hotel.visitor_count && footerVisitor) {
    footerVisitor.textContent = hotel.visitor_count.toLocaleString('ru-RU');
  }
}

// ===== FILTER =====
function filterTours(category) {
  const cards = document.querySelectorAll('.tour-card');
  cards.forEach(card => {
    if (category === 'all' || card.dataset.category === category) {
      card.style.display = 'block';
      card.classList.add('fade-in');
    } else {
      card.style.display = 'none';
    }
  });
}

// ===== BOOKING =====
function quickBook() {
  const checkIn = document.getElementById('checkIn').value;
  const checkOut = document.getElementById('checkOut').value;
  const guests = document.getElementById('guests').value;
  
  // Set values in main form
  const bookingForm = document.getElementById('bookingForm');
  if (bookingForm) {
    bookingForm.querySelector('[name="check_in"]').value = checkIn;
    bookingForm.querySelector('[name="check_out"]').value = checkOut;
    bookingForm.querySelector('[name="guests"]').value = guests;
    
    // Scroll to form
    document.getElementById('booking').scrollIntoView({ behavior: 'smooth' });
  }
}

function bookRoom(roomId) {
  const bookingForm = document.getElementById('bookingForm');
  if (bookingForm) {
    bookingForm.querySelector('[name="room_type"]').value = roomId;
    document.getElementById('booking').scrollIntoView({ behavior: 'smooth' });
  }
}

async function initBookingForm() {
  const form = document.getElementById('bookingForm');
  if (!form) return;
  
  // Set min dates
  const today = new Date().toISOString().split('T')[0];
  const tomorrow = new Date(Date.now() + 86400000).toISOString().split('T')[0];
  
  const checkIn = form.querySelector('[name="check_in"]');
  const checkOut = form.querySelector('[name="check_out"]');
  
  if (checkIn) {
    checkIn.min = today;
    checkIn.addEventListener('change', function() {
      if (checkOut && this.value) {
        checkOut.min = this.value;
        if (checkOut.value && checkOut.value < this.value) {
          checkOut.value = this.value;
        }
      }
    });
  }
  
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const formData = new FormData(form);
    const data = Object.fromEntries(formData);
    
    const submitBtn = form.querySelector('button[type="submit"]');
    submitBtn.disabled = true;
    submitBtn.textContent = 'Отправляем...';
    
    try {
      const result = await apiPost('/api/booking', data);
      
      if (result.success) {
        alert('✓ Заявка принята!\n\nМенеджер свяжется с вами в течение 15 минут.');
        form.reset();
      } else {
        alert('Ошибка: ' + (result.error || 'Попробуйте позвонить нам'));
      }
    } catch (error) {
      console.error('Booking error:', error);
      alert('Ошибка отправки. Позвоните нам: +7 (928) 123-45-67');
    } finally {
      submitBtn.disabled = false;
      submitBtn.textContent = 'Отправить заявку';
    }
  });
}

// ===== NAVIGATION =====
function initNavigation() {
  document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', (e) => {
      const target = document.querySelector(anchor.getAttribute('href'));
      if (target) {
        e.preventDefault();
        const headerHeight = document.querySelector('.header').offsetHeight;
        const targetPosition = target.offsetTop - headerHeight - 20;
        window.scrollTo({ top: targetPosition, behavior: 'smooth' });
        
        // Close mobile menu
        document.getElementById('mobileMenu')?.classList.remove('active');
      }
    });
  });
  
  // Header scroll effect
  const header = document.getElementById('header');
  window.addEventListener('scroll', () => {
    if (!header) return;
    if (window.scrollY > 50) {
      header.style.boxShadow = 'var(--shadow-md)';
    } else {
      header.style.boxShadow = 'none';
    }
  }, { passive: true });
}

function initMobileMenu() {
  const btn = document.getElementById('mobileMenuBtn');
  const menu = document.getElementById('mobileMenu');
  
  btn?.addEventListener('click', () => {
    menu.classList.toggle('active');
  });
}

// ===== ANIMATIONS =====
function initScrollAnimations() {
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('fade-in');
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.1, rootMargin: '0px 0px -50px 0px' });
  
  document.querySelectorAll('.room-card, .service-card, .tour-card, .review-card, .contact-card').forEach(el => {
    observer.observe(el);
  });
}

// ===== HELPERS =====
function formatPrice(price) {
  return price.toLocaleString('ru-RU') + ' ₽';
}

function formatDate(dateStr) {
  const date = new Date(dateStr);
  return date.toLocaleDateString('ru-RU', { day: 'numeric', month: 'long', year: 'numeric' });
}

function getRoomImage(room) {
  if (room.images?.[0]) {
    return `/images/${room.images[0]}`;
  }
  return 'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=600&q=80';
}

function getTourImage(tour) {
  if (tour.images?.[0]) {
    return `/images/${tour.images[0]}`;
  }
  return 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=600&q=80';
}

function animateCounter(element, target) {
  let current = 0;
  const increment = target / 50;
  const timer = setInterval(() => {
    current += increment;
    if (current >= target) {
      current = target;
      clearInterval(timer);
    }
    element.textContent = Math.floor(current).toLocaleString('ru-RU');
  }, 30);
}

// ===== INITIALIZATION =====
async function init() {
  try {
    // Load all data
    const data = await apiGet('/api/data');
    
    if (data.hotel) {
      renderHotelInfo(data.hotel);
      renderServices(data.hotel.amenities || []);
      renderNearby(data.hotel.nearby_places || []);
      renderReviews(data.hotel.testimonials || []);
    }
    
    if (data.rooms) {
      renderRooms(data.rooms);
    }
    
    if (data.tours) {
      renderTours(data.tours);
    }
    
    if (data.categories) {
      renderCategories(data.categories);
    }
    
    // Initialize components
    initNavigation();
    initMobileMenu();
    initBookingForm();
    initScrollAnimations();
    
    console.log('🏨 Halachi Hotel website initialized');
    
  } catch (error) {
    console.error('Init error:', error);
    // Show fallback data
    showFallbackData();
    // Still init booking form
    initBookingForm();
  }
}

function showFallbackData() {
  // Show static content if API fails
  console.log('Showing fallback content...');
  // Render hardcoded data as fallback
  renderRooms([
    {id: 'standard', name: 'Стандарт', description: 'Уютный номер с необходимым набором удобств', price_from: 3500, features: ['Wi-Fi', 'TV', 'Кондиционер']},
    {id: 'comfort', name: 'Комфорт', description: 'Просторный номер с улучшенной мебелью', price_from: 4800, features: ['Wi-Fi', 'TV', 'Кондиционер', 'Мини-бар']},
    {id: 'family', name: 'Семейный', description: 'Отличный выбор для семьи с детьми', price_from: 6200, features: ['Wi-Fi', 'TV', 'Кондиционер', 'Детская кроватка']}
  ]);
  
  renderServices([
    {icon: '📶', name: 'Бесплатный Wi-Fi'},
    {icon: '🍽️', name: 'Ресторан'},
    {icon: '🅿️', name: 'Бесплатная парковка'},
    {icon: '🛎️', name: 'Круглосуточная стойка'},
    {icon: '🧼', name: 'Прачечная'}
  ]);
  
  renderReviews([
    {name: 'Александр М.', rating: 5, date: '2026-02-10', text: 'Отличная гостиница! Чисто, уютно, вежливый персонал.'},
    {name: 'Елена К.', rating: 5, date: '2026-01-28', text: 'Останавливались с семьёй — просторно и комфортно.'}
  ]);
}

// Start
document.addEventListener('DOMContentLoaded', init);

// Make functions global for onclick handlers
window.quickBook = quickBook;
window.bookRoom = bookRoom;
