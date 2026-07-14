/* ==========================================================================
   BAGIAN 1: INITIAL STATE & LOCAL STORAGE (PENYIMPANAN DATA)
   ========================================================================== */
// Mengambil data tugas dari localStorage (jika ada) atau membuat array kosong jika belum ada
let tasks = JSON.parse(localStorage.getItem('pai_tasks')) || [];

// State untuk Timer Belajar (Pomodoro)
let timerInterval = null;
let timerMinutes = 25;
let timerSeconds = 0;
let isTimerRunning = false;


/* ==========================================================================
   BAGIAN 2: NAVIGASI SINGLE PAGE APPLICATION (SPA)
   ========================================================================== */
document.addEventListener('DOMContentLoaded', () => {
    const menuItems = document.querySelectorAll('.menu li');
    const navLinks = document.querySelectorAll('.nav-link');
    const pages = document.querySelectorAll('.page-content');

    // Fungsi untuk berpindah halaman
    function navigateTo(targetId) {
        // Sembunyikan semua halaman
        pages.forEach(page => page.classList.add('hidden'));
        
        // Tampilkan halaman target
        const targetPage = document.getElementById(targetId);
        if (targetPage) {
            targetPage.classList.remove('hidden');
        }

        // Perbarui status aktif di Sidebar Menu
        menuItems.forEach(item => {
            item.classList.remove('active');
            if (item.getAttribute('data-target') === targetId) {
                item.classList.add('active');
            }
        });
    }

    // Event Listener untuk menu Sidebar
    menuItems.forEach(item => {
        item.addEventListener('click', () => {
            const target = item.getAttribute('data-target');
            navigateTo(target);
        });
    });

    // Event Listener untuk tombol pintasan (Quick Access) di Dashboard
    navLinks.forEach(link => {
        link.addEventListener('click', () => {
            const target = link.getAttribute('data-target');
            navigateTo(target);
        });
    });

    // Inisialisasi awal saat aplikasi dibuka
    updateDateTime();
    setInterval(updateDateTime, 1000); // Jalankan jam real-time setiap detik
    renderTasks(); // Tampilkan daftar tugas
    updateDashboardStats(); // Hitung ulang statistik di Dashboard
    initTheme(); // Setel tema (Gelap/Terang)
});


/* ==========================================================================
   BAGIAN 3: WAKTU & TANGGAL REAL-TIME (WIB)
   ========================================================================== */
function updateDateTime() {
    const now = new Date();
    
    // Format Waktu: HH.MM.SS
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    const seconds = String(now.getSeconds()).padStart(2, '0');
    const timeString = `${hours}.${minutes}.${seconds}`;

    // Format Tanggal Indonesia
    const options = { weekday: 'long', day: 'numeric', month: 'short', year: 'numeric' };
    const dateString = now.toLocaleDateString('id-ID', options);

    // Update semua elemen pengingat waktu di header tiap halaman
    document.querySelectorAll('.datetime').forEach(el => {
        el.textContent = `${timeString} | ${dateString}`;
    });
}


/* ==========================================================================
   BAGIAN 4: LOGIKA MANAJEMEN TUGAS
   ========================================================================== */
const btnShowForm = document.getElementById('btn-show-form');
const btnCancelForm = document.getElementById('btn-cancel-form');
const formTugas = document.getElementById('form-tambah-tugas');
const emptyState = document.getElementById('empty-task-state');

// Toggle Tampilkan / Sembunyikan Form
if (btnShowForm && formTugas && emptyState) {
    btnShowForm.addEventListener('click', () => {
        formTugas.classList.remove('hidden');
        emptyState.classList.add('hidden');
    });
}

if (btnCancelForm && formTugas) {
    btnCancelForm.addEventListener('click', () => {
        formTugas.classList.add('hidden');
        if (tasks.length === 0) {
            emptyState.classList.remove('hidden');
        }
    });
}

