/**
 * Халачи Гостиница - Admin Panel JavaScript
 * Updated: 2026-02-17 - Fixed CRUD operations
 */

const API_BASE = '';

// ===== STATE =====
let data = {
  hotel: {},
  tours: [],
  categories: [],
  rooms: [],
  bookings: []
};

let adminPassword = localStorage.getItem('admin_password') || '';

// ===== API =====
async function apiGet(endpoint) {
  const response = await fetch(`${API_BASE}${endpoint}`, {
    headers: { 'x-admin-password': adminPassword }
  });
  if (response.status === 401) {
    showAuthModal();
    throw new Error('Unauthorized');
  }
  return response.json();
}

async function apiPost(endpoint, data) {
  const response = await fetch(`${API_BASE}${endpoint}`, {
    method: 'POST',
    headers: { 
      'Content-Type': 'application/json',
      'x-admin-password': adminPassword
    },
    body: JSON.stringify(data)
  });
  if (response.status === 401) {
    showAuthModal();
    throw new Error('Unauthorized');
  }
  return response.json();
}

async function apiPut(endpoint, data) {
  const response = await fetch(`${API_BASE}${endpoint}`, {
    method: 'PUT',
    headers: { 
      'Content-Type': 'application/json',
      'x-admin-password': adminPassword
    },
    body: JSON.stringify(data)
  });
  if (response.status === 401) {
    showAuthModal();
    throw new Error('Unauthorized');
  }
  return response.json();
}

async function apiDelete(endpoint) {
  const response = await fetch(`${API_BASE}${endpoint}`, {
    method: 'DELETE',
    headers: { 'x-admin-password': adminPassword }
  });
  if (response.status === 401) {
    showAuthModal();
    throw new Error('Unauthorized');
  }
  return response.json();
}

// ===== AUTH =====
function showAuthModal() {
  const password = prompt('Введите пароль администратора:');
  if (password) {
    adminPassword = password;
    localStorage.setItem('admin_password', password);
    init();
  }
}

// ===== INITIALIZATION =====
async function init() {
  updateTime();
  setInterval(updateTime, 60000);
  
  try {
    await loadAllData();
    renderDashboard();
    renderHotel();
    renderRooms();
    renderTours();
    renderCategories();
    renderBookings();
    renderSettings();
    initNavigation();
    initModals();
  } catch (error) {
    console.error('Init error:', error);
    showAuthModal();
  }
}

async function loadAllData() {
  try {
    const response = await fetch(`${API_BASE}/api/data`);
    if (response.status === 401) {
      showAuthModal();
      return;
    }
    data = await response.json();
  } catch (error) {
    console.error('Load error:', error);
  }
}

// ===== TIME =====
function updateTime() {
  const timeEl = document.getElementById('currentTime');
  if (timeEl) {
    timeEl.textContent = new Date().toLocaleTimeString('ru-RU', { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  }
}

// ===== NAVIGATION =====
function initNavigation() {
  const navItems = document.querySelectorAll('.sidebar-nav .nav-item');
  const sections = document.querySelectorAll('.admin-section');
  const pageTitle = document.querySelector('.page-title');
  
  const titles = {
    dashboard: 'Дашборд',
    hotel: 'Гостиница',
    rooms: 'Номера',
    tours: 'Туры',
    categories: 'Категории',
    bookings: 'Заявки',
    settings: 'Настройки'
  };
  
  navItems.forEach(item => {
    item.addEventListener('click', () => {
      const sectionId = item.dataset.section;
      if (!sectionId) return;
      
      navItems.forEach(n => n.classList.remove('active'));
      item.classList.add('active');
      
      sections.forEach(s => s.classList.remove('active'));
      document.getElementById(sectionId).classList.add('active');
      
      pageTitle.textContent = titles[sectionId] || 'Admin';
      document.getElementById('sidebar').classList.remove('active');
    });
  });
  
  document.getElementById('menuToggle')?.addEventListener('click', () => {
    document.getElementById('sidebar').classList.toggle('active');
  });
}

// ===== DASHBOARD =====
function renderDashboard() {
  // Stats
  document.getElementById('totalRooms').textContent = data.hotel?.rooms?.length || 0;
  document.getElementById('totalTours').textContent = data.tours?.length || 0;
  document.getElementById('totalVisitors').textContent = (data.hotel?.visitor_count || 0).toLocaleString('ru-RU');
  
  // Avg rating
  const avgRating = data.tours?.length > 0
    ? (data.tours.reduce((sum, t) => sum + (t.rating || 0), 0) / data.tours.length).toFixed(1)
    : 0;
  document.getElementById('avgRating').textContent = avgRating;
  
  // Quick actions
  document.querySelectorAll('.action-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const action = btn.dataset.action;
      switch(action) {
        case 'addTour':
          document.querySelector('[data-section="tours"]').click();
          document.getElementById('addTourBtn').click();
          break;
        case 'updateCounter':
          updateVisitorCounter();
          break;
        case 'viewBookings':
          document.querySelector('[data-section="bookings"]').click();
          break;
        case 'openSite':
          window.open('/', '_blank');
          break;
      }
    });
  });
}

