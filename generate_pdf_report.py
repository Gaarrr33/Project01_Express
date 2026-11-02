import os
import sys
from reportlab.lib.pagesizes import A4
from reportlab.lib import colors
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.platypus import (
    SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, Image, KeepTogether, PageBreak, HRFlowable
)
from reportlab.pdfgen import canvas
from PIL import Image as PILImage

class NumberedCanvas(canvas.Canvas):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self._saved_page_states = []

    def showPage(self):
        self._saved_page_states.append(dict(self.__dict__))
        self._startPage()

    def save(self):
        num_pages = len(self._saved_page_states)
        for state in self._saved_page_states:
            self.__dict__.update(state)
            self.draw_page_decorations(num_pages)
            super().showPage()
        super().save()

    def draw_page_decorations(self, page_count):
        self.saveState()
        self.setFont("Helvetica", 8)
        self.setFillColor(colors.HexColor("#718096"))
        
        # Header (halaman 2 ke atas)
        if self._pageNumber > 1:
            self.drawString(45, 800, "Workshop Pemrograman Web — Laporan Integrasi WAHA & External Watchdog")
            self.setStrokeColor(colors.HexColor("#E2E8F0"))
            self.setLineWidth(0.5)
            self.line(45, 792, 550, 792)

        # Footer (seluruh halaman)
        self.setStrokeColor(colors.HexColor("#CBD5E0"))
        self.setLineWidth(0.5)
        self.line(45, 45, 550, 45)
        
        self.drawString(45, 32, "Tegar Mahardika | Repository: github.com/Gaarrr33/Project01_Express")
        page_text = f"Halaman {self._pageNumber} dari {page_count}"
        self.drawRightString(550, 32, page_text)
        self.restoreState()


def get_scaled_image(img_path, max_width=470, max_height=210):
    if not os.path.exists(img_path):
        return None
    with PILImage.open(img_path) as im:
        orig_w, orig_h = im.size
    
    scale = min(max_width / orig_w, max_height / orig_h, 1.0)
    w = orig_w * scale
    h = orig_h * scale
    return Image(img_path, width=w, height=h)


