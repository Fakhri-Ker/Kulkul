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

// Metadata untuk memperbarui teks judul dan subjudul di Global Header secara otomatis
const pageMeta = {
    'page-dashboard': { title: 'Dashboard', subtitle: 'Selamat datang kembali!' },
    'page-tugas': { title: 'Manajemen Tugas', subtitle: 'Kelola semua tugas kuliah' },
    'page-jadwal': { title: 'Jadwal Kuliah', subtitle: 'Daftar mata kuliah mingguan' },
    'page-catatan': { title: 'Catatan Belajar', subtitle: 'Simpan materi penting kuliah' },
    'page-timer': { title: 'Timer Belajar (Pomodoro)', subtitle: 'Fokus belajar dengan metode interval' },
    'page-sholat': { title: 'Waktu Sholat', subtitle: 'Jadwal ibadah harian untuk wilayah Anda' }
};


/* ==========================================================================
   BAGIAN 2: NAVIGASI SINGLE PAGE APPLICATION (SPA) GLOBAL
   ========================================================================== */
document.addEventListener('DOMContentLoaded', () => {
    const menuItems = document.querySelectorAll('.menu li');
    const navLinks = document.querySelectorAll('.nav-link');
    const pages = document.querySelectorAll('.page-content');
    
    const mainTitle = document.getElementById('main-title');
    const mainSubtitle = document.getElementById('main-subtitle');

    // Fungsi utama perpindahan halaman
    function navigateTo(targetId) {
        // Sembunyikan semua halaman konten
        pages.forEach(page => page.classList.add('hidden'));
        
        // Tampilkan halaman target yang dipilih
        const targetPage = document.getElementById(targetId);
        if (targetPage) {
            targetPage.classList.remove('hidden');
        }

        // Perbarui teks di Global Header berdasarkan halaman aktif
        if (pageMeta[targetId] && mainTitle && mainSubtitle) {
            mainTitle.textContent = pageMeta[targetId].title;
            mainSubtitle.textContent = pageMeta[targetId].subtitle;
        }

        // Sinkronisasi status class 'active' pada menu Sidebar
        menuItems.forEach(item => {
            item.classList.remove('active');
            if (item.getAttribute('data-target') === targetId) {
                item.classList.add('active');
            }
        });
    }

    // Event Listener untuk klik menu di Sidebar
    menuItems.forEach(item => {
        item.addEventListener('click', () => {
            const target = item.getAttribute('data-target');
            navigateTo(target);
        });
    });

    // Event Listener untuk tombol pintasan (Quick Access) di Halaman Dashboard
    navLinks.forEach(link => {
        link.addEventListener('click', () => {
            const target = link.getAttribute('data-target');
            navigateTo(target);
        });
    });

    // Inisialisasi awal fitur-fitur aplikasi saat dimuat
    updateDateTime();
    setInterval(updateDateTime, 1000); // Sinkronisasi jam real-time setiap 1 detik
    renderTasks();
    updateDashboardStats();
    initTheme();
    initCustomMatkulField(); // Jalankan listener deteksi pilihan "Lainnya"
});


/* ==========================================================================
   BAGIAN 3: WAKTU & TANGGAL REAL-TIME (WIB)
   ========================================================================== */
function updateDateTime() {
    const now = new Date();
    
    // Format Jam: HH.MM.SS
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    const seconds = String(now.getSeconds()).padStart(2, '0');
    const timeString = `${hours}.${minutes}.${seconds}`;

    // Format Tanggal Terjemahan Indonesia
    const options = { weekday: 'long', day: 'numeric', month: 'short', year: 'numeric' };
    const dateString = now.toLocaleDateString('id-ID', options);

    const datetimeEl = document.querySelector('.datetime');
    if (datetimeEl) {
        datetimeEl.textContent = `${timeString} | ${dateString}`;
    }
}


/* ==========================================================================
   BAGIAN 4: DETEKSI FORM DROPDOWN MATA KULIAH "LAINNYA"
   ========================================================================== */
function initCustomMatkulField() {
    const selectMatkul = document.getElementById('task-matkul');
    const customMatkulGroup = document.getElementById('custom-matkul-group');
    
    if (selectMatkul && customMatkulGroup) {
        selectMatkul.addEventListener('change', () => {
            // Jika memilih opsi 'Lainnya', buka kolom input teks baru
            if (selectMatkul.value === 'Lainnya') {
                customMatkulGroup.classList.remove('hidden');
            } else {
                // Sembunyikan dan kosongkan jika memilih mata kuliah bawaan
                customMatkulGroup.classList.add('hidden');
                document.getElementById('task-matkul-custom').value = '';
            }
        });
    }
}