function updateVisitorCounter() {
  const newCount = prompt('Введите новый счётчик гостей:', data.hotel?.visitor_count || 0);
  if (newCount && !isNaN(newCount)) {
    try {
      await apiPost('/api/admin/visitor-count', { count: parseInt(newCount) });
      alert('Счётчик обновлён!');
      data.hotel.visitor_count = parseInt(newCount);
      document.getElementById('totalVisitors').textContent = parseInt(newCount).toLocaleString('ru-RU');
    } catch (error) {
      alert('Ошибка обновления');
    }
  }
}

// ===== HOTEL =====
function renderHotel() {
  const form = document.getElementById('hotelForm');
  if (!form || !data.hotel) return;
  
  form.querySelector('[name="name"]').value = data.hotel.name || '';
  form.querySelector('[name="phone"]').value = data.hotel.phone || '';
  form.querySelector('[name="email"]').value = data.hotel.email || '';
  form.querySelector('[name="address"]').value = data.hotel.address || '';
  form.querySelector('[name="description"]').value = data.hotel.description || '';
  form.querySelector('[name="about"]').value = data.hotel.about || '';
  
  document.getElementById('saveHotelBtn')?.addEventListener('click', async () => {
    const formData = new FormData(form);
    const updates = {
      name: formData.get('name'),
      phone: formData.get('phone'),
      email: formData.get('email'),
      address: formData.get('address'),
      description: formData.get('description'),
      about: formData.get('about')
    };
    
    try {
      await apiPost('/api/admin/hotel', updates);
      alert('Сохранено!');
      Object.assign(data.hotel, updates);
    } catch (error) {
      alert('Ошибка сохранения');
    }
  });
}

// ===== ROOMS =====
function renderRooms() {
  const rooms = data.hotel?.rooms || [];
  const container = document.getElementById('roomsList');
  if (!container) return;
  
  container.innerHTML = rooms.map((room, index) => `
    <div class="room-item">
      <div class="room-header">
        <div>
          <div class="room-name">${room.name}</div>
          <div class="room-price">от ${(room.price_from || 0).toLocaleString()} ₽</div>
        </div>
        <div class="action-btns">
          <button class="btn btn-sm" onclick="editRoom('${room.id}')" title="Редактировать">✏️</button>
          <button class="btn btn-sm" onclick="deleteRoom('${room.id}')" title="Удалить">🗑️</button>
        </div>
      </div>
      <div class="room-features">
        ${room.features?.slice(0, 5).map(f => `<span>${f}</span>`).join('') || ''}
      </div>
    </div>
  `).join('') || '<p style="color: var(--gray);">Нет номеров</p>';
}

async function deleteRoom(id) {
  if (confirm('Удалить этот номер?')) {
    try {
      await apiDelete(`/api/admin/rooms/${id}`);
      data.hotel.rooms = data.hotel.rooms.filter(r => r.id !== id);
      renderRooms();
      renderDashboard();
      alert('Номер удалён!');
    } catch (error) {
      alert('Ошибка удаления');
    }
  }
}

async function editRoom(id) {
  const room = data.hotel.rooms.find(r => r.id === id);
  if (!room) return;
  
  const name = prompt('Название номера:', room.name || '');
  if (name === null) return;
  
  const priceFrom = prompt('Цена от (₽):', room.price_from || 0);
  if (priceFrom === null) return;
  
  const description = prompt('Описание:', room.description || '');
  if (description === null) return;
  
  const featuresStr = prompt('Особенности (через запятую):', (room.features || []).join(', '));
  if (featuresStr === null) return;
  
  const features = featuresStr.split(',').map(f => f.trim()).filter(f => f);
  
  try {
    await apiPut(`/api/admin/rooms/${id}`, {
      name,
      price_from: parseInt(priceFrom) || 0,
      description,
      features
    });
    
    // Update local data
    const index = data.hotel.rooms.findIndex(r => r.id === id);
    if (index >= 0) {
      data.hotel.rooms[index] = { 
        ...data.hotel.rooms[index], 
        name, 
        price_from: parseInt(priceFrom) || 0,
        description,
        features
      };
    }
    
    renderRooms();
    alert('Номер обновлён!');
  } catch (error) {
    alert('Ошибка обновления');
  }
}

