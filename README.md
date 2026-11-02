# Project01 - Express Backend & WhatsApp Notification System

Aplikasi backend Node.js & Express.js yang dilengkapi dengan katalog etalase produk, autentikasi pengguna, integrasi notifikasi WhatsApp Gateway menggunakan Docker WAHA Core, serta sistem monitoring ketersediaan server eksternal (*External Watchdog*).

> 📄 **Laporan Lengkap Praktikum:** Silakan baca dokumen [LAPORAN_PRAKTIKUM.md](./LAPORAN_PRAKTIKUM.md) untuk dokumentasi lengkap dan tangkapan layar pengujian.

---

## 🚀 Fitur Utama

- **Backend Express.js MVC:** REST API & server-side rendering (EJS) untuk manajemen produk, kategori, dan autentikasi.
- **WhatsApp Gateway (WAHA Core):** Integrasi pesan WhatsApp otomatis menggunakan container Docker lokal (`devlikeapro/waha`).
- **Autentikasi & Reset Password OTP:** Pengiriman kode OTP 6-digit dengan masa aktif 5 menit via WhatsApp.
- **Health Check Endpoint:** Endpoint `/health` untuk memantau status aplikasi.
- **External Watchdog Monitoring (`scripts/watchdog.js`):** Pemantau independen dengan toleransi *fail threshold* (2x gagal ping) dan notifikasi status *real-time* ke WhatsApp Admin jika terjadi insiden *server down* maupun *server recovery*.

---

## 🛠️ Prasyarat

- Node.js (v18+)
- MySQL Database
- Docker & Docker Compose (untuk menjalankan container WAHA Core)

---

## 📦 Panduan Menjalankan

### 1. Jalankan Container WAHA Core
```bash
docker compose up -d
```
Akses dashboard WAHA pada peramban web di `http://127.0.0.1:3008` dan lakukan pemindaian (*scan*) QR code untuk menghubungkan nomor WhatsApp.

### 2. Pasang Dependensi
```bash
npm install
```

### 3. Konfigurasi Lingkungan (`.env`)
Salin file konfigurasi contoh:
```bash
cp .env.example .env
```
Sesuaikan variabel kredensial database MySQL, port aplikasi, dan kredensial WAHA.

### 4. Jalankan Server Express
```bash
npm start
```
Server Express akan berjalan pada `http://127.0.0.1:3000`.

### 5. Jalankan External Watchdog Monitoring
Pada terminal terpisah, jalankan monitoring watchdog:
```bash
npm run watchdog
```

---

## 📸 Dokumentasi & Hasil Pengujian

Seluruh tangkapan layar hasil pengujian tersimpan pada direktori [`docs/screenshots/`](./docs/screenshots/) dan dirangkum secara mendalam di [LAPORAN_PRAKTIKUM.md](./LAPORAN_PRAKTIKUM.md).
