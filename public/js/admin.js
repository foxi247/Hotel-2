/**
 * Халачи Гостиница - Admin Panel JavaScript
 * Updated: 2026-02-17 - Full CRUD + Reviews + SEO + Media
 */

const API_BASE = '';

// ===== STATE =====
let data = {
  hotel: {},
  tours: [],
  categories: [],
  rooms: [],
  bookings: [],
  reviews: [],
  seo: {}
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

async function uploadImage(file) {
  const formData = new FormData();
  formData.append('image', file);
  
  const response = await fetch(`${API_BASE}/api/admin/upload`, {
    method: 'POST',
    headers: { 'x-admin-password': adminPassword },
    body: formData
  });
  
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
    renderReviews();
    renderSeo();
    renderBookings();
    renderSettings();
    initNavigation();
    initModals();
    initTabs();
    initImageUploads();
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
    reviews: 'Отзывы',
    seo: 'SEO',
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

// ===== TABS =====
function initTabs() {
  document.querySelectorAll('.tab-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const tabId = btn.dataset.tab;
      const form = btn.closest('form');
      
      form.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
      form.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
      
      btn.classList.add('active');
      form.querySelector(`#tab-${tabId}`).classList.add('active');
    });
  });
}

// ===== IMAGE UPLOADS =====
function initImageUploads() {
  // Tour images
  const tourInput = document.getElementById('tourImages');
  const tourArea = document.getElementById('tourImagesArea');
  const tourPreview = document.getElementById('tourImagePreview');
  
  if (tourArea && tourInput) {
    tourArea.addEventListener('click', () => tourInput.click());
    tourArea.addEventListener('dragover', (e) => { e.preventDefault(); tourArea.classList.add('dragover'); });
    tourArea.addEventListener('dragleave', () => tourArea.classList.remove('dragover'));
    tourArea.addEventListener('drop', async (e) => {
      e.preventDefault();
      tourArea.classList.remove('dragover');
      for (const file of e.dataTransfer.files) {
        if (file.type.startsWith('image/')) {
          await handleImageUpload(file, tourPreview, 'tour');
        }
      }
    });
    tourInput.addEventListener('change', async () => {
      for (const file of tourInput.files) {
        await handleImageUpload(file, tourPreview, 'tour');
      }
    });
  }
  
  // Room images
  const roomInput = document.getElementById('roomImages');
  const roomArea = document.getElementById('roomImagesArea');
  const roomPreview = document.getElementById('roomImagePreview');
  
  if (roomArea && roomInput) {
    roomArea.addEventListener('click', () => roomInput.click());
    roomArea.addEventListener('dragover', (e) => { e.preventDefault(); roomArea.classList.add('dragover'); });
    roomArea.addEventListener('dragleave', () => roomArea.classList.remove('dragover'));
    roomArea.addEventListener('drop', async (e) => {
      e.preventDefault();
      roomArea.classList.remove('dragover');
      for (const file of e.dataTransfer.files) {
        if (file.type.startsWith('image/')) {
          await handleImageUpload(file, roomPreview, 'room');
        }
      }
    });
    roomInput.addEventListener('change', async () => {
      for (const file of roomInput.files) {
        await handleImageUpload(file, roomPreview, 'room');
      }
    });
  }
}

async function handleImageUpload(file, previewContainer, type) {
  const result = await uploadImage(file);
  if (result.success) {
    const imgDiv = document.createElement('div');
    imgDiv.className = 'image-preview-item';
    imgDiv.innerHTML = `
      <img src="${result.url}" alt="Photo" />
      <button type="button" class="remove-img" onclick="this.parentElement.remove()">×</button>
      <input type="hidden" name="${type}_images_new" value="${result.url}" />
    `;
    previewContainer.appendChild(imgDiv);
  }
}