// Logika Menyimpan Tugas Baru
const saveButton = formTugas?.querySelector('.btn-primary');
if (saveButton) {
    saveButton.addEventListener('click', (e) => {
        e.preventDefault();

        // Mengambil nilai input dari formulir
        const judul = formTugas.querySelector('input[type="text"]').value.trim();
        const matkul = formTugas.querySelectorAll('select')[0].value;
        const deadline = formTugas.querySelector('input[type="date"]').value;
        const prioritas = formTugas.querySelectorAll('select')[1].value;
        const kategori = formTugas.querySelectorAll('select')[2].value;
        const status = formTugas.querySelectorAll('select')[3].value;
        const deskripsi = formTugas.querySelector('textarea').value.trim();

        // Validasi input wajib isi
        if (!judul || matkul === "Pilih Mata Kuliah") {
            alert("Harap isi Judul Tugas dan pilih Mata Kuliah!");
            return;
        }

        // Membuat objek tugas baru
        const newTask = {
            id: Date.now(), // ID Unik menggunakan timestamp
            judul,
            matkul,
            deadline,
            prioritas,
            kategori,
            status,
            deskripsi
        };

        // Simpan ke array state dan localStorage
        tasks.push(newTask);
        localStorage.setItem('pai_tasks', JSON.stringify(tasks));

        // Reset form & sembunyikan kembali
        formTugas.querySelector('input[type="text"]').value = '';
        formTugas.querySelectorAll('select')[0].selectedIndex = 0;
        formTugas.querySelector('input[type="date"]').value = '';
        formTugas.querySelectorAll('select')[1].selectedIndex = 1; // Default: Sedang
        formTugas.querySelectorAll('select')[2].selectedIndex = 0; // Default: Tugas
        formTugas.querySelectorAll('select')[3].selectedIndex = 0; // Default: Belum Dikerjakan
        formTugas.querySelector('textarea').value = '';

        formTugas.classList.add('hidden');

        // Perbarui UI
        renderTasks();
        updateDashboardStats();
    });
}

// Menampilkan daftar tugas ke halaman HTML
function renderTasks() {
    // Hapus element list tugas lama jika ada sebelum me-render ulang
    const existingList = document.getElementById('task-list-container');
    if (existingList) existingList.remove();

    if (tasks.length === 0) {
        emptyState.classList.remove('hidden');
        return;
    }

    emptyState.classList.add('hidden');

    // Membuat container list baru
    const listContainer = document.createElement('div');
    listContainer.id = 'task-list-container';
    listContainer.style.display = 'flex';
    listContainer.style.flexDirection = 'column';
    listContainer.style.gap = '15px';
    listContainer.style.marginTop = '20px';

    tasks.forEach(task => {
        const taskCard = document.createElement('div');
        taskCard.className = 'task-item-card';
        taskCard.style.cssText = `
            background: white;
            padding: 20px;
            border-radius: 12px;
            border: 1px solid #e2e8f0;
            display: flex;
            justify-content: space-between;
            align-items: center;
        `;

        taskCard.innerHTML = `
            <div>
                <h4 style="margin: 0 0 5px 0; color: #0f172a; font-size: 1.1rem;">${task.judul}</h4>
                <p style="margin: 0; font-size: 0.85rem; color: #64748b;">
                    📚 <strong>${task.matkul}</strong> | 📅 Deadline: ${task.deadline || '-'} | 🏷️ ${task.kategori}
                </p>
                <span style="
                    display: inline-block; 
                    margin-top: 8px; 
                    padding: 4px 10px; 
                    font-size: 0.75rem; 
                    font-weight: 700; 
                    border-radius: 6px;
                    background-color: ${task.prioritas === 'Tinggi' ? '#fef2f2' : task.prioritas === 'Sedang' ? '#fffbeb' : '#f0fdf4'};
                    color: ${task.prioritas === 'Tinggi' ? '#ef4444' : task.prioritas === 'Sedang' ? '#f59e0b' : '#16a34a'};
                ">${task.prioritas}</span>
                <span style="
                    display: inline-block; 
                    margin-top: 8px; 
                    margin-left: 5px;
                    padding: 4px 10px; 
                    font-size: 0.75rem; 
                    font-weight: 700; 
                    border-radius: 6px;
                    background-color: ${task.status === 'Selesai' ? '#f0fdf4' : task.status === 'Sedang Dikerjakan' ? '#eff6ff' : '#f8fafc'};
                    color: ${task.status === 'Selesai' ? '#16a34a' : task.status === 'Sedang Dikerjakan' ? '#3b82f6' : '#64748b'};
                ">${task.status}</span>
            </div>
            <div style="display: flex; gap: 8px;">
                <button onclick="toggleTaskStatus(${task.id})" class="btn-secondary" style="padding: 8px 12px; font-size: 0.8rem;">✔️ Selesai</button>
                <button onclick="deleteTask(${task.id})" class="btn-secondary" style="padding: 8px 12px; font-size: 0.8rem; border-color: #fca5a5; color: #ef4444;">🗑️</button>
            </div>
        `;

        listContainer.appendChild(taskCard);
    });

    document.getElementById('page-tugas').appendChild(listContainer);
}

// Fungsi mengubah status tugas cepat (Klik ✔️ Selesai)
window.toggleTaskStatus = function(id) {
    tasks = tasks.map(task => {
        if (task.id === id) {
            task.status = task.status === 'Selesai' ? 'Belum Dikerjakan' : 'Selesai';
        }
        return task;
    });
    localStorage.setItem('pai_tasks', JSON.stringify(tasks));
    renderTasks();
    updateDashboardStats();
};

