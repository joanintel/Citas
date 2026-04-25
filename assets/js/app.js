// assets/js/app.js
/**
 * Appointment Manager - handles CRUD, sorting (closest first), and rendering
 * Works with decrypted in-memory data; calls back to main for encrypted storage.
 */

class AppointmentManager {
  constructor(onDataChanged) {
    this.appointments = [];       // decrypted appointments in memory
    this.onDataChanged = onDataChanged; // callback to save encrypted vault
  }

  // Load decrypted data into memory (called after login)
  loadDecryptedData(data) {
    this.appointments = Array.isArray(data) ? data : [];
    this.sortAppointments();
    this.render();
  }

  // Get active (future & today) appointments only, sorted by closest
  getActiveAppointments() {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const filtered = this.appointments.filter(app => {
      if (!app.dateRaw) return false;
      const appDate = new Date(app.dateRaw);
      appDate.setHours(0, 0, 0, 0);
      return appDate >= today;
    });
    
    // sort by date ascending (closest first)
    filtered.sort((a, b) => {
      if (!a.dateRaw) return 1;
      if (!b.dateRaw) return -1;
      return a.dateRaw.localeCompare(b.dateRaw);
    });
    
    return filtered;
  }
  
  // Past appointments (optional for extra section)
  getPastAppointments() {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const past = this.appointments.filter(app => {
      if (!app.dateRaw) return false;
      const appDate = new Date(app.dateRaw);
      appDate.setHours(0, 0, 0, 0);
      return appDate < today;
    });
    past.sort((a, b) => b.dateRaw.localeCompare(a.dateRaw)); // recent past first
    return past;
  }

  sortAppointments() {
    // simple in-place sort reference
    this.appointments.sort((a, b) => {
      if (!a.dateRaw) return 1;
      if (!b.dateRaw) return -1;
      return a.dateRaw.localeCompare(b.dateRaw);
    });
  }

  addAppointment(appointment) {
    const newId = Date.now().toString() + '-' + Math.random().toString(36).substr(2, 6);
    const newApp = {
      id: newId,
      title: appointment.title || "Cita",
      doctorName: appointment.doctorName || "",
      notes: appointment.notes || "",
      dateRaw: appointment.dateRaw,
      time: appointment.time || "12:00 PM",
      icon: appointment.icon || "📅",
      category: this._getCategoryFromIcon(appointment.icon || "📅")
    };
    this.appointments.push(newApp);
    this.sortAppointments();
    this.render();
    if (this.onDataChanged) this.onDataChanged(this.appointments);
    return newApp;
  }

  updateAppointment(id, updatedFields) {
    const index = this.appointments.findIndex(a => a.id === id);
    if (index !== -1) {
      this.appointments[index] = {
        ...this.appointments[index],
        title: updatedFields.title !== undefined ? updatedFields.title : this.appointments[index].title,
        doctorName: updatedFields.doctorName !== undefined ? updatedFields.doctorName : this.appointments[index].doctorName,
        notes: updatedFields.notes !== undefined ? updatedFields.notes : this.appointments[index].notes,
        dateRaw: updatedFields.dateRaw || this.appointments[index].dateRaw,
        time: updatedFields.time || this.appointments[index].time,
        icon: updatedFields.icon || this.appointments[index].icon,
        category: this._getCategoryFromIcon(updatedFields.icon || this.appointments[index].icon)
      };
      this.sortAppointments();
      this.render();
      if (this.onDataChanged) this.onDataChanged(this.appointments);
      return true;
    }
    return false;
  }

  deleteAppointment(id) {
    this.appointments = this.appointments.filter(a => a.id !== id);
    this.sortAppointments();
    this.render();
    if (this.onDataChanged) this.onDataChanged(this.appointments);
  }

  _getCategoryFromIcon(icon) {
    if (icon === '🦷') return 'dental';
    if (icon === '❤️') return 'heart';
    return 'general';
  }

