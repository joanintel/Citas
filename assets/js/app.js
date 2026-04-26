// assets/js/app.js - with menu and theme
(function() {
  let appointments = [];
  let userName = "";
  let currentEditId = null;
  
  function on(el, handler) {
    if (!el) return;
    let isProcessing = false;
    
    const wrappedHandler = function(e) {
      e.preventDefault();
      if (isProcessing) return;
      isProcessing = true;
      handler(e);
      setTimeout(() => { isProcessing = false; }, 300);
    };
    
    el.removeEventListener('click', wrappedHandler);
    el.removeEventListener('touchstart', wrappedHandler);
    el.addEventListener('click', wrappedHandler);
    el.addEventListener('touchstart', wrappedHandler);
  }
  
  // Theme handling
  function initTheme() {
    const savedTheme = localStorage.getItem('theme');
    const themeToggle = document.getElementById('themeToggle');
    
    if (savedTheme === 'dark') {
      document.body.classList.add('dark-mode');
      if (themeToggle) themeToggle.checked = true;
    }
    
    if (themeToggle) {
      themeToggle.addEventListener('change', function() {
        if (this.checked) {
          document.body.classList.add('dark-mode');
          localStorage.setItem('theme', 'dark');
        } else {
          document.body.classList.remove('dark-mode');
          localStorage.setItem('theme', 'light');
        }
      });
    }
  }
  
  // Menu handling
  function initMenu() {
    const menuIcon = document.getElementById('menuIcon');
    const menuPanel = document.getElementById('menuPanel');
    const menuOverlay = document.getElementById('menuOverlay');
    const closeMenuBtn = document.getElementById('closeMenuBtn');
    
    function openMenu() {
      if (menuPanel) menuPanel.classList.add('open');
    }
    
    function closeMenu() {
      if (menuPanel) menuPanel.classList.remove('open');
    }
    

    // Make closeMenu available globally for calendar
    window.closeMenu = closeMenu;

    if (menuIcon) on(menuIcon, openMenu);
    if (menuOverlay) on(menuOverlay, closeMenu);
    if (closeMenuBtn) on(closeMenuBtn, closeMenu);
  }
  
  function loadData() {
    let savedName = localStorage.getItem('mis_citas_name');
    let savedApps = localStorage.getItem('mis_citas_appointments');
    
    if (savedName) {
      userName = savedName;
      const greeting = document.getElementById('userGreeting');
      if (greeting) greeting.innerText = '👋 Hola, ' + userName;
      
      if (savedApps) {
        appointments = JSON.parse(savedApps);
      } else {
        appointments = [];
      }
      
      const nameModal = document.getElementById('nameModal');
      if (nameModal) nameModal.style.display = 'none';
      render();
      return true;
    } else {
      const nameModal = document.getElementById('nameModal');
      if (nameModal) nameModal.style.display = 'flex';
      return false;
    }
  }
  
  function saveData() {
    localStorage.setItem('mis_citas_name', userName);
    localStorage.setItem('mis_citas_appointments', JSON.stringify(appointments));
  }
  
  const saveNameBtn = document.getElementById('saveNameBtn');
  if (saveNameBtn) {
    const newSaveBtn = saveNameBtn.cloneNode(true);
    saveNameBtn.parentNode.replaceChild(newSaveBtn, saveNameBtn);
    
    on(newSaveBtn, function(e) {
      e.stopPropagation();
      let name = document.getElementById('userName').value.trim();
      let error = document.getElementById('nameError');
      
      if (!name) { 
        if (error) error.innerText = "Ingresa tu nombre"; 
        return; 
      }
      
      userName = name;
      saveData();
      
      const greeting = document.getElementById('userGreeting');
      if (greeting) greeting.innerText = '👋 Hola, ' + name;
      
      const nameModal = document.getElementById('nameModal');
      if (nameModal) nameModal.style.display = 'none';
      render();
    });
  }
  
  const addBtn = document.getElementById('openAddBtn');
  if (addBtn) {
    const newAddBtn = addBtn.cloneNode(true);
    addBtn.parentNode.replaceChild(newAddBtn, addBtn);
    
    on(newAddBtn, function(e) {
      e.stopPropagation();
      currentEditId = null;
      const modalTitle = document.getElementById('appModalTitle');
      const titleInput = document.getElementById('appTitle');
      const doctorInput = document.getElementById('appDoctor');
      const notesInput = document.getElementById('appNotes');
      const dateInput = document.getElementById('appDate');
      const timeInput = document.getElementById('appTime');
      
      if (modalTitle) modalTitle.innerText = '➕ Nueva cita';
      if (titleInput) titleInput.value = '';
      if (doctorInput) doctorInput.value = '';
      if (notesInput) notesInput.value = '';
      if (dateInput) dateInput.value = new Date().toISOString().split('T')[0];
      if (timeInput) timeInput.value = '10:00';
      
      const appModal = document.getElementById('appointmentModal');
      if (appModal) appModal.style.display = 'flex';
    });
  }
  
  const cancelBtn = document.getElementById('modalCancelBtn');
  if (cancelBtn) {
    const newCancelBtn = cancelBtn.cloneNode(true);
    cancelBtn.parentNode.replaceChild(newCancelBtn, cancelBtn);
    
    on(newCancelBtn, function(e) {
      e.stopPropagation();
      const appModal = document.getElementById('appointmentModal');
      if (appModal) appModal.style.display = 'none';
    });
  }
  
  const saveBtn = document.getElementById('modalSaveBtn');
  if (saveBtn) {
    const newSaveBtn = saveBtn.cloneNode(true);
    saveBtn.parentNode.replaceChild(newSaveBtn, saveBtn);
    
    on(newSaveBtn, function(e) {
      e.stopPropagation();
      let title = document.getElementById('appTitle').value.trim();
      if (!title) { 
        alert("El título es obligatorio"); 
        return; 
      }
      
      let doctor = document.getElementById('appDoctor').value.trim() || "Consultorio";
      let notes = document.getElementById('appNotes').value.trim();
      let date = document.getElementById('appDate').value;
      if (!date) { 
        alert("Selecciona una fecha"); 
        return; 
      }
      let time = document.getElementById('appTime').value;
      
      let app = {
        id: currentEditId || Date.now(),
        title: title,
        doctor: doctor,
        notes: notes,
        date: date,
        time: time
      };
      
      if (currentEditId) {
        let index = appointments.findIndex(a => a.id === currentEditId);
        if (index !== -1) appointments[index] = app;
      } else {
        appointments.push(app);
      }
      
      saveData();
      const appModal = document.getElementById('appointmentModal');
      if (appModal) appModal.style.display = 'none';
      render();
    });
  }
  
  window.editApp = function(id) {
    let app = appointments.find(a => a.id === id);
    if (!app) return;
    currentEditId = id;
    const modalTitle = document.getElementById('appModalTitle');
    const titleInput = document.getElementById('appTitle');
    const doctorInput = document.getElementById('appDoctor');
    const notesInput = document.getElementById('appNotes');
    const dateInput = document.getElementById('appDate');
    const timeInput = document.getElementById('appTime');
    
    if (modalTitle) modalTitle.innerText = '✏️ Editar cita';
    if (titleInput) titleInput.value = app.title;
    if (doctorInput) doctorInput.value = app.doctor;
    if (notesInput) notesInput.value = app.notes || '';
    if (dateInput) dateInput.value = app.date;
    if (timeInput) timeInput.value = app.time;
    
    const appModal = document.getElementById('appointmentModal');
    if (appModal) appModal.style.display = 'flex';
  };
  
  window.deleteApp = function(id) {
    if (confirm("¿Eliminar esta cita?")) {
      appointments = appointments.filter(a => a.id !== id);
      saveData();
      render();
    }
  };
  
  function render() {
    let container = document.getElementById('appointmentsList');
    if (!container) return;
    
    let today = new Date().toISOString().split('T')[0];
    
    let future = appointments.filter(a => a.date >= today).sort((a,b) => a.date.localeCompare(b.date));
    let past = appointments.filter(a => a.date < today).sort((a,b) => b.date.localeCompare(a.date));
    
    if (appointments.length === 0) {
      container.innerHTML = `
        <div class="empty-state">
          <div class="empty-emoji">🗓️✨</div>
          <div class="section-title" style="margin-bottom: 8px;">No hay citas</div>
          <p style="color: #6c7a9e; font-size: 14px;">Toca "+ Nueva cita" para agregar</p>
        </div>
      `;
      return;
    }
    
    let html = '';
    
    if (future.length > 0) {
      html += `
        <div class="section-header">
          <div class="section-title">Próximas citas</div>
          <div class="badge-count">${future.length}</div>
        </div>
      `;
      future.forEach(app => { html += renderCard(app); });
    }
    
    if (past.length > 0) {
      html += `<div class="past-section">`;
      html += `
        <div class="section-header" style="margin-top: 16px;">
          <div class="section-title">Historial / Pasadas</div>
          <div class="badge-count">${past.length}</div>
        </div>
      `;
      past.forEach(app => { html += renderCard(app, true); });
      html += `</div>`;
    }
    
    container.innerHTML = html;
  }
  


function getUrgencyColor(dateStr, isPast) {
  if (isPast) return 'gray';
  
  let today = new Date();
  today.setHours(0, 0, 0, 0);
  
  let dateParts = dateStr.split('-');
  let appointmentDate = new Date(dateParts[0], dateParts[1] - 1, dateParts[2]);
  appointmentDate.setHours(0, 0, 0, 0);
  
  let diffTime = appointmentDate - today;
  let diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  
  if (diffDays === 0) return 'red';
  if (diffDays === 1) return 'orange';
  if (diffDays <= 3) return 'yellow';
  if (diffDays <= 7) return 'green';
  return 'blue';
}


function renderCard(app, isPast = false) {
  // Create date properly
  let dateParts = app.date.split('-');
  let d = new Date(dateParts[0], dateParts[1] - 1, dateParts[2]);
  
  // Spanish formatting
  const diasSemana = ['domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado'];
  const meses = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];
  
  let diaSemana = diasSemana[d.getDay()];
  let diaNumero = d.getDate();
  let mes = meses[d.getMonth()];
  
  let formatted = `${diaSemana}, ${diaNumero} de ${mes}`;
  
  // Get color based on urgency
  let cardClass = getUrgencyColor(app.date, isPast);
  
  return `
    <div class="card ${cardClass}" data-id="${app.id}" style="${isPast ? 'opacity:0.7;' : ''}">
      <div class="card-row">
        <div class="icon">🗓️</div>
        <div class="details">
          <div class="date">${formatted}</div>
          <div class="time">⏰ ${app.time || "12:00"}</div>
          <div class="doctor">📌 ${escapeHtml(app.doctor)}</div>
          <div class="card-title">${escapeHtml(app.title)}</div>
          ${app.notes ? `<div class="notes">📝 ${escapeHtml(app.notes.substring(0, 60))}${app.notes.length > 60 ? '…' : ''}</div>` : ''}
        </div>
        <div class="card-actions">
          <div class="arrow-btn edit-btn-colored" onclick="editApp(${app.id})" title="Editar">✎</div>
          <div class="delete-icon delete-btn-colored" onclick="deleteApp(${app.id})" title="Eliminar">🗑️</div>
        </div>
      </div>
    </div>
  `;
}

  
  function escapeHtml(str) {
    if (!str) return '';
    return str.replace(/[&<>]/g, function(m) {
      if (m === '&') return '&amp;';
      if (m === '<') return '&lt;';
      if (m === '>') return '&gt;';
      return m;
    });
  }
  
  // Calendar functionality
  let currentCalendarYear = new Date().getFullYear();
  let currentCalendarMonth = new Date().getMonth();
  let selectedAppointmentForView = null;
  
  function getUrgencyColorForDate(dateStr) {
    let today = new Date();
    today.setHours(0, 0, 0, 0);
    let dateParts = dateStr.split('-');
    let appointmentDate = new Date(dateParts[0], dateParts[1] - 1, dateParts[2]);
    appointmentDate.setHours(0, 0, 0, 0);
    
    if (appointmentDate < today) return 'gray';
    
    let diffDays = Math.ceil((appointmentDate - today) / (1000 * 60 * 60 * 24));
    if (diffDays === 0) return 'red';
    if (diffDays === 1) return 'orange';
    if (diffDays <= 3) return 'yellow';
    if (diffDays <= 7) return 'green';
    return 'blue';
  }
  
  function getAppointmentsForDate(dateStr) {
    return appointments.filter(a => a.date === dateStr);
  }
  
  function openCalendarModal() {
    const modal = document.getElementById('calendarModal');
    if (modal) modal.style.display = 'flex';
    renderCalendar();
  }
  
  function closeCalendarModal() {
    const modal = document.getElementById('calendarModal');
    if (modal) modal.style.display = 'none';
  }
  
  function renderCalendar() {
    const monthNames = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
    document.getElementById('calendarMonthYear').innerText = `${monthNames[currentCalendarMonth]} ${currentCalendarYear}`;
    
    const firstDay = new Date(currentCalendarYear, currentCalendarMonth, 1);
    const startDayOfWeek = firstDay.getDay(); // 0 = Sunday
    // Adjust to Monday first (0 = Monday)
    let startOffset = startDayOfWeek === 0 ? 6 : startDayOfWeek - 1;
    
    const daysInMonth = new Date(currentCalendarYear, currentCalendarMonth + 1, 0).getDate();
    
    const grid = document.getElementById('calendarDaysGrid');
    grid.innerHTML = '';
    
    // Empty cells for days before month starts
    for (let i = 0; i < startOffset; i++) {
      const emptyCell = document.createElement('div');
      emptyCell.className = 'calendar-day empty';
      emptyCell.innerText = '';
      grid.appendChild(emptyCell);
    }
    
    // Days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      const dateStr = `${currentCalendarYear}-${String(currentCalendarMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      const dayApps = getAppointmentsForDate(dateStr);
      const dayDiv = document.createElement('div');
      dayDiv.className = 'calendar-day';
      dayDiv.innerText = day;
      
      if (dayApps.length === 0) {
        dayDiv.classList.add('empty');
      } else {
        const urgencyColor = getUrgencyColorForDate(dateStr);
        dayDiv.classList.add(urgencyColor);
      }
      
      dayDiv.onclick = (function(d, apps) {
        return function() {
          if (apps.length > 0) {
            showDayAppointmentsList(d, apps);
          }
        };
      })(day, dayApps);
      
      grid.appendChild(dayDiv);
    }
  }
  


  function showDayAppointmentsList(day, apps) {
    if (apps.length === 1) {
      // If only one appointment, show it directly
      showViewAppointmentModal(apps[0]);
    } else if (apps.length > 1) {
      // If multiple, show a simple selection modal
      showAppointmentListModal(day, apps);
    }
  }
  
  function showAppointmentListModal(day, apps) {
    // Create temporary selection modal
    const dateStr = `${currentCalendarYear}-${String(currentCalendarMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    
    let listHtml = `
      <div style="max-height: 400px; overflow-y: auto;">
        <div style="text-align: center; margin-bottom: 20px;">
          <div style="font-size: 24px;">🗓️</div>
          <strong>${formatDateSpanish(dateStr)}</strong>
        </div>
    `;
    
    apps.forEach((app, idx) => {
      const urgencyColor = getUrgencyColorForDate(app.date);
      listHtml += `
        <div class="appointment-list-item" data-id="${app.id}" style="
          padding: 12px;
          margin-bottom: 10px;
          background: ${getLightColorForUrgency(urgencyColor)};
          border-radius: 16px;
          cursor: pointer;
          transition: transform 0.1s;
        ">
          <div style="font-weight: bold;">${escapeHtml(app.title)}</div>
          <div style="font-size: 13px; opacity: 0.8;">⏰ ${app.time || '--:--'} | 📍 ${escapeHtml(app.doctor)}</div>
        </div>
      `;
    });
    
    listHtml += `</div><div class="modal-buttons" style="margin-top: 16px;"><button id="closeListModalBtn" class="cancel-btn">Cerrar</button></div>`;
    
    // Create modal overlay
    const existingModal = document.getElementById('tempListModal');
    if (existingModal) existingModal.remove();
    
    const tempModal = document.createElement('div');
    tempModal.id = 'tempListModal';
    tempModal.className = 'modal-overlay';
    tempModal.style.display = 'flex';
    tempModal.innerHTML = `<div class="modal-card" style="max-width: 320px;">${listHtml}</div>`;
    document.body.appendChild(tempModal);
    
    // Add click handlers
    document.querySelectorAll('.appointment-list-item').forEach(el => {
      el.addEventListener('click', (e) => {
        const id = parseInt(el.dataset.id);
        const app = appointments.find(a => a.id === id);
        if (app) {
          tempModal.remove();
          showViewAppointmentModal(app);
        }
      });
    });
    
    document.getElementById('closeListModalBtn')?.addEventListener('click', () => tempModal.remove());
    
    // Close on overlay click
    tempModal.addEventListener('click', (e) => {
      if (e.target === tempModal) tempModal.remove();
    });
  }
  
  function getLightColorForUrgency(color) {
    switch(color) {
      case 'red': return '#ffebee';
      case 'orange': return '#fff3e0';
      case 'yellow': return '#fffde7';
      case 'green': return '#e8f5e9';
      case 'blue': return '#e3f2fd';
      default: return '#f5f5f5';
    }
  }
  
  function showViewAppointmentModal(app) {
    selectedAppointmentForView = app;
    const modal = document.getElementById('viewAppointmentModal');
    if (!modal) return;
    
    document.getElementById('viewTitle').innerText = app.title;
    document.getElementById('viewDate').innerText = formatDateSpanish(app.date);
    document.getElementById('viewTime').innerText = app.time || 'No especificada';
    document.getElementById('viewDoctor').innerText = app.doctor || 'No especificado';
    document.getElementById('viewNotes').innerText = app.notes || 'Sin notas';
    
    modal.style.display = 'flex';
  }
  
  function formatDateSpanish(dateStr) {
    let parts = dateStr.split('-');
    let d = new Date(parts[0], parts[1] - 1, parts[2]);
    const diasSemana = ['domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado'];
    const meses = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];
    return `${diasSemana[d.getDay()]}, ${d.getDate()} de ${meses[d.getMonth()]} ${d.getFullYear()}`;
  }
  
  function closeViewModal() {
    const modal = document.getElementById('viewAppointmentModal');
    if (modal) modal.style.display = 'none';
  }
  
  function editFromView() {
    if (selectedAppointmentForView) {
      closeViewModal();
      closeCalendarModal();
      // Trigger edit
      currentEditId = selectedAppointmentForView.id;
      const modalTitle = document.getElementById('appModalTitle');
      const titleInput = document.getElementById('appTitle');
      const doctorInput = document.getElementById('appDoctor');
      const notesInput = document.getElementById('appNotes');
      const dateInput = document.getElementById('appDate');
      const timeInput = document.getElementById('appTime');
      
      if (modalTitle) modalTitle.innerText = '✏️ Editar cita';
      if (titleInput) titleInput.value = selectedAppointmentForView.title;
      if (doctorInput) doctorInput.value = selectedAppointmentForView.doctor;
      if (notesInput) notesInput.value = selectedAppointmentForView.notes || '';
      if (dateInput) dateInput.value = selectedAppointmentForView.date;
      if (timeInput) timeInput.value = selectedAppointmentForView.time;
      
      const appModal = document.getElementById('appointmentModal');
      if (appModal) appModal.style.display = 'flex';
    }
  }
  
  // Add menu calendar option
  const calendarOption = document.getElementById('calendarOption');
  if (calendarOption) {
    on(calendarOption, function(e) {
      e.stopPropagation();
      closeMenu(); // Close menu panel
      openCalendarModal();
    });
  }
  
  // Calendar navigation
  const prevBtn = document.getElementById('prevMonthBtn');
  const nextBtn = document.getElementById('nextMonthBtn');
  const closeCalendar = document.getElementById('closeCalendarBtn');
  
  if (prevBtn) {
    on(prevBtn, function() {
      currentCalendarMonth--;
      if (currentCalendarMonth < 0) {
        currentCalendarMonth = 11;
        currentCalendarYear--;
      }
      renderCalendar();
    });
  }
  
  if (nextBtn) {
    on(nextBtn, function() {
      currentCalendarMonth++;
      if (currentCalendarMonth > 11) {
        currentCalendarMonth = 0;
        currentCalendarYear++;
      }
      renderCalendar();
    });
  }
  
  if (closeCalendar) on(closeCalendar, closeCalendarModal);
  
  // View modal buttons
  const closeViewBtn1 = document.getElementById('closeViewModalBtn');
  const closeViewBtn2 = document.getElementById('closeViewBtn');
  const editFromViewBtn = document.getElementById('editFromViewBtn');
  
  if (closeViewBtn1) on(closeViewBtn1, closeViewModal);
  if (closeViewBtn2) on(closeViewBtn2, closeViewModal);
  if (editFromViewBtn) on(editFromViewBtn, editFromView);
  
  // Close calendar when clicking overlay
  const calendarOverlay = document.getElementById('calendarModal');
  if (calendarOverlay) {
    calendarOverlay.addEventListener('click', function(e) {
      if (e.target === calendarOverlay) closeCalendarModal();
    });
  }
  
  const viewOverlay = document.getElementById('viewAppointmentModal');
  if (viewOverlay) {
    viewOverlay.addEventListener('click', function(e) {
      if (e.target === viewOverlay) closeViewModal();
    });
  }

  initTheme();
  initMenu();
  loadData();
})();