def build_pdf(filename="LAPORAN_PRAKTIKUM.pdf"):
    doc = SimpleDocTemplate(
        filename,
        pagesize=A4,
        leftMargin=45,
        rightMargin=45,
        topMargin=52,
        bottomMargin=52
    )

    styles = getSampleStyleSheet()

    title_style = ParagraphStyle(
        'DocTitle',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=15,
        leading=19,
        textColor=colors.HexColor("#1A365D"),
        alignment=1,
        spaceAfter=4
    )

    subtitle_style = ParagraphStyle(
        'DocSubtitle',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=10.5,
        leading=14,
        textColor=colors.HexColor("#2B6CB0"),
        alignment=1,
        spaceAfter=10
    )

    h1_style = ParagraphStyle(
        'H1',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=11.5,
        leading=15,
        textColor=colors.HexColor("#1A365D"),
        spaceBefore=10,
        spaceAfter=5,
        keepWithNext=True
    )

    h2_style = ParagraphStyle(
        'H2',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=9.5,
        leading=13,
        textColor=colors.HexColor("#2D3748"),
        spaceBefore=7,
        spaceAfter=3,
        keepWithNext=True
    )

    body_style = ParagraphStyle(
        'Body',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=8.8,
        leading=13,
        textColor=colors.HexColor("#2D3748"),
        spaceAfter=5
    )

    bullet_style = ParagraphStyle(
        'Bullet',
        parent=body_style,
        leftIndent=12,
        bulletIndent=3,
        spaceAfter=2.5
    )

    code_style = ParagraphStyle(
        'Code',
        parent=styles['Normal'],
        fontName='Courier',
        fontSize=7.5,
        leading=10,
        textColor=colors.HexColor("#1A202C")
    )

    caption_style = ParagraphStyle(
        'Caption',
        parent=styles['Normal'],
        fontName='Helvetica-Oblique',
        fontSize=7.8,
        leading=10.5,
        textColor=colors.HexColor("#4A5568"),
        alignment=1,
        spaceBefore=3,
        spaceAfter=6
    )

    story = []

    # =========================================================================
    # HALAMAN 1: IDENTITAS, BAB I (TUJUAN), BAB II (ARSITEKTUR), BAB III (KODE)
    # =========================================================================
    story.append(Paragraph("LAPORAN PRAKTIKUM WORKSHOP PEMROGRAMAN WEB", title_style))
    story.append(Paragraph("MODUL: INTEGRASI WHATSAPP GATEWAY (WAHA DOCKER) & EXTERNAL WATCHDOG MONITORING", subtitle_style))
    story.append(HRFlowable(width="100%", thickness=1.5, color=colors.HexColor("#2B6CB0"), spaceAfter=8))

    meta_data = [
        [Paragraph("<b>Mata Kuliah</b>", body_style), Paragraph(": Workshop Pemrograman Web (Semester 2)", body_style),
         Paragraph("<b>Tanggal Uji</b>", body_style), Paragraph(": November 2026", body_style)],
        [Paragraph("<b>Nama Mahasiswa</b>", body_style), Paragraph(": Tegar Mahardika", body_style),
         Paragraph("<b>No. WhatsApp</b>", body_style), Paragraph(": +628973656200", body_style)],
        [Paragraph("<b>Repository</b>", body_style), Paragraph(": https://github.com/Gaarrr33/Project01_Express", body_style),
         Paragraph("<b>Status Sistem</b>", body_style), Paragraph(": Terverifikasi (UP & Healthy)", body_style)]
    ]
    meta_table = Table(meta_data, colWidths=[80, 180, 75, 170])
    meta_table.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,-1), colors.HexColor("#F7FAFC")),
        ('BOX', (0,0), (-1,-1), 0.5, colors.HexColor("#CBD5E0")),
        ('VALIGN', (0,0), (-1,-1), 'MIDDLE'),
        ('TOPPADDING', (0,0), (-1,-1), 2.5),
        ('BOTTOMPADDING', (0,0), (-1,-1), 2.5),
        ('LEFTPADDING', (0,0), (-1,-1), 5),
        ('RIGHTPADDING', (0,0), (-1,-1), 5),
    ]))
    story.append(meta_table)
    story.append(Spacer(1, 6))

    # BAB I
    story.append(Paragraph("I. TUJUAN PRAKTIKUM", h1_style))
    story.append(Paragraph("1. <b>Konfigurasi Self-Hosted WhatsApp Gateway:</b> Menjalankan container Docker WAHA (WhatsApp HTTP API) Core lokal dengan binding port aman <code>127.0.0.1:3008</code> dan persistent storage sesi.", bullet_style))
    story.append(Paragraph("2. <b>Implementasi Fitur Otentikasi OTP WhatsApp:</b> Mengintegrasikan modul pengiriman kode OTP 6-digit untuk verifikasi reset password langsung ke akun WhatsApp pengguna.", bullet_style))
    story.append(Paragraph("3. <b>Penyediaan Endpoint Pemantau Kesehatan:</b> Menyediakan endpoint <code>GET /health</code> sebagai target probe HTTP yang mengembalikan status respons sistem (HTTP 200).", bullet_style))
    story.append(Paragraph("4. <b>Pembangunan External Watchdog Monitor:</b> Mengembangkan daemon monitoring independen (<code>scripts/watchdog.js</code>) yang berjalan terpisah dari proses Express.js dengan interval polling setiap 5 detik.", bullet_style))
    story.append(Paragraph("5. <b>Mekanisme Alerting Otomatis & Anti-False Alarm:</b> Mengirim peringatan seketika ke WhatsApp Administrator saat backend down (fail threshold 2x berturut-turut) serta notifikasi pemulihan (resolved) saat server kembali aktif.", bullet_style))
    story.append(Spacer(1, 4))

    # BAB II
    story.append(Paragraph("II. ARSITEKTUR SISTEM & SPESIFIKASI TEKNIS", h1_style))
    arch_data = [
        [Paragraph("<b>Komponen</b>", body_style), Paragraph("<b>Peran / Tugas</b>", body_style), Paragraph("<b>Konfigurasi / Port</b>", body_style)],
        [Paragraph("WAHA Core (Docker)", body_style), Paragraph("Gateway WhatsApp mandiri berbasis WEBJS engine untuk kirim/terima pesan via REST API.", body_style), Paragraph("Container: waha_core<br/>Port: 127.0.0.1:3008", body_style)],
        [Paragraph("Backend Express.js", body_style), Paragraph("Aplikasi utama katalog etalase, autentikasi pengguna, route reset password OTP, dan probe /health.", body_style), Paragraph("Node.js v18+<br/>Port: 127.0.0.1:3000", body_style)],
        [Paragraph("External Watchdog", body_style), Paragraph("Proses background terpisah untuk mengecek endpoint /health, mendeteksi outage, dan kirim pesan alert WA ke admin.", body_style), Paragraph("scripts/watchdog.js<br/>Interval: 5s | Threshold: 2x", body_style)]
    ]
    arch_table = Table(arch_data, colWidths=[115, 245, 145])
    arch_table.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,0), colors.HexColor("#EDF2F7")),
        ('GRID', (0,0), (-1,-1), 0.5, colors.HexColor("#CBD5E0")),
        ('VALIGN', (0,0), (-1,-1), 'TOP'),
        ('TOPPADDING', (0,0), (-1,-1), 3),
        ('BOTTOMPADDING', (0,0), (-1,-1), 3),
        ('LEFTPADDING', (0,0), (-1,-1), 4),
        ('RIGHTPADDING', (0,0), (-1,-1), 4),
    ]))
    story.append(arch_table)
    story.append(Spacer(1, 4))

    # BAB III
    story.append(Paragraph("III. IMPLEMENTASI & KONFIGURASI KODE", h1_style))
    story.append(Paragraph("<b>1. Konfigurasi Container WAHA Core (docker-compose.yml)</b>", h2_style))
    code_docker = """services:
  waha:
    image: devlikeapro/waha:latest
    container_name: waha_core
    restart: unless-stopped
    ports:
      - "127.0.0.1:3008:3000"
    volumes:
      - ./waha-sessions:/app/.sessions
    environment:
      - WHATSAPP_DEFAULT_ENGINE=WEBJS
      - WHATSAPP_API_KEY=${WAHA_API_KEY}"""
    t_docker = Table([[Paragraph(f"<pre>{code_docker}</pre>", code_style)]], colWidths=[505])
    t_docker.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,-1), colors.HexColor("#F7FAFC")),
        ('BOX', (0,0), (-1,-1), 0.5, colors.HexColor("#CBD5E0")),
        ('TOPPADDING', (0,0), (-1,-1), 3),
        ('BOTTOMPADDING', (0,0), (-1,-1), 3),
    ]))
    story.append(t_docker)
    story.append(Spacer(1, 3))

    story.append(Paragraph("<b>2. Logika Pemantauan External Watchdog (scripts/watchdog.js)</b>", h2_style))
    code_watchdog = """const TARGET_URL = 'http://127.0.0.1:3000/health';
const PING_INTERVAL_MS = 5000;
const FAIL_THRESHOLD = 2; // Butuh 2x gagal sebelum status DOWN (anti-false alarm)

async function checkHealth() {
    try {
        const res = await fetch(TARGET_URL, { timeout: 3000 });
        if (res.ok) handleSuccess();
        else handleFailure();
    } catch (err) {
        handleFailure();
    }
}"""
    t_watchdog = Table([[Paragraph(f"<pre>{code_watchdog}</pre>", code_style)]], colWidths=[505])
    t_watchdog.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,-1), colors.HexColor("#F7FAFC")),
        ('BOX', (0,0), (-1,-1), 0.5, colors.HexColor("#CBD5E0")),
        ('TOPPADDING', (0,0), (-1,-1), 3),
        ('BOTTOMPADDING', (0,0), (-1,-1), 3),
    ]))
    story.append(t_watchdog)

    # =========================================================================
    # HALAMAN 2: HASIL PENGUJIAN 4.1, 4.2, 4.3
    # =========================================================================
    story.append(PageBreak())
    story.append(Paragraph("IV. HASIL PENGUJIAN DAN ANALISIS DOKUMENTASI", h1_style))
    story.append(Paragraph("Berikut adalah bukti eksekusi pengujian fungsionalitas sistem yang didokumentasikan secara runtut sesuai tahapan praktikum:", body_style))

    # 4.1 Dashboard
    img10 = get_scaled_image("docs/screenshots/10-waha-dashboard-sessions.png", max_width=470, max_height=170)
    if img10:
        story.append(Paragraph("<b>4.1. Dashboard Manajemen Sesi WAHA Core (Port 3008)</b>", h2_style))
        story.append(Paragraph("Verifikasi status worker WAHA di browser. Sesi login <code>default</code> terhubung ke nomor <code>Tegar Mahardika (628973656200@c.us)</code> dengan status <b>WORKING</b> dan 1 worker aktif melayani permintaan API.", body_style))
        story.append(img10)
        story.append(Paragraph("Gambar 1: Dashboard WAHA Core menunjukkan sesi WhatsApp aktif dan siap melayani pengiriman pesan.", caption_style))
        story.append(Spacer(1, 4))

    # 4.2 Test WA
    img06 = get_scaled_image("docs/screenshots/06-wa-test-integration-success.png", max_width=470, max_height=80)
    if img06:
        story.append(Paragraph("<b>4.2. Pengujian Pengiriman Pesan Awal (test-whatsapp.js)</b>", h2_style))
        story.append(Paragraph("Eksekusi skrip pengujian koneksi untuk memastikan backend dapat memanggil HTTP POST ke WAHA dan pesan berhasil terkirim ke WhatsApp tujuan.", body_style))
        story.append(img06)
        story.append(Paragraph("Gambar 2: Notifikasi konfirmasi koneksi WAHA Core + Docker Local berhasil diterima di WhatsApp.", caption_style))
        story.append(Spacer(1, 4))

    # 4.3 OTP
    img07 = get_scaled_image("docs/screenshots/07-wa-otp-reset-password.png", max_width=400, max_height=120)
    if img07:
        story.append(Paragraph("<b>4.3. Implementasi Fitur Kode OTP Reset Password via WhatsApp</b>", h2_style))
        story.append(Paragraph("Pengujian alur lupa password pengguna. Sistem men-generate token OTP numerik 6-digit dengan masa aktif 5 menit dan single-use yang dikirimkan secara instan ke nomor WhatsApp terdaftar.", body_style))
        story.append(img07)
        story.append(Paragraph("Gambar 3: Format pesan OTP reset password yang diterima oleh pengguna.", caption_style))

    # =========================================================================
    # HALAMAN 3: HASIL PENGUJIAN 4.4, 4.5
    # =========================================================================
    story.append(PageBreak())
    
    # 4.4 Watchdog UP
    img01 = get_scaled_image("docs/screenshots/01-watchdog-init-up.png", max_width=470, max_height=125)
    if img01:
        story.append(Paragraph("<b>4.4. Inisialisasi Monitoring External Watchdog (Kondisi Server Normal / UP)</b>", h2_style))
        story.append(Paragraph("Skrip <code>watchdog.js</code> dijalankan di terminal melalui <code>npm run watchdog</code>. Watchdog membaca konfigurasi <code>.env</code>, mem-polling endpoint <code>http://127.0.0.1:3000/health</code> setiap 5 detik, dan mengonfirmasi bahwa server Express berada dalam kondisi NORMAL (UP).", body_style))
        story.append(img01)
        story.append(Paragraph("Gambar 4: Terminal watchdog mendeteksi backend Express aktif dalam kondisi normal.", caption_style))
        story.append(Spacer(1, 6))

    # 4.5 Backend Startup
    img04 = get_scaled_image("docs/screenshots/04-backend-start-waha-failure.png", max_width=470, max_height=80)
    img05 = get_scaled_image("docs/screenshots/05-backend-start-success.png", max_width=470, max_height=65)
    story.append(Paragraph("<b>4.5. Siklus Startup Server Backend Express.js</b>", h2_style))
    story.append(Paragraph("Dokumentasi log saat backend dijalankan via <code>npm start</code>. Pada Gambar 5a terlihat penanganan kegagalan saat container WAHA belum merespons (operation aborted). Pada Gambar 5b backend berhasil berjalan normal dan database MySQL terkoneksi.", body_style))
    if img04:
        story.append(img04)
        story.append(Paragraph("Gambar 5a: Log Express saat percobaan koneksi awal ke WAHA mengalami abort.", caption_style))
    if img05:
        story.append(img05)
        story.append(Paragraph("Gambar 5b: Log Express saat server berjalan normal dengan MySQL terkoneksi.", caption_style))

    # =========================================================================
    # HALAMAN 4: SIMULASI SERVER DOWN (4.6) & PEMULIHAN UP (4.7)
    # =========================================================================
    story.append(PageBreak())
    
    # 4.6 DOWN
    img02 = get_scaled_image("docs/screenshots/02-watchdog-detect-down.png", max_width=470, max_height=75)
    img08 = get_scaled_image("docs/screenshots/08-wa-alert-server-down.png", max_width=360, max_height=110)
    story.append(Paragraph("<b>4.6. Simulasi Gangguan Server (Status DOWN & Pengiriman Alert WhatsApp)</b>", h2_style))
    story.append(Paragraph("Saat backend Express.js dihentikan secara sengaja untuk simulasi gangguan (*crash*): Watchdog mencatat <code>Ping gagal (1/2)</code> pada detik ke-5, lalu <code>Ping gagal (2/2)</code> pada detik ke-10 sehingga ambang batas terpenuhi. Status beralih ke <code>SERVER CRITICAL: DOWN!</code> dan alert langsung dikirim ke WhatsApp Admin.", body_style))
    if img02:
        story.append(img02)
        story.append(Paragraph("Gambar 6: Terminal Watchdog mendeteksi kegagalan ping beruntun dan memicu alert DOWN.", caption_style))
    if img08:
        story.append(img08)
        story.append(Paragraph("Gambar 7: Pesan darurat [ALERT] SERVER EXPRESS TIDAK DAPAT DIAKSES diterima di WhatsApp Admin.", caption_style))
    story.append(Spacer(1, 4))

    # 4.7 RECOVERY
    img03 = get_scaled_image("docs/screenshots/03-watchdog-detect-recovery-up.png", max_width=470, max_height=38)
    img09 = get_scaled_image("docs/screenshots/09-wa-alert-server-resolved.png", max_width=360, max_height=110)
    story.append(Paragraph("<b>4.7. Pemulihan Server (Status UP & Notifikasi RESOLVED)</b>", h2_style))
    story.append(Paragraph("Saat backend Express.js dinyalakan kembali, probe berikutnya langsung menerima respons HTTP 200 OK. Watchdog melakukan transisi <code>BACKEND PULIH: DOWN -> UP</code> dan secara otomatis mengirimkan pesan pemulihan ke WhatsApp Administrator.", body_style))
    if img03:
        story.append(img03)
        story.append(Paragraph("Gambar 8: Terminal Watchdog mendeteksi pemulihan backend Express.js.", caption_style))
    if img09:
        story.append(img09)
        story.append(Paragraph("Gambar 9: Pesan konfirmasi pemulihan [RESOLVED] SERVER EXPRESS PULIH diterima di WhatsApp Admin.", caption_style))

    # =========================================================================
    # HALAMAN 5: BAB V (KENDALA & SOLUSI), BAB VI (KESIMPULAN), TANDA TANGAN
    # =========================================================================
    story.append(PageBreak())
    story.append(Paragraph("V. KENDALA DAN PEMECAHAN MASALAH", h1_style))
    trouble_data = [
        [Paragraph("<b>Kendala / Tantangan</b>", body_style), Paragraph("<b>Akar Masalah</b>", body_style), Paragraph("<b>Solusi yang Diterapkan</b>", body_style)],
        [
            Paragraph("Panggilan API WAHA gagal saat Express baru menyala (Gambar 5a).", body_style),
            Paragraph("Proses booting container WAHA dan inisialisasi browser Chromium memerlukan waktu lebih lama dari startup Express.", body_style),
            Paragraph("Menambahkan mekanisme try-catch dengan timeout 8 detik, serta memastikan health status WAHA valid sebelum request pengiriman.", body_style)
        ],
        [
            Paragraph("Potensi spam pesan WhatsApp saat server mati dalam waktu lama.", body_style),
            Paragraph("Jika notifikasi dikirim di setiap ping yang gagal (setiap 5 detik), admin akan menerima ratusan pesan.", body_style),
            Paragraph("Menerapkan State Machine internal pada watchdog: notifikasi hanya dikirim saat terjadi transisi status (UP -> DOWN).", body_style)
        ],
        [
            Paragraph("False alarm saat server hanya di-restart sejenak untuk pembaruan kode.", body_style),
            Paragraph("Ping tunggal yang gagal bisa memicu alert darurat meskipun server langsung menyala kembali.", body_style),
            Paragraph("Menetapkan batas <code>FAIL_THRESHOLD = 2</code>, sehingga butuh minimal 2x ping gagal berturut-turut sebelum trigger status DOWN.", body_style)
        ]
    ]
    t_trouble = Table(trouble_data, colWidths=[140, 165, 200])
    t_trouble.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,0), colors.HexColor("#EDF2F7")),
        ('GRID', (0,0), (-1,-1), 0.5, colors.HexColor("#CBD5E0")),
        ('VALIGN', (0,0), (-1,-1), 'TOP'),
        ('TOPPADDING', (0,0), (-1,-1), 3.5),
        ('BOTTOMPADDING', (0,0), (-1,-1), 3.5),
        ('LEFTPADDING', (0,0), (-1,-1), 4),
        ('RIGHTPADDING', (0,0), (-1,-1), 4),
    ]))
    story.append(t_trouble)
    story.append(Spacer(1, 10))

    story.append(Paragraph("VI. KESIMPULAN", h1_style))
    story.append(Paragraph("1. Integrasi WhatsApp Gateway mandiri menggunakan WAHA Core berbasis Docker berhasil diterapkan secara lokal dengan performa yang stabil dan aman (binding port terbatas pada loopback 127.0.0.1).", bullet_style))
    story.append(Paragraph("2. Fitur pengiriman kode OTP melalui WhatsApp terbukti fungsional dengan masa berlaku ketat (5 menit) untuk mendukung keamanan proses reset password pengguna.", bullet_style))
    story.append(Paragraph("3. Implementasi External Watchdog sebagai proses terpisah terbukti efektif untuk memantau siklus hidup (*lifecycle*) server backend. Pemisahan proses menjamin pemantauan tetap aktif meskipun server aplikasi utama mengalami kegagalan proses (*crash*).", bullet_style))
    story.append(Paragraph("4. Penerapan *fail threshold* (2x kegagalan berturut-turut) dan *state machine* berhasil mengeliminasi potensi alarm palsu (*false alarm*) dan mencegah pengiriman pesan berulang (*spamming*) kepada administrator.", bullet_style))
    story.append(Spacer(1, 16))

    # Blok Tanda Tangan
    sign_data = [
        ["", "Surabaya, 2 November 2026"],
        ["", "Praktikan,"],
        ["", ""],
        ["", ""],
        ["", "<b>Tegar Mahardika</b>"],
        ["", "NIM / Mahasiswa Semester 2"]
    ]
    t_sign = Table(sign_data, colWidths=[310, 195])
    t_sign.setStyle(TableStyle([
        ('ALIGN', (1,0), (1,-1), 'CENTER'),
        ('VALIGN', (0,0), (-1,-1), 'MIDDLE'),
        ('BOTTOMPADDING', (0,0), (-1,-1), 1),
        ('TOPPADDING', (0,0), (-1,-1), 1),
    ]))
    story.append(t_sign)

    doc.build(story, canvasmaker=NumberedCanvas)
    print(f"Laporan PDF berhasil dibuat: {filename}")

if __name__ == "__main__":
    build_pdf("LAPORAN_PRAKTIKUM.pdf")