  // Helper: format date for UI
  formatDateFromRaw(dateRaw) {
    if (!dateRaw) return "Fecha no definida";
    const parts = dateRaw.split("-");
    if (parts.length === 3) {
      const [year, month, day] = parts;
      const dateObj = new Date(year, month-1, day);
      return dateObj.toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' }).replace(/^\w/, c => c.toUpperCase());
    }
    return dateRaw;
  }

  // Render the whole UI (active + past optional)
  render() {
    const container = document.getElementById("appointmentsList");
    if (!container) return;
    
    const active = this.getActiveAppointments();
    const past = this.getPastAppointments();
    
    if (this.appointments.length === 0) {
      container.innerHTML = `
        <div class="empty-state">
          <div class="empty-emoji">📆✨</div>
          <div class="section-title" style="margin-bottom: 8px;">No hay citas</div>
          <p style="color: #6c7a9e; font-size: 14px;">Toca "+ Nueva cita" para recordar tus eventos</p>
        </div>
      `;
      return;
    }
    
    let html = `
      <div class="section-header">
        <div class="section-title">Próximas citas</div>
        <div class="badge-count">${active.length}</div>
      </div>
    `;
    
    if (active.length === 0 && past.length > 0) {
      html += `<div class="empty-state" style="padding:20px;"><div class="empty-emoji">✅</div><p style="color:#6c7a9e;">No hay citas próximas. ¡Todas están en el pasado!</p></div>`;
    } else {
      active.forEach(app => {
        html += this._renderCard(app);
      });
    }
    
    if (past.length > 0) {
      html += `<div class="past-section"><div class="section-header" style="margin-top: 16px;"><div class="section-title">Historial / Pasadas</div><div class="badge-count">${past.length}</div></div>`;
      past.forEach(app => {
        html += this._renderCard(app, true);
      });
      html += `</div>`;
    }
    
    container.innerHTML = html;
    
    // attach event listeners
    document.querySelectorAll('.edit-appointment').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const id = btn.getAttribute('data-id');
        this._triggerEdit(id);
      });
    });
    document.querySelectorAll('.delete-icon').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const id = btn.getAttribute('data-id');
        if (confirm("¿Eliminar esta cita?")) {
          this.deleteAppointment(id);
        }
      });
    });
  }
  
  _renderCard(app, isPast = false) {
    const formattedDate = this.formatDateFromRaw(app.dateRaw);
    const cardClass = this._getCardClass(app);
    const iconEmoji = app.icon || "📅";
    const displayDoctor = app.doctorName || "Profesional";
    const notesPreview = app.notes ? app.notes.substring(0, 60) : "";
    const opacityStyle = isPast ? 'style="opacity:0.7;"' : '';
    
    return `
      <div class="card ${cardClass}" data-id="${app.id}" ${opacityStyle}>
        <div class="card-row">
          <div class="icon">${iconEmoji}</div>
          <div class="details">
            <div class="date">${formattedDate}</div>
            <div class="time">⏰ ${app.time || "12:00"}</div>
            <div class="doctor">👤 ${this._escapeHtml(displayDoctor)}</div>
            ${notesPreview ? `<div class="notes">📝 ${this._escapeHtml(notesPreview)}${app.notes.length > 60 ? '…' : ''}</div>` : ''}
          </div>
          <div class="card-actions">
            <div class="arrow-btn edit-appointment" data-id="${app.id}" title="Editar">✎</div>
            <div class="delete-icon" data-id="${app.id}" title="Eliminar">🗑️</div>
          </div>
        </div>
      </div>
    `;
  }
  
  _getCardClass(app) {
    if (app.category === 'dental') return 'green';
    if (app.category === 'heart') return 'yellow';
    return 'blue';
  }
  
  _escapeHtml(str) {
    if (!str) return '';
    return str.replace(/[&<>]/g, function(m) {
      if (m === '&') return '&amp;';
      if (m === '<') return '&lt;';
      if (m === '>') return '&gt;';
      return m;
    });
  }
  
  _triggerEdit(id) {
    const app = this.appointments.find(a => a.id === id);
    if (app && window.appModule && window.appModule.openEditModal) {
      window.appModule.openEditModal(app);
    } else {
      console.warn("Edit modal not ready");
    }
  }
}

window.AppointmentManager = AppointmentManager;
