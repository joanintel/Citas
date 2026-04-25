// assets/js/app.js - Clean fixed version, no double events
(function() {
  let appointments = [];
  let userName = "";
  let currentEditId = null;
  
  // Helper for mobile touch + click (prevents double firing)
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
  
  // Save name button - CLEAN
  const saveNameBtn = document.getElementById('saveNameBtn');
  if (saveNameBtn) {
    // Remove any existing listeners by cloning
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
  
  // Add button - CLEAN
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
  
  // Cancel modal - CLEAN
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
  
  // Save appointment - CLEAN
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
          <div class="empty-emoji">📅✨</div>
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
  
  function renderCard(app, isPast = false) {
    let d = new Date(app.date);
    let formatted = d.toLocaleDateString('es-ES', { weekday:'long', day:'numeric', month:'long' });
    let opacityStyle = isPast ? 'style="opacity:0.7;"' : '';
    
    return `
      <div class="card blue" data-id="${app.id}" ${opacityStyle}>
        <div class="card-row">
          <div class="icon">📅</div>
          <div class="details">
            <div class="date">${formatted}</div>
            <div class="time">⏰ ${app.time || "12:00"}</div>
            <div class="doctor">👤 ${escapeHtml(app.doctor)}</div>
            <div class="card-title" style="font-weight: bold; margin-top: 8px; font-size: 16px; color: #1a2342;">${escapeHtml(app.title)}</div>
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
  
  // Menu info button
  const menuBtn = document.getElementById('menuInfoBtn');
  if (menuBtn) {
    const newMenuBtn = menuBtn.cloneNode(true);
    menuBtn.parentNode.replaceChild(newMenuBtn, menuBtn);
    
    on(newMenuBtn, function() {
      alert(`📋 Mis Citas\nUsuario: ${userName || "invitado"}\nCitas guardadas: ${appointments.length}`);
    });
  }
  
  // Start the app
  loadData();
})();