// ===== DASHBOARD =====
function renderDashboard() {
  document.getElementById('totalRooms').textContent = data.hotel?.rooms?.length || 0;
  document.getElementById('totalTours').textContent = data.tours?.length || 0;
  document.getElementById('totalVisitors').textContent = (data.hotel?.visitor_count || 0).toLocaleString('ru-RU');
  
  const avgRating = data.tours?.length > 0
    ? (data.tours.reduce((sum, t) => sum + (t.rating || 0), 0) / data.tours.length).toFixed(1)
    : 0;
  document.getElementById('avgRating').textContent = avgRating;
  
  document.querySelectorAll('.action-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const action = btn.dataset.action;
      switch(action) {
        case 'addTour':
          document.querySelector('[data-section="tours"]').click();
          document.getElementById('addTourBtn').click();
          break;
        case 'addRoom':
          document.querySelector('[data-section="rooms"]').click();
          document.getElementById('addRoomBtn').click();
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
  
  container.innerHTML = rooms.map((room) => `
    <div class="room-item">
      <div class="room-image">
        ${room.images?.[0] ? `<img src="${room.images[0]}" alt="${room.name}" />` : '<span>🖼️</span>'}
      </div>
      <div class="room-content">
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
        ${room.images?.length ? `<div class="room-photo-count">📷 ${room.images.length} фото</div>` : ''}
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
  
  const form = document.getElementById('roomForm');
  const modal = document.getElementById('roomModal');
  const title = document.getElementById('roomModalTitle');
  
  form.reset();
  document.getElementById('roomImagePreview').innerHTML = '';
  
  title.textContent = 'Редактировать номер';
  form.querySelector('[name="id"]').value = room.id;
  form.querySelector('[name="name"]').value = room.name || '';
  form.querySelector('[name="price_from"]').value = room.price_from || 0;
  form.querySelector('[name="description"]').value = room.description || '';
  form.querySelector('[name="features"]').value = (room.features || []).join(', ');
  
  // Show existing images
  const preview = document.getElementById('roomImagePreview');
  (room.images || []).forEach(img => {
    const imgDiv = document.createElement('div');
    imgDiv.className = 'image-preview-item';
    imgDiv.innerHTML = `
      <img src="${img}" alt="Photo" />
      <button type="button" class="remove-img" onclick="this.parentElement.remove()">×</button>
      <input type="hidden" name="room_images_existing" value="${img}" />
    `;
    preview.appendChild(imgDiv);
  });
  
  modal.classList.add('active');
}

function addRoom() {
  const form = document.getElementById('roomForm');
  const modal = document.getElementById('roomModal');
  const title = document.getElementById('roomModalTitle');
  
  form.reset();
  document.getElementById('roomImagePreview').innerHTML = '';
  title.textContent = 'Добавить номер';
  form.querySelector('[name="id"]').value = '';
  modal.classList.add('active');
}

async function saveRoom() {
  const form = document.getElementById('roomForm');
  const formData = new FormData(form);
  const id = formData.get('id');
  
  // Get existing images from hidden inputs
  const existingImages = [];
  document.querySelectorAll('[name="room_images_existing"]').forEach(input => {
    if (input.value) existingImages.push(input.value);
  });
  
  // Get new uploaded images
  const newImages = [];
  document.querySelectorAll('[name="room_images_new"]').forEach(input => {
    if (input.value) newImages.push(input.value);
  });
  
  // Build room object - use simple fields only
  const room = {
    id: id || `room_${Date.now().toString(36)}`,
    name: formData.get('name') || 'Номер',
    price_from: parseInt(formData.get('price_from')) || 0,
    description: formData.get('description') || '',
    features: formData.get('features') ? formData.get('features').split(',').map(f => f.trim()).filter(f => f) : [],
    images: [...existingImages, ...newImages]
  };
  
  console.log('Saving room:', JSON.stringify(room, null, 2));
  
  try {
    if (id) {
      await apiPut(`/api/admin/rooms/${id}`, room);
      const index = data.hotel.rooms.findIndex(r => r.id === id);
      if (index >= 0) data.hotel.rooms[index] = room;
      console.log('Room updated successfully');
      alert('Номер обновлён!');
    } else {
      // Ensure rooms array exists
      if (!data.hotel.rooms) {
        data.hotel.rooms = [];
      }
      data.hotel.rooms.push(room);
      await apiPost('/api/admin/hotel', { rooms: data.hotel.rooms });
      console.log('Room added successfully');
      alert('Номер добавлен!');
    }
    
    renderRooms();
    renderDashboard();
    document.getElementById('roomModal').classList.remove('active');
  } catch (error) {
    console.error('Save room error:', error);
    alert('Ошибка сохранения: ' + (error.message || 'Проверьте консоль'));
  }
}

// ===== TOURS =====
function renderTours() {
  const categoryFilter = document.getElementById('tourCategoryFilter');
  if (categoryFilter) {
    categoryFilter.innerHTML = '<option value="">Все</option>' +
      data.categories.map(c => `<option value="${c.id}">${c.name}</option>`).join('');
  }
  
  renderToursTable(data.tours || []);
  
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
  
  tbody.innerHTML = tours.map((tour) => `
    <tr>
      <td><code>${tour.id?.substring(0, 8) || '-'}</code></td>
      <td>
        <strong>${tour.title || '-'}</strong>
        ${tour.images?.length ? `<br><small>📷 ${tour.images.length} фото</small>` : ''}
        ${tour.schedule?.length ? `<br><small>📅 ${tour.schedule.join(', ')}</small>` : ''}
      </td>
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
    tour.available = !tour.available;
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
  
  // Reset and fill form
  form.reset();
  document.getElementById('tourImagePreview').innerHTML = '';
  
  form.querySelector('[name="title"]').value = tour.title || '';
  form.querySelector('[name="price"]').value = tour.price || 0;
  form.querySelector('[name="duration"]').value = tour.duration || '';
  form.querySelector('[name="rating"]').value = tour.rating || 4.5;
  form.querySelector('[name="reviews_count"]').value = tour.reviews_count || 0;
  form.querySelector('[name="short_desc"]').value = tour.short_desc || '';
  form.querySelector('[name="description"]').value = tour.description || '';
  form.querySelector('[name="meeting_point"]').value = tour.meeting_point || '';
  form.querySelector('[name="group_size"]').value = tour.group_size || '';
  form.querySelector('[name="featured"]').checked = tour.featured || false;
  form.querySelector('[name="available"]').checked = tour.available !== false;
  
  // Schedule checkboxes
  const schedule = tour.schedule || [];
  form.querySelectorAll('[name="schedule"]').forEach(cb => {
    cb.checked = schedule.includes(cb.value);
  });
  
  // Highlights
  form.querySelector('[name="highlights"]').value = (tour.highlights || []).join(', ');
  
  // Existing images
  const preview = document.getElementById('tourImagePreview');
  (tour.images || []).forEach(img => {
    const imgDiv = document.createElement('div');
    imgDiv.className = 'image-preview-item';
    imgDiv.innerHTML = `
      <img src="${img}" alt="Photo" />
      <button type="button" class="remove-img" onclick="this.parentElement.remove()">×</button>
      <input type="hidden" name="tour_images_existing" value="${img}" />
    `;
    preview.appendChild(imgDiv);
  });
  
  form.dataset.editingId = id;
  modal.classList.add('active');
}

function openTourModal() {
  const form = document.getElementById('tourForm');
  const modal = document.getElementById('tourModal');
  
  form.querySelector('[name="category"]').innerHTML = 
    data.categories.map(c => `<option value="${c.id}">${c.name}</option>`).join('');
  
  form.reset();
  document.getElementById('tourImagePreview').innerHTML = '';
  delete form.dataset.editingId;
  modal.classList.add('active');
}

async function saveTour() {
  const form = document.getElementById('tourForm');
  const formData = new FormData(form);
  const editingId = form.dataset.editingId;
  
  // Get schedule
  const schedule = [];
  form.querySelectorAll('[name="schedule"]:checked').forEach(cb => {
    schedule.push(cb.value);
  });
  
  // Get highlights
  const highlights = formData.get('highlights') 
    ? formData.get('highlights').split(',').map(h => h.trim()).filter(h => h)
    : [];
  
  // Get images
  const existingImages = [];
  document.querySelectorAll('[name="tour_images_existing"]').forEach(input => {
    existingImages.push(input.value);
  });
  
  const newImages = [];
  document.querySelectorAll('[name="tour_images_new"]').forEach(input => {
    newImages.push(input.value);
  });
  
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
    images: [...existingImages, ...newImages],
    location: 'Дербент',
    schedule,
    highlights,
    meeting_point: formData.get('meeting_point') || '',
    group_size: parseInt(formData.get('group_size')) || 10
  };
  
  console.log('Saving tour:', tour);
  
  try {
    if (editingId) {
      await apiPut(`/api/admin/tours/${editingId}`, tour);
      const index = data.tours.findIndex(t => t.id === editingId);
      if (index >= 0) data.tours[index] = tour;
      console.log('Tour updated successfully');
      alert('Тур обновлён!');
    } else {
      await apiPost('/api/admin/tours', tour);
      data.tours.push(tour);
      console.log('Tour added successfully');
      alert('Тур добавлен!');
    }
    
    renderTours();
    renderDashboard();
    document.getElementById('tourModal').classList.remove('active');
  } catch (error) {
    console.error('Save tour error:', error);
    alert('Ошибка сохранения: ' + (error.message || 'Проверьте консоль'));
  }
}

// ===== CATEGORIES =====
function renderCategories() {
  const container = document.getElementById('categoriesList');
  if (!container) return;
  
  container.innerHTML = data.categories.map((cat) => `
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

// ===== REVIEWS =====
async function renderReviews() {
  try {
    data.reviews = await apiGet('/api/admin/reviews');
    
    const tbody = document.getElementById('reviewsTableBody');
    if (!tbody) return;
    
    tbody.innerHTML = data.reviews.map(review => `
      <tr>
        <td><code>${review.id?.substring(0, 8) || '-'}</code></td>
        <td><strong>${review.name || '-'}</strong></td>
        <td>⭐ ${review.rating || 5}</td>
        <td>${review.text?.substring(0, 50)}${review.text?.length > 50 ? '...' : ''}</td>
        <td>${review.type || '-'}</td>
        <td>${review.created_at ? new Date(review.created_at).toLocaleDateString('ru-RU') : '-'}</td>
        <td>
          <span class="status-badge ${review.status === 'approved' ? 'available' : review.status === 'rejected' ? 'unavailable' : 'pending'}">
            ${review.status === 'approved' ? 'Одобрен' : review.status === 'rejected' ? 'Отклонён' : 'На модерации'}
          </span>
        </td>
        <td>
          <div class="action-btns">
            ${review.status !== 'approved' ? `<button class="btn btn-sm" onclick="approveReview('${review.id}')" title="Одобрить">✅</button>` : ''}
            ${review.status !== 'rejected' ? `<button class="btn btn-sm" onclick="rejectReview('${review.id}')" title="Отклонить">❌</button>` : ''}
            <button class="btn btn-sm" onclick="deleteReview('${review.id}')" title="Удалить">🗑️</button>
          </div>
        </td>
      </tr>
    `).join('') || '<tr><td colspan="8" style="text-align: center; color: var(--gray);">Нет отзывов</td></tr>';
  } catch (error) {
    console.error('Reviews error:', error);
  }
}

async function approveReview(id) {
  try {
    await apiPut(`/api/admin/reviews/${id}/approve`, {});
    renderReviews();
    alert('Отзыв одобрен!');
  } catch (error) {
    alert('Ошибка');
  }
}

async function rejectReview(id) {
  try {
    await apiPut(`/api/admin/reviews/${id}/reject`, {});
    renderReviews();
    alert('Отзыв отклонён!');
  } catch (error) {
    alert('Ошибка');
  }
}

async function deleteReview(id) {
  if (confirm('Удалить отзыв?')) {
    try {
      await apiDelete(`/api/admin/reviews/${id}`);
      data.reviews = data.reviews.filter(r => r.id !== id);
      renderReviews();
      alert('Отзыв удалён!');
    } catch (error) {
      alert('Ошибка удаления');
    }
  }
}

// ===== SEO =====
function renderSeo() {
  const form = document.getElementById('seoForm');
  if (!form || !data.seo) return;
  
  const seo = data.seo || {};
  
  form.querySelector('[name="home_title"]').value = seo.home_title || '';
  form.querySelector('[name="home_description"]').value = seo.home_description || '';
  form.querySelector('[name="home_keywords"]').value = seo.home_keywords || '';
  form.querySelector('[name="tours_title"]').value = seo.tours_title || '';
  form.querySelector('[name="tours_description"]').value = seo.tours_description || '';
  form.querySelector('[name="rooms_title"]').value = seo.rooms_title || '';
  form.querySelector('[name="rooms_description"]').value = seo.rooms_description || '';
  
  document.getElementById('saveSeoBtn')?.addEventListener('click', async () => {
    const formData = new FormData(form);
    const updates = {
      home_title: formData.get('home_title'),
      home_description: formData.get('home_description'),
      home_keywords: formData.get('home_keywords'),
      tours_title: formData.get('tours_title'),
      tours_description: formData.get('tours_description'),
      rooms_title: formData.get('rooms_title'),
      rooms_description: formData.get('rooms_description')
    };
    
    try {
      await apiPost('/api/admin/seo', updates);
      Object.assign(data.seo, updates);
      alert('SEO настройки сохранены!');
    } catch (error) {
      alert('Ошибка сохранения');
    }
  });
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
  
  document.getElementById('roomForm')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    await saveRoom();
  });
  
  document.getElementById('categoryForm')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    await saveCategory();
  });
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
    reviews: data.reviews,
    seo: data.seo,
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
window.approveReview = approveReview;
window.rejectReview = rejectReview;
window.deleteReview = deleteReview;
window.exportData = exportData;

// Start
document.addEventListener('DOMContentLoaded', init);