async function addRoom() {
  const name = prompt('Название номера:');
  if (!name) return;
  
  const priceFrom = prompt('Цена от (₽):', '0');
  const description = prompt('Описание:', '');
  const featuresStr = prompt('Особенности (через запятую):', '');
  const features = featuresStr ? featuresStr.split(',').map(f => f.trim()).filter(f => f) : [];
  
  const newRoom = {
    id: `room_${Date.now().toString(36)}`,
    name,
    price_from: parseInt(priceFrom) || 0,
    description,
    features,
    images: []
  };
  
  try {
    await apiPost('/api/admin/hotel', { rooms: [...(data.hotel.rooms || []), newRoom] });
    data.hotel.rooms.push(newRoom);
    renderRooms();
    renderDashboard();
    alert('Номер добавлен!');
  } catch (error) {
    alert('Ошибка добавления');
  }
}

// ===== TOURS =====
function renderTours() {
  // Category filter
  const categoryFilter = document.getElementById('tourCategoryFilter');
  if (categoryFilter) {
    categoryFilter.innerHTML = '<option value="">Все</option>' +
      data.categories.map(c => `<option value="${c.id}">${c.name}</option>`).join('');
  }
  
  // Table
  renderToursTable(data.tours || []);
  
  // Search
  const searchInput = document.getElementById('tourSearch');
  if (searchInput) {
    searchInput.addEventListener('input', (e) => {
      filterTours(e.target.value, categoryFilter?.value || '');
    });
  }
  
  if (categoryFilter) {
    categoryFilter.addEventListener('change', (e) => {
      filterTours(searchInput?.value || '', e.target.value);
    });
  }
}

function renderToursTable(tours) {
  const tbody = document.getElementById('toursTableBody');
  if (!tbody) return;
  
  tbody.innerHTML = tours.map((tour, index) => `
    <tr>
      <td><code>${tour.id?.substring(0, 8) || '-'}</code></td>
      <td><strong>${tour.title || '-'}</strong></td>
      <td>${getCategoryName(tour.category)}</td>
      <td><strong>${(tour.price || 0).toLocaleString()} ₽</strong></td>
      <td>⭐ ${tour.rating || 0}</td>
      <td>
        <span class="status-badge ${tour.available ? 'available' : 'unavailable'}">
          ${tour.available ? 'Доступен' : 'Скрыт'}
        </span>
      </td>
      <td>
        <div class="action-btns">
          <button class="btn btn-sm" onclick="toggleTour('${tour.id}')">${tour.available ? '👁️' : '🚫'}</button>
          <button class="btn btn-sm" onclick="editTour('${tour.id}')">✏️</button>
          <button class="btn btn-sm" onclick="deleteTour('${tour.id}')">🗑️</button>
        </div>
      </td>
    </tr>
  `).join('') || '<tr><td colspan="7" style="text-align: center; color: var(--gray);">Нет туров</td></tr>';
}

function filterTours(search, category) {
  let filtered = data.tours || [];
  
  if (search) {
    const s = search.toLowerCase();
    filtered = filtered.filter(t => t.title?.toLowerCase().includes(s));
  }
  
  if (category) {
    filtered = filtered.filter(t => t.category === category);
  }
  
  renderToursTable(filtered);
}

async function toggleTour(id) {
  const tour = data.tours.find(t => t.id === id);
  if (!tour) return;
  
  tour.available = !tour.available;
  
  try {
    await apiPut(`/api/admin/tours/${id}`, { available: tour.available });
    renderToursTable(data.tours);
  } catch (error) {
    alert('Ошибка');
    tour.available = !tour.available; // Revert
  }
}

async function deleteTour(id) {
  if (confirm('Удалить этот тур?')) {
    try {
      await apiDelete(`/api/admin/tours/${id}`);
      data.tours = data.tours.filter(t => t.id !== id);
      renderToursTable(data.tours);
      renderDashboard();
      alert('Тур удалён!');
    } catch (error) {
      alert('Ошибка удаления');
    }
  }
}

