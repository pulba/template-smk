# Panduan Instalasi & Deployment

Tutorial ini menjelaskan langkah-langkah untuk menginstal dan men-deploy template website sekolah ini, mulai dari persiapan akun hingga deployment ke Cloudflare.

## 1. Persiapan Akun & Tools

Pastikan Anda memiliki akun dan tools berikut:
- **GitHub Account**: Untuk menyimpan kode sumber.
- **Cloudflare Account**: Untuk hosting website (Pages).
- **TinaCMS Account**: Untuk manajemen konten (CMS).
- **Turso Account**: Untuk database (menyimpan data admin/session).
- **Node.js**: (Minimal v18) Terinstal di komputer Anda.
- **Git**: Terinstal di komputer Anda.

## 2. Setup GitHub & Push Code

1.  Buat **Repository Baru** di GitHub (misal: `web-sekolah-baru`), biarkan kosong (jangan inisialisasi dengan README).
2.  Buka terminal di folder project ini.
3.  Jalankan perintah berikut:
    ```bash
    git init
    git add .
    git commit -m "Initial commit"
    git branch -M main
    git remote add origin https://github.com/USERNAME_ANDA/web-sekolah-baru.git
    git push -u origin main
    ```

## 3. Setup Turso Database

1.  Login ke [Turso](https://turso.tech/).
2.  Buat database baru via CLI atau Dashboard.
3.  Ambil **Database URL** dan **Auth Token**.
    - Jika via CLI: `turso db show --url <nama-db>` dan `turso db tokens create <nama-db>`.
4.  Simpan kredensial ini untuk tahap Env Vars nanti.

## 4. Setup TinaCMS

1.  Login ke [Tina Cloud](https://app.tina.io/).
2.  Buat Project baru dan hubungkan dengan repository GitHub Anda.
3.  Salin **Client ID** dan **Token** (Content (Read-only) Token is fine for public, but usually you need a proper token for rw).
4.  Update file `tina/config.ts` jika perlu, atau (lebih baik) gunakan Environment Variables.

## 5. Konfigurasi Environment Variables

Untuk keamanan, jangan hardcode password/token di code. Website ini menggunakan variabel berikut (lihat `.env` sebagai contoh):

| Variable | Deskripsi |
| :--- | :--- |
| `TURSO_DATABASE_URL` | URL Database Turso (`libsql://...`) |
| `TURSO_AUTH_TOKEN` | Token autentikasi Turso |
| `TINA_CLIENT_ID` | Client ID dari Tina Cloud |
| `TINA_TOKEN` | Token dari Tina Cloud |
| `GITHUB_PERSONAL_ACCESS_TOKEN` | Personal Access Token (PAT) GitHub (jika diperlukan untuk integrasi tertentu) |
| `GITHUB_BRANCH` | Branch utama, biasanya `main` |
| `GITHUB_OWNER` | Username GitHub pemilik repo |
| `GITHUB_REPO` | Nama repository |
| `ADMIN_USERNAME` | Username untuk login admin lokal/custom |
| `ADMIN_PASSWORD_HASH` | Hash password admin (Gunakan `npm run generate:secrets` untuk membuatnya) |
| `SESSION_SECRET` | String acak untuk enkripsi session (Gunakan `npm run generate:secrets`) |

> **Cara Membuat Password Hash & Session Secret:**
> Jalankan `npm run generate:secrets` di terminal lokal Anda. Script ini akan mencetak hash password dan session secret baru.

## 6. Deployment ke Cloudflare Pages

1.  Login ke Dashboard Cloudflare > **Workers & Pages**.
2.  Klik **Create Application** > **Pages** > **Connect to Git**.
3.  Pilih repository GitHub Anda.
4.  **Konfigurasi Build**:
    - **Framework Preset**: Astro
    - **Build Command**: `npm run build:with-tina` (PENTING: Gunakan command ini agar TinaCMS ter-build)
    - **Output Directory**: `dist`
5.  **Environment Variables**:
    - Klik tab "Environment Variables" saat setup (atau di Settings setelah project dibuat).
    - Masukkan semua variabel dari **Langkah 5**.
6.  Klik **Save and Deploy**.

## 7. Instalasi & Menjalankan di Lokal (NPM)

Untuk mengembangkan website di komputer Anda:

1.  Install dependencies:
    ```bash
    npm install
    ```
2.  Jalankan server development:
    ```bash
    npm run dev
    ```
    Website akan berjalan di `http://localhost:4321`.
3.  Akses admin CMS di `http://localhost:4321/admin`.

## 8. Troubleshooting Umum

- **TinaCMS Error**: Pastikan Client ID dan Token di `.env` (atau `tina/config.ts`) sudah benar dan URL/Localhost telah di-authorize di dashboard Tina jika diperlukan.
- **Database Error**: Cek koneksi Turso dan pastikan Token valid (tidak expired).
- **Build Gagal**: Cek log build di Cloudflare. Pastikan `npm run build:with-tina` digunakan, bukan hanya `npm run build` biasa jika Anda menggunakan Tina Cloud.