/* ==========================================================================
   BAGIAN 5: LOGIKA MANAJEMEN TUGAS (CRUD)
   ========================================================================== */
const btnShowForm = document.getElementById('btn-show-form');
const btnCancelForm = document.getElementById('btn-cancel-form');
const formTugas = document.getElementById('form-tambah-tugas');
const emptyState = document.getElementById('empty-task-state');

// Buka Formulir Tambah Tugas
if (btnShowForm && formTugas && emptyState) {
    btnShowForm.addEventListener('click', () => {
        formTugas.classList.remove('hidden');
        emptyState.classList.add('hidden');
    });
}

// Batal / Tutup Formulir Tambah Tugas
if (btnCancelForm && formTugas) {
    btnCancelForm.addEventListener('click', () => {
        formTugas.classList.add('hidden');
        if (tasks.length === 0) {
            emptyState.classList.remove('hidden');
        }
    });
}

// Menyimpan Data Tugas Baru ke Database Lokal
const btnSaveTask = document.getElementById('btn-save-task');
if (btnSaveTask) {
    btnSaveTask.addEventListener('click', (e) => {
        e.preventDefault();

        const judul = document.getElementById('task-title').value.trim();
        let matkul = document.getElementById('task-matkul').value;
        const matkulCustom = document.getElementById('task-matkul-custom').value.trim();
        const deadline = document.getElementById('task-deadline').value;
        const prioritas = document.getElementById('task-priority').value;
        const kategori = document.getElementById('task-category').value;
        const status = document.getElementById('task-status').value;
        const deskripsi = document.getElementById('task-desc').value.trim();

        // Validasi input form primer
        if (!judul || matkul === "Pilih Mata Kuliah") {
            alert("Harap isi Judul Tugas dan pilih Mata Kuliah!");
            return;
        }

        // Logika penentuan nilai jika memilih opsi kustom 'Lainnya'
        if (matkul === 'Lainnya') {
            if (!matkulCustom) {
                alert("Harap ketik manual nama mata kuliah baru Anda!");
                return;
            }
            matkul = matkulCustom; // Gunakan teks input manual dari user
        }

        // Membuat data objek terstruktur tugas baru
        const newTask = {
            id: Date.now(),
            judul,
            matkul,
            deadline,
            prioritas,
            kategori,
            status,
            deskripsi
        };

        // Masukkan ke array utama dan perbarui localStorage browser
        tasks.push(newTask);
        localStorage.setItem('pai_tasks', JSON.stringify(tasks));

        // Reset ulang isi form ke pengaturan awal (Clear Form)
        document.getElementById('task-title').value = '';
        document.getElementById('task-matkul').selectedIndex = 0;
        document.getElementById('task-matkul-custom').value = '';
        document.getElementById('custom-matkul-group').classList.add('hidden');
        document.getElementById('task-deadline').value = '';
        document.getElementById('task-priority').selectedIndex = 1; // Default Sedang
        document.getElementById('task-category').selectedIndex = 0;
        document.getElementById('task-status').selectedIndex = 0;
        document.getElementById('task-desc').value = '';

        formTugas.classList.add('hidden');
        
        // Segarkan antarmuka visual (Render Ulang)
        renderTasks();
        updateDashboardStats();
    });
}

// Menampilkan Data List Tugas Secara Dinamis
function renderTasks() {
    const existingList = document.getElementById('task-list-container');
    if (existingList) existingList.remove();

    if (tasks.length === 0) {
        if (emptyState) emptyState.classList.remove('hidden');
        return;
    }

    if (emptyState) emptyState.classList.add('hidden');

    const listContainer = document.createElement('div');
    listContainer.id = 'task-list-container';
    listContainer.className = 'task-list-wrapper';

    tasks.forEach(task => {
        const taskCard = document.createElement('div');
        taskCard.className = 'task-item-card';

        // Stuktur struktur HTML Card Tugas yang terintegrasi dengan class CSS Dark Mode
        taskCard.innerHTML = `
            <div class="task-card-info">
                <h4>${task.judul}</h4>
                <p>📚 <strong>${task.matkul}</strong> | 📅 Deadline: ${task.deadline || '-'} | 🏷️ ${task.kategori}</p>
                <span class="badge badge-priority ${task.prioritas.toLowerCase()}">${task.prioritas}</span>
                <span class="badge badge-status">${task.status}</span>
            </div>
            <div class="task-card-actions">
                <button onclick="toggleTaskStatus(${task.id})" class="btn-secondary btn-sm">✔️ Selesai</button>
                <button onclick="deleteTask(${task.id})" class="btn-secondary btn-sm btn-danger">🗑️</button>
            </div>
        `;
        listContainer.appendChild(taskCard);
    });

    document.getElementById('page-tugas').appendChild(listContainer);
}

