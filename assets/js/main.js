// assets/js/main.js (updated - remove icon selector from modal logic)
/**
 * MAIN MODULE: orchestrates security, authentication, appointment UI, PWA & session.
 * Handles first-run setup, PIN login, encrypted storage persistence.
 */

(function() {
  // Global state
  let currentKey = null;           // CryptoKey (never stored)
  let decryptedAppointments = [];   // raw appointments in memory
  let appManager = null;
  let cryptoVault = null;
  let currentUserName = "";
  
  // DOM elements
  const setupModal = document.getElementById("setupModal");
  const loginModal = document.getElementById("loginModal");
  const appointmentModal = document.getElementById("appointmentModal");
  const userGreetingSpan = document.getElementById("userGreeting");
  
  // ----- Helper: secure wipe memory -----
  function wipeSensitiveData() {
    if (currentKey) {
      currentKey = null;
    }
    if (decryptedAppointments) {
      if (Array.isArray(decryptedAppointments)) decryptedAppointments.length = 0;
      decryptedAppointments = [];
    }
    if (appManager) {
      appManager.appointments = [];
      appManager.render();
    }
    console.log("🧹 Memoria sensible limpiada");
  }
  
  // ----- Save appointments to encrypted vault -----
  async function persistEncryptedVault(appointmentsArray) {
    if (!currentKey) {
      console.warn("No hay clave activa, no se puede guardar");
      return false;
    }
    try {
      const vaultData = {
        userName: currentUserName,
        appointments: appointmentsArray
      };
      const encrypted = await cryptoVault.encryptData(vaultData, currentKey);
      localStorage.setItem("cita_vault", JSON.stringify({
        encrypted: encrypted,
        saltBase64: cryptoVault._arrayBufferToBase64(window._activeSalt)
      }));
      return true;
    } catch (err) {
      console.error("Error guardando vault:", err);
      return false;
    }
  }
  
  // ----- Load and decrypt vault (returns true if success)-----
  async function loadAndDecryptVault(pin, saltUint8) {
    const rawVault = localStorage.getItem("cita_vault");
    if (!rawVault) return false;
    const vault = JSON.parse(rawVault);
    if (!vault.encrypted) return false;
    
    const key = await cryptoVault.deriveKey(pin, saltUint8);
    try {
      const decrypted = await cryptoVault.decryptData(vault.encrypted, key);
      if (decrypted && typeof decrypted.userName === "string") {
        currentKey = key;
        currentUserName = decrypted.userName;
        decryptedAppointments = decrypted.appointments || [];
        if (appManager) {
          appManager.loadDecryptedData(decryptedAppointments);
        }
        updateGreeting();
        return true;
      }
      return false;
    } catch(e) {
      console.error("Fallo descifrado:", e);
      return false;
    }
  }
  
  // ----- First time setup -----
  async function firstTimeSetup(name, pin) {
    const salt = cryptoVault.generateSalt();
    window._activeSalt = salt;
    const key = await cryptoVault.deriveKey(pin, salt);
    currentKey = key;
    currentUserName = name;
    const emptyVault = {
      userName: name,
      appointments: []
    };
    const encrypted = await cryptoVault.encryptData(emptyVault, key);
    localStorage.setItem("cita_vault", JSON.stringify({
      encrypted: encrypted,
      saltBase64: cryptoVault._arrayBufferToBase64(salt)
    }));
    decryptedAppointments = [];
    if (appManager) appManager.loadDecryptedData([]);
    updateGreeting();
    return true;
  }
  
  // Check if first run (no vault exists)
  function isFirstRun() {
    return !localStorage.getItem("cita_vault");
  }
  
  // ----- Show/hide modals -----
  function showSetupModal() {
    setupModal.style.display = "flex";
    document.getElementById("setupName").value = "";
    document.getElementById("setupPin").value = "";
    document.getElementById("setupConfirmPin").value = "";
    document.getElementById("setupError").innerText = "";
  }
  
  function showLoginModal() {
    loginModal.style.display = "flex";
    document.getElementById("loginPin").value = "";
    document.getElementById("loginError").innerText = "";
    const storedMeta = localStorage.getItem("cita_vault");
    if (storedMeta) {
      try {
        const parsed = JSON.parse(storedMeta);
        if (parsed.saltBase64) {
          document.getElementById("loginGreeting").innerText = "Ingresa tu PIN de 4 dígitos";
        }
      } catch(e) {}
    }
  }
  
  function closeAllModals() {
    if (setupModal) setupModal.style.display = "none";
    if (loginModal) loginModal.style.display = "none";
    if (appointmentModal) appointmentModal.style.display = "none";
  }
  
  function updateGreeting() {
    if (currentUserName && userGreetingSpan) {
      userGreetingSpan.innerText = `👋 Hola, ${currentUserName}`;
    } else if (userGreetingSpan) {
      userGreetingSpan.innerText = "";
    }
  }
  
  // ----- Modal logic for new/edit appointment (SIMPLIFIED - no icon dropdown) -----
  let currentEditId = null;
  
  function openAppointmentModal(editApp = null) {
    if (!appointmentModal) return;
    currentEditId = editApp ? editApp.id : null;
    document.getElementById("appModalTitle").innerText = editApp ? "✏️ Editar cita" : "➕ Nueva cita";
    document.getElementById("appTitle").value = editApp ? (editApp.title || "") : "";
    document.getElementById("appDoctor").value = editApp ? (editApp.doctorName || "") : "";
    document.getElementById("appNotes").value = editApp ? (editApp.notes || "") : "";
    document.getElementById("appDate").value = editApp ? (editApp.dateRaw || "") : "";
    document.getElementById("appTime").value = editApp ? convertTimeToInput(editApp.time) : "10:00";
    appointmentModal.style.display = "flex";
  }
  
  function convertTimeToInput(time12h) {
    if (!time12h) return "10:00";
    const match = time12h.match(/(\d+):(\d+)\s*(AM|PM)/i);
    if (match) {
      let hour = parseInt(match[1]);
      const minute = match[2];
      const ampm = match[3].toUpperCase();
      if (ampm === 'PM' && hour !== 12) hour += 12;
      if (ampm === 'AM' && hour === 12) hour = 0;
      return `${hour.toString().padStart(2,'0')}:${minute}`;
    }
    return "10:00";
  }
  
  function formatTimeTo12hr(time24) {
    if (!time24) return "10:00 AM";
    const [hourStr, minute] = time24.split(':');
    let hour = parseInt(hourStr);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    let hour12 = hour % 12;
    if (hour12 === 0) hour12 = 12;
    return `${hour12}:${minute} ${ampm}`;
  }
  
  async function saveAppointmentFromModal() {
    const title = document.getElementById("appTitle").value.trim();
    if (!title) { alert("El título es obligatorio"); return; }
    const doctor = document.getElementById("appDoctor").value.trim();
    const notes = document.getElementById("appNotes").value.trim();
    const dateRaw = document.getElementById("appDate").value;
    if (!dateRaw) { alert("Selecciona una fecha"); return; }
    const time24 = document.getElementById("appTime").value;
    const time12 = formatTimeTo12hr(time24);
    
    const appointmentData = {
      title: title,
      doctorName: doctor || "Consultorio",
      notes: notes,
      dateRaw: dateRaw,
      time: time12,
      icon: "📅"  // Always use calendar icon
    };
    
    if (currentEditId) {
      appManager.updateAppointment(currentEditId, appointmentData);
    } else {
      appManager.addAppointment(appointmentData);
    }
    // save encrypted
    if (currentKey && appManager) {
      await persistEncryptedVault(appManager.appointments);
    }
    closeAllModals();
  }
  
  // ----- reset app (clear storage)-----
  function resetApp() {
    if (confirm("⚠️ REINICIAR BORRARÁ TODAS LAS CITAS Y CONFIGURACIÓN. ¿Continuar?")) {
      localStorage.removeItem("cita_vault");
      wipeSensitiveData();
      currentKey = null;
      currentUserName = "";
      if (appManager) appManager.loadDecryptedData([]);
      location.reload();
    }
  }
  
  // ----- INIT sequence -----
  async function init() {
    cryptoVault = new window.CryptoVault();
    appManager = new window.AppointmentManager(async (newApps) => {
      if (currentKey) {
        await persistEncryptedVault(newApps);
      }
    });
    window.appModule = { openEditModal: (app) => openAppointmentModal(app) };
    
    const firstRun = isFirstRun();
    if (firstRun) {
      showSetupModal();
      // setup event listeners
      document.getElementById("setupConfirmBtn").onclick = async () => {
        const name = document.getElementById("setupName").value.trim();
        const pin = document.getElementById("setupPin").value;
        const confirmPin = document.getElementById("setupConfirmPin").value;
        if (!name) { document.getElementById("setupError").innerText = "Ingresa tu nombre"; return; }
        if (!pin || !/^\d{4}$/.test(pin)) { document.getElementById("setupError").innerText = "PIN debe ser 4 dígitos"; return; }
        if (pin !== confirmPin) { document.getElementById("setupError").innerText = "Los PIN no coinciden"; return; }
        await firstTimeSetup(name, pin);
        closeAllModals();
        if (appManager) appManager.render();
        updateGreeting();
      };
    } else {
      // existing user: need login
      showLoginModal();
      document.getElementById("loginBtn").onclick = async () => {
        const enteredPin = document.getElementById("loginPin").value;
        if (!/^\d{4}$/.test(enteredPin)) {
          document.getElementById("loginError").innerText = "PIN inválido (4 dígitos)";
          return;
        }
        const storedVault = localStorage.getItem("cita_vault");
        if (!storedVault) { resetApp(); return; }
        const vault = JSON.parse(storedVault);
        const saltBase64 = vault.saltBase64;
        if (!saltBase64) { resetApp(); return; }
        const saltBytes = cryptoVault._base64ToArrayBuffer(saltBase64);
        const success = await loadAndDecryptVault(enteredPin, new Uint8Array(saltBytes));
        if (success) {
          closeAllModals();
          if (appManager) appManager.render();
        } else {
          document.getElementById("loginError").innerText = "PIN incorrecto. Intenta de nuevo.";
        }
      };
      document.getElementById("resetAppBtn").onclick = () => { resetApp(); };
    }
    
    // attach global modal buttons
    document.getElementById("openAddBtn")?.addEventListener("click", () => {
      if (!currentKey) { alert("Primero inicia sesión"); return; }
      currentEditId = null;
      openAppointmentModal(null);
    });
    document.getElementById("modalCancelBtn")?.addEventListener("click", () => closeAllModals());
    document.getElementById("modalSaveBtn")?.addEventListener("click", saveAppointmentFromModal);
    document.getElementById("menuInfoBtn")?.addEventListener("click", () => {
      alert(`📋 Agenda personal segura\nUsuario: ${currentUserName || "invitado"}\nCifrado local con PIN.`);
    });
    
    // session cleanup on page unload
    window.addEventListener("beforeunload", () => {
      wipeSensitiveData();
    });
    // optional visibility API
    document.addEventListener("visibilitychange", () => {
      if (document.hidden && currentKey) {
        console.log("Pestaña inactiva, datos cifrados en disco.");
      }
    });
  }
  
  window.addEventListener("DOMContentLoaded", init);
})();