// Fungsi menghapus tugas
window.deleteTask = function(id) {
    if (confirm("Apakah Anda yakin ingin menghapus tugas ini?")) {
        tasks = tasks.filter(task => task.id !== id);
        localStorage.setItem('pai_tasks', JSON.stringify(tasks));
        renderTasks();
        updateDashboardStats();
    }
};


/* ==========================================================================
   BAGIAN 5: SINKRONISASI STATISTIK KE DASHBOARD
   ========================================================================== */
function updateDashboardStats() {
    const totalTugas = tasks.length;
    const selesai = tasks.filter(t => t.status === 'Selesai').length;
    const aktif = totalTugas - selesai;
    
    // Simulasi Terlambat (jika tenggat waktu melampaui hari ini dan belum selesai)
    const hariIni = new Date().toISOString().split('T')[0];
    const terlambat = tasks.filter(t => t.deadline && t.deadline < hariIni && t.status !== 'Selesai').length;

    // Update Kotak Statistik di Dashboard
    const statCards = document.querySelectorAll('.stat-card');
    if (statCards.length >= 4) {
        statCards[0].childNodes[0].textContent = aktif + " ";
        statCards[1].childNodes[0].textContent = selesai + " ";
        statCards[2].childNodes[0].textContent = terlambat + " ";
        statCards[3].childNodes[0].textContent = "0 "; // Sementara untuk Jadwal
    }

    // Hitung progress bar hijau di Banner Dashboard
    const progressPercent = totalTugas > 0 ? Math.round((selesai / totalTugas) * 100) : 0;
    const progressBar = document.querySelector('.progress-bar');
    const progressText = document.querySelector('.banner small');
    
    if (progressBar) progressBar.style.width = `${progressPercent}%`;
    if (progressText) progressText.textContent = `${progressPercent}% tugas selesai`;
}


/* ==========================================================================
   BAGIAN 6: LOGIKA TIMER BELAJAR (POMODORO)
   ========================================================================== */
const timerDisplay = document.querySelector('.timer-display');
const btnStartTimer = document.querySelector('.timer-controls .btn-primary');
const btnResetTimer = document.querySelector('.timer-controls .btn-secondary');

if (btnStartTimer && btnResetTimer && timerDisplay) {
    btnStartTimer.addEventListener('click', () => {
        if (isTimerRunning) {
            // Pause Timer
            clearInterval(timerInterval);
            btnStartTimer.textContent = 'Mulai';
            btnStartTimer.style.backgroundColor = '#16a34a';
            isTimerRunning = false;
        } else {
            // Start Timer
            isTimerRunning = true;
            btnStartTimer.textContent = 'Jeda';
            btnStartTimer.style.backgroundColor = '#f59e0b'; // Ganti warna jadi orange saat berjalan
            
            timerInterval = setInterval(() => {
                if (timerSeconds === 0) {
                    if (timerMinutes === 0) {
                        // Timer Selesai!
                        clearInterval(timerInterval);
                        alert("Waktu belajar selesai! Istirahatlah sejenak.");
                        resetTimer();
                        return;
                    }
                    timerMinutes--;
                    timerSeconds = 59;
                } else {
                    timerSeconds--;
                }
                updateTimerDisplay();
            }, 1000);
        }
    });

    btnResetTimer.addEventListener('click', resetTimer);
}

function resetTimer() {
    clearInterval(timerInterval);
    timerMinutes = 25;
    timerSeconds = 0;
    isTimerRunning = false;
    if (btnStartTimer) {
        btnStartTimer.textContent = 'Mulai';
        btnStartTimer.style.backgroundColor = '#16a34a';
    }
    updateTimerDisplay();
}

function updateTimerDisplay() {
    const mins = String(timerMinutes).padStart(2, '0');
    const secs = String(timerSeconds).padStart(2, '0');
    if (timerDisplay) timerDisplay.textContent = `${mins}:${secs}`;
}


/* ==========================================================================
   BAGIAN 7: DARK & LIGHT THEME TOGGLE
   ========================================================================== */
function initTheme() {
    const themeBtn = document.querySelector('header .btn-icon:nth-child(2)'); // Tombol 🌙
    
    // Periksa preferensi tema yang tersimpan sebelumnya
    const savedTheme = localStorage.getItem('pai_theme') || 'light';
    if (savedTheme === 'dark') {
        document.body.classList.add('dark-theme');
        if (themeBtn) themeBtn.textContent = '☀️';
    }

    if (themeBtn) {
        themeBtn.addEventListener('click', () => {
            document.body.classList.toggle('dark-theme');
            const isDark = document.body.classList.contains('dark-theme');
            themeBtn.textContent = isDark ? '☀️' : '🌙';
            localStorage.setItem('pai_theme', isDark ? 'dark' : 'light');
        });
    }
}
