// Register Service Worker
if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('/sw.js')
        .then(() => console.log("Service Worker berhasil didaftarkan"))
        .catch(err => console.log("Gagal mendaftar Service Worker", err));
}

// 1. Logika Navigasi Halaman
document.querySelectorAll('.nav-link').forEach(button => {
    button.addEventListener('click', () => {
        const target = button.getAttribute('data-target');
        console.log("Navigasi ke menu: " + target);
        // Di sini Anda bisa memanggil fungsi untuk mengganti isi konten
    });
});

// 2. Logika Install PWA 
let deferredPrompt;
const installBtn = document.getElementById('btn-install');

// Sembunyikan tombol saat pertama kali load
installBtn.style.display = 'none'; 

window.addEventListener('beforeinstallprompt', (e) => {
    // Mencegah browser menampilkan prompt otomatis
    e.preventDefault();
    deferredPrompt = e;
    
    // Tampilkan tombol karena aplikasi bisa di-install
    installBtn.style.display = 'block'; 
});

installBtn.addEventListener('click', () => {
    if (deferredPrompt) {
        deferredPrompt.prompt();
        deferredPrompt.userChoice.then((choiceResult) => {
            if (choiceResult.outcome === 'accepted') {
                console.log('Aplikasi di-install');
            }
            deferredPrompt = null;
            installBtn.style.display = 'none'; // Sembunyikan setelah di-klik
        });
    }
});