// Shortcut Mengubah Status Tugas Cepat
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

// Menghapus data tugas dari list
window.deleteTask = function(id) {
    if (confirm("Apakah Anda yakin ingin menghapus tugas ini?")) {
        tasks = tasks.filter(task => task.id !== id);
        localStorage.setItem('pai_tasks', JSON.stringify(tasks));
        renderTasks();
        updateDashboardStats();
    }
};


/* ==========================================================================
   BAGIAN 6: SINKRONISASI STATISTIK KE DASHBOARD
   ========================================================================== */
function updateDashboardStats() {
    const totalTugas = tasks.length;
    const selesai = tasks.filter(t => t.status === 'Selesai').length;
    const aktif = totalTugas - selesai;
    
    // Menghitung status terlambat (Jika tanggal melampaui hari ini dan belum selesai)
    const hariIni = new Date().toISOString().split('T')[0];
    const terlambat = tasks.filter(t => t.deadline && t.deadline < hariIni && t.status !== 'Selesai').length;

    const statCards = document.querySelectorAll('.stat-card');
    if (statCards.length >= 4) {
        statCards[0].innerHTML = `${aktif} <span>Tugas Aktif</span>`;
        statCards[1].innerHTML = `${selesai} <span>Selesai</span>`;
        statCards[2].innerHTML = `${terlambat} <span>Terlambat</span>`;
        statCards[3].innerHTML = `0 <span>Jadwal Hari Ini</span>`; // Integrasi jadwal kuliah mendatang
    }

    // Mengalkulasi persentase Progress Bar pada Banner Utama
    const progressPercent = totalTugas > 0 ? Math.round((selesai / totalTugas) * 100) : 0;
    const progressBar = document.querySelector('.progress-bar');
    const progressText = document.querySelector('.banner small');
    
    if (progressBar) progressBar.style.width = `${progressPercent}%`;
    if (progressText) progressText.textContent = `${progressPercent}% tugas selesai`;
}


/* ==========================================================================
   BAGIAN 7: LOGIKA TIMER BELAJAR (POMODORO)
   ========================================================================== */
const timerDisplay = document.querySelector('.timer-display');
const btnStartTimer = document.querySelector('.timer-card .btn-primary');
const btnResetTimer = document.querySelector('.timer-card .btn-secondary');

if (btnStartTimer && btnResetTimer && timerDisplay) {
    btnStartTimer.addEventListener('click', () => {
        if (isTimerRunning) {
            // Jeda Jalannya Timer (Pause)
            clearInterval(timerInterval);
            btnStartTimer.textContent = 'Mulai';
            btnStartTimer.style.backgroundColor = '#16a34a'; // Kembalikan ke warna hijau semula
            isTimerRunning = false;
        } else {
            // Memulai Hitung Mundur Waktu (Start)
            isTimerRunning = true;
            btnStartTimer.textContent = 'Jeda';
            btnStartTimer.style.backgroundColor = '#f59e0b'; // Ubah warna jadi jingga saat beroperasi
            
            timerInterval = setInterval(() => {
                if (timerSeconds === 0) {
                    if (timerMinutes === 0) {
                        // Sesi Selesai Berakhir
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
   BAGIAN 8: DARK & LIGHT THEME TOGGLE GLOBAL (PERSISTEN)
   ========================================================================== */
function initTheme() {
    const themeBtn = document.getElementById('theme-toggle');
    const savedTheme = localStorage.getItem('pai_theme') || 'light';
    
    // Periksa apakah preferensi tersimpan adalah dark-theme
    if (savedTheme === 'dark') {
        document.body.classList.add('dark-theme');
        if (themeBtn) themeBtn.textContent = '☀️'; // Tukar ikon jadi matahari jika mode malam aktif
    }

    if (themeBtn) {
        themeBtn.addEventListener('click', () => {
            document.body.classList.toggle('dark-theme');
            const isDark = document.body.classList.contains('dark-theme');
            themeBtn.textContent = isDark ? '☀️' : '🌙';
            
            // Simpan status pilihan terakhir agar saat refresh tidak kembali ke awal
            localStorage.setItem('pai_theme', isDark ? 'dark' : 'light');
        });
    }
}
