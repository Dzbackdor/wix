// ==WixLoginUI==
// User Interface for Wix Google Login Script
// Version: 1.0

window.WixLoginUI = {
    
    createUI() {
        const panel = document.createElement('div');
        panel.innerHTML = `
            <div id="wixLoginPanel" style="
                position: fixed;
                top: 20px;
                right: 20px;
                z-index: 999999;
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                color: white;
                padding: 15px;
                border-radius: 12px;
                box-shadow: 0 8px 32px rgba(0,0,0,0.3);
                font-family: 'Segoe UI', Arial, sans-serif;
                width: 340px;
                backdrop-filter: blur(10px);
            ">
                <h3 style="margin: 0 0 10px 0; font-size: 16px; font-weight: 600;">🚫 Wix Login - No Popup Block</h3>
                <div id="siteInfo" style="margin-bottom: 8px; font-size: 11px; color: rgba(255,255,255,0.8);"></div>
                <div id="status" style="margin-bottom: 12px; font-size: 13px; color: #fff; font-weight: 500;">Siap</div>
                
                <div style="margin-bottom: 12px;">
                    <button id="startBtn" style="
                        background: linear-gradient(45deg, #4CAF50, #45a049);
                        color: white;
                        border: none;
                        padding: 10px 18px;
                        border-radius: 6px;
                        cursor: pointer;
                        margin-right: 8px;
                        font-size: 13px;
                        font-weight: 500;
                        box-shadow: 0 2px 8px rgba(0,0,0,0.2);
                        transition: all 0.3s ease;
                    " onmouseover="this.style.transform='translateY(-2px)'" onmouseout="this.style.transform='translateY(0)'">🚀 Mulai Login</button>
                    
                    <button id="checkBtn" style="
                        background: linear-gradient(45deg, #2196F3, #1976D2);
                        color: white;
                        border: none;
                        padding: 10px 18px;
                        border-radius: 6px;
                        cursor: pointer;
                        font-size: 13px;
                        font-weight: 500;
                        box-shadow: 0 2px 8px rgba(0,0,0,0.2);
                        transition: all 0.3s ease;
                    " onmouseover="this.style.transform='translateY(-2px)'" onmouseout="this.style.transform='translateY(0)'">🔍 Cek Status</button>
                </div>
                
                <div style="margin-bottom: 10px;">
                    <button id="allowPopupBtn" style="
                        background: linear-gradient(45deg, #FF9800, #F57C00);
                        color: white;
                        border: none;
                        padding: 8px 14px;
                        border-radius: 5px;
                        cursor: pointer;
                        margin-right: 6px;
                        font-size: 11px;
                        font-weight: 500;
                        box-shadow: 0 2px 6px rgba(0,0,0,0.2);
                    ">🚫 Izinkan Popup</button>
                    
                    <button id="testPopupBtn" style="
                        background: linear-gradient(45deg, #9C27B0, #7B1FA2);
                        color: white;
                        border: none;
                        padding: 8px 14px;
                        border-radius: 5px;
                        cursor: pointer;
                        margin-right: 6px;
                        font-size: 11px;
                        font-weight: 500;
                        box-shadow: 0 2px 6px rgba(0,0,0,0.2);
                    ">🧪 Test Popup</button>
                    
                    <button id="findGoogleBtn" style="
                        background: linear-gradient(45deg, #f44336, #d32f2f);
                        color: white;
                        border: none;
                        padding: 8px 14px;
                        border-radius: 5px;
                        cursor: pointer;
                        font-size: 11px;
                        font-weight: 500;
                        box-shadow: 0 2px 6px rgba(0,0,0,0.2);
                    ">🔍 Cari Google</button>
                </div>
                
                <div style="margin-bottom: 10px;">
                    <button id="scrollTestBtn" style="
                        background: linear-gradient(45deg, #607D8B, #455A64);
                        color: white;
                        border: none;
                        padding: 6px 12px;
                        border-radius: 4px;
                        cursor: pointer;
                        margin-right: 5px;
                        font-size: 10px;
                        font-weight: 500;
                    ">📜 Test Scroll</button>
                    
                    <button id="debugBtn" style="
                        background: linear-gradient(45deg, #795548, #5D4037);
                        color: white;
                        border: none;
                        padding: 6px 12px;
                        border-radius: 4px;
                        cursor: pointer;
                        margin-right: 5px;
                        font-size: 10px;
                        font-weight: 500;
                    ">🔧 Debug</button>
                    
                    <button id="resetBtn" style="
                        background: linear-gradient(45deg, #9E9E9E, #757575);
                        color: white;
                        border: none;
                        padding: 6px 12px;
                        border-radius: 4px;
                        cursor: pointer;
                        font-size: 10px;
                        font-weight: 500;
                    ">🔄 Reset</button>
                </div>
                
                <div style="margin-top: 12px; padding: 8px; background: rgba(255,255,255,0.1); border-radius: 6px;">
                    <div style="font-size: 10px; color: rgba(255,255,255,0.9); margin-bottom: 4px;" id="info">Siap untuk memulai</div>
                    <div style="font-size: 9px; color: rgba(255,255,255,0.7);" id="popupStatus">Status popup: Tidak diketahui</div>
                </div>
            </div>
        `;
        
        document.body.appendChild(panel);
        this.setupEventListeners();
        this.updateSiteInfo();
        this.updatePopupStatus();
        this.updateInitialStatus();
    },
    
    setupEventListeners() {
        document.getElementById('startBtn').onclick = () => {
            window.WixLoginCore?.startLogin();
        };
        
        document.getElementById('checkBtn').onclick = () => {
            this.checkLoginStatus();
        };
        
        document.getElementById('allowPopupBtn').onclick = () => {
            this.showPopupInstructions();
        };
        
        document.getElementById('testPopupBtn').onclick = () => {
            window.WixLoginPopupBypass?.testPopupBlocker();
        };
        
        document.getElementById('findGoogleBtn').onclick = () => {
            this.testFindGoogle();
        };
        
        document.getElementById('scrollTestBtn').onclick = () => {
            this.testScroll();
        };
        
        document.getElementById('debugBtn').onclick = () => {
            this.showDebugInfo();
        };
        
        document.getElementById('resetBtn').onclick = () => {
            window.WixLoginCore?.resetState();
        };
    },
    
    updateSiteInfo() {
        const siteInfoEl = document.getElementById('siteInfo');
        if (siteInfoEl) {
            const hostname = window.location.hostname;
            const isTarget = window.WixLoginUtils?.isTargetSite();
            
            siteInfoEl.innerHTML = `
                <div>🌐 ${hostname}</div>
                <div>🎯 ${isTarget ? 'SITUS TARGET ✅' : 'BUKAN TARGET ❌'}</div>
            `;
        }
    },
    
    updateStatus(message) {
        const statusEl = document.getElementById('status');
        if (statusEl) {
            statusEl.textContent = message;
            console.log(`📊 Status: ${message}`);
        }
    },
    
    updateInfo(message) {
        const infoEl = document.getElementById('info');
        if (infoEl) {
            const timestamp = new Date().toLocaleTimeString();
            infoEl.innerHTML = `${timestamp}: ${message}`;
        }
    },
    
    updatePopupStatus(message) {
        if (!message) {
            const status = window.WixLoginPopupBypass?.checkPopupBlocker();
            message = status === 'allowed' ? 'Diizinkan ✅' : 
                     status === 'blocked' ? 'Diblokir ❌' : 'Tidak diketahui ⚠️';
        }
        
        const popupStatusEl = document.getElementById('popupStatus');
        if (popupStatusEl) {
            popupStatusEl.textContent = `Status popup: ${message}`;
        }
    },
    
    updateInitialStatus() {
        if (window.WixLoginUtils?.isLoggedIn()) {
            this.updateStatus('✅ Sudah login');
            this.updateInfo('Tombol logout ditemukan');
        } else {
            this.updateStatus('❌ Belum login');
            this.updateInfo('Tidak ada tombol logout');
        }
    },
    
    checkLoginStatus() {
        console.log('🔍 Mengecek status login saat ini...');
        
        const isLogged = window.WixLoginUtils?.isLoggedIn();
        const config = window.WixLoginConfig;
        const logoutButton = document.querySelector(config?.selectors?.logout);
        
        console.log('📊 Pengecekan Status Login:');
        console.log(`  - Sudah login: ${isLogged}`);
        console.log(`  - Tombol logout: ${logoutButton ? 'Ditemukan' : 'Tidak ditemukan'}`);
        
        if (isLogged) {
            this.updateStatus('✅ Sudah login');
            this.updateInfo('Tombol logout ditemukan');
            
            const userInfo = this.getUserInfo();
            if (userInfo) {
                console.log('👤 Info user:', userInfo);
                GM_notification(`Login sebagai: ${userInfo}`, 'Status Login');
            } else {
                GM_notification('Berhasil login!', 'Status Login');
            }
        } else {
            this.updateStatus('❌ Belum login');
            this.updateInfo('Tidak ada tombol logout ditemukan');
            GM_notification('Belum login', 'Status Login');
        }
        
        this.checkForLoginElements();
    },
    
    getUserInfo() {
        try {
            const selectors = [
                '[data-hook="user-auth-logout"]',
                '[data-testid="user-menu"]',
                '.user-name',
                '.user-email',
                '[aria-label*="user"]'
            ];
            
            for (const selector of selectors) {
                const element = document.querySelector(selector);
                if (element) {
                    const text = element.textContent?.trim();
                    if (text && text.length > 0) {
                        return text;
                    }
                }
            }
            
            return null;
        } catch (error) {
            console.log('⚠️ Tidak bisa mendapatkan info user:', error.message);
            return null;
        }
    },
    
    checkForLoginElements() {
        console.log('🔍 Mengecek element terkait login...');
        
        const config = window.WixLoginConfig;
        const elements = {
            'Kotak komentar': config?.selectors?.commentBox,
            'Tombol login': config?.selectors?.loginButton,
            'Switch signup': config?.selectors?.signupSwitch,
            'Tombol logout': config?.selectors?.logout
        };
        
        Object.entries(elements).forEach(([name, selector]) => {
            if (selector) {
                const element = document.querySelector(selector);
                console.log(`  - ${name}: ${element ? '✅ Ditemukan' : '❌ Tidak ditemukan'}`);
            }
        });
    },
    
    showPopupInstructions() {
        console.log('📋 Menampilkan instruksi popup...');
        
        const instructions = `
Untuk mengizinkan popup di Microsoft Edge:

1. Klik ikon 🔒 kunci di address bar
2. Klik "Permissions for this site"
3. Cari "Pop-ups and redirects"
4. Ubah ke "Allow"
5. Refresh halaman

Atau:
1. Buka Edge Settings (⋯ menu > Settings)
2. Klik "Cookies and site permissions"
3. Klik "Pop-ups and redirects"
4. Tambahkan situs ini ke daftar "Allow"

Situs saat ini: ${window.location.hostname}
        `;
        
        console.log(instructions);
        
        GM_notification(
            'Cek console untuk instruksi popup',
            'Instruksi Popup',
            null,
            () => console.log('Instruksi ditampilkan')
        );
        
        this.updateInfo('Instruksi popup di console');
    },
    
    async testScroll() {
        console.log('🧪 Testing fungsi scroll...');
        this.updateStatus('🧪 Testing scroll...');
        
        const startY = window.pageYOffset;
        console.log(`📍 Posisi awal: ${startY}`);
        
        for (let i = 1; i <= 5; i++) {
            console.log(`📜 Test scroll ${i}/5`);
            this.updateStatus(`📜 Test scroll ${i}/5`);
            
            window.scrollBy(0, 300);
            await window.WixLoginUtils?.delay(1000);
            
            const currentY = window.pageYOffset;
            console.log(`📍 Posisi setelah scroll ${i}: ${currentY}`);
        }
        
        console.log('📜 Scroll kembali ke atas...');
        window.scrollTo({ top: 0, behavior: 'smooth' });
        await window.WixLoginUtils?.delay(2000);
        
        console.log('✅ Test scroll selesai');
        this.updateStatus('✅ Test scroll selesai');
        this.updateInfo('Fungsi scroll berfungsi');
    },
    
    async testFindGoogle() {
        console.log('🔍 Testing deteksi tombol Google...');
        this.updateStatus('🔍 Mencari tombol Google...');
        
        try {
            const googleButton = await window.WixLoginCore?.findGoogleButton();
            
            if (googleButton) {
                console.log('✅ Tombol Google ditemukan!');
                this.updateStatus('✅ Tombol Google ditemukan');
                this.updateInfo('Tombol Google terdeteksi');
                
                window.WixLoginUtils?.highlightElement(googleButton);
                googleButton.scrollIntoView({ behavior: 'smooth', block: 'center' });
                
                const details = {
                    text: googleButton.textContent?.trim().substring(0, 50),
                    tagName: googleButton.tagName,
                    className: googleButton.className,
                    ariaLabel: googleButton.getAttribute('aria-label'),
                    dataTestId: googleButton.getAttribute('data-testid')
                };
                
                console.log('🔍 Detail tombol:', details);
                
                GM_notification(
                    `Ditemukan: ${details.text || 'Tombol Google'}`,
                    'Tombol Google Ditemukan'
                );
                
            } else {
                console.log('❌ Tombol Google tidak ditemukan');
                this.updateStatus('❌ Tombol Google tidak ditemukan');
                this.updateInfo('Tidak ada tombol Google terdeteksi');
                
                GM_notification(
                    'Tombol Google tidak ditemukan. Coba scroll atau pastikan form signup terbuka.',
                    'Tidak Ditemukan'
                );
            }
        } catch (error) {
            console.log('❌ Error pencarian tombol Google:', error.message);
            this.updateStatus('❌ Error pencarian');
            this.updateInfo('Pencarian tombol Google gagal');
        }
    },
    
    showDebugInfo() {
        console.log('🔧 Menampilkan informasi debug...');
        
        const debugInfo = {
            url: window.location.href,
            hostname: window.location.hostname,
            isTargetSite: window.WixLoginUtils?.isTargetSite(),
            isLoggedIn: window.WixLoginUtils?.isLoggedIn(),
            loginInProgress: window.WixLoginCore?.loginInProgress,
            currentAccount: window.WixLoginCore?.currentAccount?.email || 'Tidak ada',
            popupBlocked: window.WixLoginPopupBypass?.popupBlocked,
            hasPopup: window.WixLoginPopupBypass?.currentPopup && !window.WixLoginPopupBypass?.currentPopup.closed,
            scrollPosition: window.pageYOffset,
            pageHeight: document.documentElement.scrollHeight,
            viewportHeight: window.innerHeight
        };
        
        console.log('🔧 Info Debug:', debugInfo);
        
        this.updateInfo('Info debug di console');
        
        GM_notification(
            `Target: ${debugInfo.isTargetSite ? 'Ya' : 'Tidak'} | Login: ${debugInfo.isLoggedIn ? 'Ya' : 'Tidak'}`,
            'Info Debug'
        );
    }
};

console.log('✅ WixLoginUI loaded');