function editTour(id) {
  const tour = data.tours.find(t => t.id === id);
  if (!tour) return;
  
  const form = document.getElementById('tourForm');
  const modal = document.getElementById('tourModal');
  
  // Populate categories
  form.querySelector('[name="category"]').innerHTML = 
    data.categories.map(c => `<option value="${c.id}" ${c.id === tour.category ? 'selected' : ''}>${c.name}</option>`).join('');
  
  // Fill form
  form.querySelector('[name="title"]').value = tour.title || '';
  form.querySelector('[name="price"]').value = tour.price || 0;
  form.querySelector('[name="duration"]').value = tour.duration || '';
  form.querySelector('[name="rating"]').value = tour.rating || 4.5;
  form.querySelector('[name="reviews_count"]').value = tour.reviews_count || 0;
  form.querySelector('[name="short_desc"]').value = tour.short_desc || '';
  form.querySelector('[name="description"]').value = tour.description || '';
  form.querySelector('[name="featured"]').checked = tour.featured || false;
  form.querySelector('[name="available"]').checked = tour.available !== false;
  
  // Store editing ID
  form.dataset.editingId = id;
  
  modal.classList.add('active');
}

// ===== CATEGORIES =====
function renderCategories() {
  const container = document.getElementById('categoriesList');
  if (!container) return;
  
  container.innerHTML = data.categories.map((cat, index) => `
    <div class="category-item">
      <div class="category-icon" style="background: ${cat.color}20; color: ${cat.color}">
        ${cat.icon || '🗺️'}
      </div>
      <div class="category-info">
        <span class="category-name">${cat.name}</span>
        <span class="category-id">${cat.id}</span>
      </div>
      <button class="btn btn-sm" onclick="deleteCategory('${cat.id}')">🗑️</button>
    </div>
  `).join('') || '<p style="color: var(--gray);">Нет категорий</p>';
}

async function deleteCategory(id) {
  if (confirm('Удалить категорию?')) {
    try {
      await apiDelete(`/api/admin/categories/${id}`);
      data.categories = data.categories.filter(c => c.id !== id);
      renderCategories();
      renderTours();
      alert('Категория удалена!');
    } catch (error) {
      alert(error.message || 'Ошибка удаления');
    }
  }
}

// ===== BOOKINGS =====
async function renderBookings() {
  try {
    const bookings = await apiGet('/api/admin/bookings');
    data.bookings = bookings;
    
    const tbody = document.getElementById('bookingsTableBody');
    if (tbody) {
      tbody.innerHTML = bookings.slice(0, 20).map(b => `
        <tr>
          <td><code>${b.id?.substring(0, 8) || '-'}</code></td>
          <td><strong>${b.name || '-'}</strong></td>
          <td><a href="tel:${b.phone}">${b.phone || '-'}</a></td>
          <td>${b.room_type || b.tour_type || '-'}</td>
          <td>${b.created_at ? new Date(b.created_at).toLocaleDateString('ru-RU') : '-'}</td>
          <td><span class="status-badge available">${b.status || 'new'}</span></td>
        </tr>
      `).join('') || '<tr><td colspan="6" style="text-align: center; color: var(--gray);">Нет заявок</td></tr>';
    }
    
    // Recent bookings in dashboard
    const recentList = document.getElementById('recentBookings');
    if (recentList && bookings.length > 0) {
      recentList.innerHTML = bookings.slice(0, 5).map(b => `
        <li>
          <span class="title">${b.name || 'Без имени'}</span>
          <span style="color: var(--gray); font-size: 12px;">${b.phone || ''}</span>
        </li>
      `).join('');
    }
  } catch (error) {
    console.error('Bookings error:', error);
  }
  
  document.getElementById('refreshBookings')?.addEventListener('click', () => {
    renderBookings();
  });
}

// ===== SETTINGS =====
function renderSettings() {
  document.querySelector('[name="visitor_count"]').value = data.hotel?.visitor_count || 0;
  
  document.getElementById('saveSettingsBtn')?.addEventListener('click', async () => {
    const count = parseInt(document.querySelector('[name="visitor_count"]').value) || 0;
    const newPassword = document.querySelector('[name="admin_password"]').value;
    
    if (newPassword) {
      adminPassword = newPassword;
      localStorage.setItem('admin_password', newPassword);
    }
    
    try {
      await apiPost('/api/admin/visitor-count', { count });
      alert('Настройки сохранены!');
    } catch (error) {
      alert('Ошибка');
    }
  });
}

