// script.js
// Aplikasi PAI Schedule - Utama

document.addEventListener('DOMContentLoaded', () => {
    console.log("PAI Schedule dimuat!");
    
    // Tempat logika aplikasi Anda berjalan
    // Pastikan ID 'root' ada di dalam index.html
    const root = document.getElementById('root');
    
    if (root) {
        // Di sini biasanya framework seperti React/Vite merender aplikasi Anda
        // Jika Anda hanya menggunakan HTML/JS murni, Anda bisa menambah konten di sini:
        root.innerHTML = `
            <div style="padding: 20px; text-align: center;">
                <h1>Selamat Datang di PAI Schedule</h1>
                <p>Aplikasi sedang berjalan dengan baik.</p>
            </div>
        `;
    }
});
