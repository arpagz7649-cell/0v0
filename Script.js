// =========================================================================
// SCRIPT CHAT MASTER - ENGINE UTAMA (CLIENT-SIDE)
// =========================================================================

// 1. INISIALISASI KONEKSI DENGAN AUTO-RECONNECT
const socket = io({
    reconnection: true,             // Otomatis nyambung lagi kalau WiFi putus
    reconnectionAttempts: 10,       // Maksimal coba nyambung 10 kali
    reconnectionDelay: 2000         // Jeda 2 detik tiap mau nyambung ulang
});

// 2. AMBIL SEMUA ELEMEN HTML YANG DIBUTUHKAN
const elLayarChat = document.getElementById('layar-chat');
const elFormChat  = document.getElementById('form-chat');
const elInputMsg  = document.getElementById('input-pesan');
const elStatus    = document.getElementById('status-koneksi'); // Tambahan UI

// 3. IDENTITAS & STATE MASTER
let namaMaster = prompt("Masukkan identitas lu:") || "User_" + Math.floor(Math.random() * 9999);
let sedangNgetik = false;
let timeoutNgetik;

// =========================================================================
// BAGIAN A: PENGIRIMAN DATA KE SERVER
// =========================================================================

// Event saat tombol "Kirim" ditekan atau tekan Enter
elFormChat.addEventListener('submit', (e) => {
    e.preventDefault(); 
    
    let teksMentah = elInputMsg.value.trim();
    
    if (teksMentah !== "") {
        // Tembak paket data lengkap ke server
        socket.emit('kirim_pesan', {
            sender: namaMaster,
            teks: teksMentah,
            timestamp: new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })
        });
        
        // Reset input dan indikator ngetik
        elInputMsg.value = ''; 
        socket.emit('berhenti_ngetik', namaMaster);
    }
});

// Event mendeteksi lu lagi ngetik buat dikasih tahu ke HP adik lu
elInputMsg.addEventListener('input', () => {
    if (!sedangNgetik) {
        sedangNgetik = true;
        socket.emit('sedang_ngetik', namaMaster);
    }
    clearTimeout(timeoutNgetik);
    timeoutNgetik = setTimeout(() => {
        sedangNgetik = false;
        socket.emit('berhenti_ngetik', namaMaster);
    }, 1500); // Kalau 1.5 detik nggak neken tombol, status ngetik hilang
});

// =========================================================================
// BAGIAN B: PENERIMAAN DATA DARI SERVER
// =========================================================================

// Terima pesan masuk (dari lu sendiri atau dari adik lu)
socket.on('terima_pesan', (data) => {
    const boxPesan = document.createElement('div');
    const isMe = data.sender === namaMaster;
    
    // Klasifikasi kelas CSS biar gampang diatur warnanya nanti
    boxPesan.className = isMe ? "pesan master-kanan" : "pesan tamu-kiri";
    
    // Fitur Keamanan Dasar: Sanitasi HTML untuk cegah bug tampilan
    let teksAman = data.teks.replace(/</g, "&lt;").replace(/>/g, "&gt;");

    boxPesan.innerHTML = `
        <div class="header-pesan">
            <strong>${isMe ? "Lu Sendiri" : data.sender}</strong> 
            <span class="waktu">${data.timestamp}</span>
        </div>
        <div class="isi-pesan">${teksAman}</div>
    `;

    elLayarChat.appendChild(boxPesan);
    scrollToBottom();
});

// Terima notifikasi sistem (Ada yang masuk/keluar)
socket.on('pesan_sistem', (notif) => {
    const boxSistem = document.createElement('div');
    boxSistem.className = "pesan-sistem";
    boxSistem.innerText = `[SISTEM]: ${notif}`;
    elLayarChat.appendChild(boxSistem);
    scrollToBottom();
});

// =========================================================================
// BAGIAN C: MANAJEMEN KONEKSI (MENGATASI ERROR JARINGAN)
// =========================================================================

socket.on('connect', () => {
    if(elStatus) elStatus.innerText = "🟢 Terhubung ke Server";
});

socket.on('disconnect', () => {
    if(elStatus) elStatus.innerText = "🔴 Terputus! Mencoba nyambung lagi...";
    const peringatan = document.createElement('div');
    peringatan.className = "pesan-sistem error";
    peringatan.innerText = "[WARNING]: Koneksi internet lu putus!";
    elLayarChat.appendChild(peringatan);
});

// Fungsi pembantu biar layar otomatis turun ke bawah
function scrollToBottom() {
    elLayarChat.scrollTop = elLayarChat.scrollHeight;
      }