// ===== MODALS =====
function initModals() {
  // Close buttons
  document.querySelectorAll('.modal-close, .modal-cancel').forEach(btn => {
    btn.addEventListener('click', () => {
      btn.closest('.modal').classList.remove('active');
    });
  });
  
  // Click outside
  document.querySelectorAll('.modal').forEach(modal => {
    modal.addEventListener('click', (e) => {
      if (e.target === modal) modal.classList.remove('active');
    });
  });
  
  // Add buttons
  document.getElementById('addTourBtn')?.addEventListener('click', () => {
    openTourModal();
  });
  
  document.getElementById('addRoomBtn')?.addEventListener('click', () => {
    addRoom();
  });
  
  document.getElementById('addCategoryBtn')?.addEventListener('click', () => {
    document.getElementById('categoryModal').classList.add('active');
  });
  
  // Forms
  document.getElementById('tourForm')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    await saveTour();
  });
  
  document.getElementById('categoryForm')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    await saveCategory();
  });
}

function openTourModal() {
  const modal = document.getElementById('tourModal');
  const form = document.getElementById('tourForm');
  
  // Populate categories
  form.querySelector('[name="category"]').innerHTML = 
    data.categories.map(c => `<option value="${c.id}">${c.name}</option>`).join('');
  
  form.reset();
  delete form.dataset.editingId;
  modal.classList.add('active');
}

async function saveTour() {
  const form = document.getElementById('tourForm');
  const formData = new FormData(form);
  const editingId = form.dataset.editingId;
  
  const tour = {
    id: editingId || `tour_${Date.now().toString(36)}`,
    title: formData.get('title'),
    category: formData.get('category'),
    price: parseInt(formData.get('price')) || 0,
    duration: formData.get('duration') || '',
    short_desc: formData.get('short_desc') || '',
    description: formData.get('description') || '',
    rating: parseFloat(formData.get('rating')) || 4.5,
    reviews_count: parseInt(formData.get('reviews_count')) || 0,
    featured: formData.get('featured') === 'on',
    available: formData.get('available') === 'on',
    images: [],
    location: 'Дербент',
    group_size: 'до 10 чел',
    highlights: []
  };
  
  try {
    if (editingId) {
      await apiPut(`/api/admin/tours/${editingId}`, tour);
      const index = data.tours.findIndex(t => t.id === editingId);
      if (index >= 0) data.tours[index] = tour;
      alert('Тур обновлён!');
    } else {
      await apiPost('/api/admin/tours', tour);
      data.tours.push(tour);
      alert('Тур добавлен!');
    }
    
    renderTours();
    renderDashboard();
    document.getElementById('tourModal').classList.remove('active');
  } catch (error) {
    alert('Ошибка сохранения');
  }
}

async function saveCategory() {
  const form = document.getElementById('categoryForm');
  const formData = new FormData(form);
  
  const category = {
    id: formData.get('id'),
    name: formData.get('name'),
    icon: formData.get('icon') || '🗺️',
    color: formData.get('color') || '#0EA5E9'
  };
  
  try {
    await apiPost('/api/admin/categories', category);
    
    const existingIndex = data.categories.findIndex(c => c.id === category.id);
    if (existingIndex >= 0) {
      data.categories[existingIndex] = category;
    } else {
      data.categories.push(category);
    }
    
    renderCategories();
    renderTours();
    document.getElementById('categoryModal').classList.remove('active');
    alert('Категория сохранена!');
  } catch (error) {
    alert('Ошибка сохранения');
  }
}

// ===== HELPERS =====
function getCategoryName(id) {
  const cat = data.categories.find(c => c.id === id);
  return cat ? cat.name : id;
}

// Export functionality
function exportData() {
  const exportObj = {
    hotel: data.hotel,
    tours: data.tours,
    categories: data.categories,
    exported_at: new Date().toISOString()
  };
  
  const blob = new Blob([JSON.stringify(exportObj, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `halachi-export-${new Date().toISOString().split('T')[0]}.json`;
  a.click();
  URL.revokeObjectURL(url);
}

// Global functions
window.deleteRoom = deleteRoom;
window.editRoom = editRoom;
window.toggleTour = toggleTour;
window.deleteTour = deleteTour;
window.editTour = editTour;
window.deleteCategory = deleteCategory;
window.exportData = exportData;

// Start
document.addEventListener('DOMContentLoaded', init);
