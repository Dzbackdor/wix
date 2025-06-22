// ==WixLoginDebug==
// Debug functions for Wix Google Login Script
// Version: 1.0

window.WixLoginDebug = {
    
    checkWixLogin() {
        console.log('🔍 Wix Login Debug Check:');
        console.log('  - Core instance:', window.WixLoginCore);
        console.log('  - Situs target:', window.WixLoginUtils?.isTargetSite());
        console.log('  - Sudah login:', window.WixLoginUtils?.isLoggedIn());
        console.log('  - Login dalam proses:', window.WixLoginCore?.loginInProgress);
        console.log('  - Akun saat ini:', window.WixLoginCore?.currentAccount?.email || 'Tidak ada');
        console.log('  - Popup diblokir:', window.WixLoginPopupBypass?.popupBlocked);
        return {
            core: window.WixLoginCore,
            utils: window.WixLoginUtils,
            ui: window.WixLoginUI,
            popupBypass: window.WixLoginPopupBypass,
            config: window.WixLoginConfig
        };
    },
    
    showTargetUrls() {
        console.log('📋 URL Target:');
        const config = window.WixLoginConfig;
        config?.daftar_wix?.forEach((url, index) => {
            console.log(`${index + 1}. ${url}`);
        });
        return config?.daftar_wix || [];
    },
    
    testPopupBypass() {
        console.log('🧪 Testing popup bypass...');
        window.WixLoginPopupBypass?.setupPopupBypass();
        
        const testUrl = 'https://accounts.google.com/oauth/authorize?test=1';
        console.log('🔓 Testing popup dengan bypass...');
        
        const popup = window.open(testUrl, '_blank', 'width=500,height=600');
        
        if (popup) {
            console.log('✅ Popup bypass berhasil!');
            setTimeout(() => {
                try {
                    popup.close();
                    console.log('✅ Test popup ditutup');
                } catch (e) {
                    console.log('⚠️ Tidak bisa menutup test popup');
                }
            }, 3000);
        } else {
            console.log('❌ Popup masih diblokir');
        }
        
        return popup;
    },
    
    async manualGoogleClick() {
        console.log('🖱️ Test klik tombol Google manual...');
        
        const googleButton = await window.WixLoginCore?.findGoogleButton();
        if (googleButton) {
            console.log('✅ Tombol Google ditemukan, setup bypass...');
            window.WixLoginPopupBypass?.setupPopupBypass();
            
            await window.WixLoginUtils?.delay(1000);
            
            console.log('🖱️ Klik tombol Google...');
            const success = await window.WixLoginCore?.clickElementAdvanced(googleButton, 'Manual Google button');
            
            console.log(`🎯 Hasil klik: ${success ? 'Berhasil' : 'Tidak pasti'}`);
            return success;
        } else {
            console.log('❌ Tombol Google tidak ditemukan');
            return false;
        }
    },
    
    async fullLoginWithBypass() {
        console.log('🚀 Test login lengkap dengan popup bypass...');
        
        if (window.WixLoginCore) {
            window.WixLoginCore.currentAccount = window.WixLoginUtils?.getRandomAccount();
            console.log(`👤 Menggunakan akun: ${window.WixLoginCore.currentAccount?.email}`);
            
            try {
                await window.WixLoginCore.startLogin();
                return true;
            } catch (error) {
                console.log('❌ Test login lengkap gagal:', error.message);
                return false;
            }
        } else {
            console.log('❌ WixLoginCore tidak tersedia');
            return false;
        }
    },
    
    showAllElements() {
        console.log('🔍 Menampilkan semua element penting...');
        
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
                console.log(`${name}:`, element);
                if (element) {
                    window.WixLoginUtils?.highlightElement(element);
                }
            }
        });
        
        // Show Google buttons
        console.log('\n🔍 Mencari tombol Google...');
        window.WixLoginCore?.findGoogleButton().then(googleButton => {
            if (googleButton) {
                console.log('Tombol Google:', googleButton);
                window.WixLoginUtils?.highlightElement(googleButton);
            } else {
                console.log('❌ Tombol Google tidak ditemukan');
            }
        });
    },
    
    testAllSteps() {
        console.log('🧪 Test semua langkah login...');
        
        const steps = [
            { name: 'Cek situs target', fn: () => window.WixLoginUtils?.isTargetSite() },
            { name: 'Cek status login', fn: () => window.WixLoginUtils?.isLoggedIn() },
            { name: 'Test popup blocker', fn: () => window.WixLoginPopupBypass?.testPopupBlocker() },
            { name: 'Cari kotak komentar', fn: () => document.querySelector(window.WixLoginConfig?.selectors?.commentBox) },
            { name: 'Cari tombol login', fn: () => document.querySelector(window.WixLoginConfig?.selectors?.loginButton) },
            { name: 'Cari switch signup', fn: () => document.querySelector(window.WixLoginConfig?.selectors?.signupSwitch) },
            { name: 'Cari tombol Google', fn: () => window.WixLoginCore?.findGoogleButton() }
        ];
        
        const results = {};
        
        steps.forEach(step => {
            try {
                const result = step.fn();
                results[step.name] = result ? '✅ Berhasil' : '❌ Gagal';
                console.log(`${step.name}: ${results[step.name]}`);
            } catch (error) {
                results[step.name] = `❌ Error: ${error.message}`;
                console.log(`${step.name}: ${results[step.name]}`);
            }
        });
        
        return results;
    },
    
    simulateUserActions() {
        console.log('🎭 Simulasi aksi user...');
        
        // Simulate mouse movement
        const mouseMoveEvent = new MouseEvent('mousemove', {
            bubbles: true,
            cancelable: true,
            view: window,
            clientX: Math.random() * window.innerWidth,
            clientY: Math.random() * window.innerHeight
        });
        document.dispatchEvent(mouseMoveEvent);
        
        // Simulate click
        const clickEvent = new MouseEvent('click', {
            bubbles: true,
            cancelable: true,
            view: window,
            isTrusted: true
        });
        document.dispatchEvent(clickEvent);
        
        // Simulate key press
        const keyEvent = new KeyboardEvent('keydown', {
            bubbles: true,
            cancelable: true,
            key: 'Tab'
        });
        document.dispatchEvent(keyEvent);
        
        console.log('✅ Simulasi aksi user selesai');
    },
    
    exportLogs() {
        console.log('📋 Export logs...');
        
        const logs = {
            timestamp: new Date().toISOString(),
            url: window.location.href,
            userAgent: navigator.userAgent,
            isTargetSite: window.WixLoginUtils?.isTargetSite(),
            isLoggedIn: window.WixLoginUtils?.isLoggedIn(),
            loginInProgress: window.WixLoginCore?.loginInProgress,
            currentAccount: window.WixLoginCore?.currentAccount?.email || 'Tidak ada',
            popupStatus: window.WixLoginPopupBypass?.checkPopupBlocker(),
            lastLoginSuccess: GM_getValue('last_login_success', 0),
            lastLoginFailure: GM_getValue('last_login_failure', 0),
            lastErrorMessage: GM_getValue('last_error_message', ''),
            config: {
                targetUrls: window.WixLoginConfig?.daftar_wix?.length || 0,
                accounts: window.WixLoginConfig?.akun_google?.length || 0
            }
        };
        
        console.log('📊 Log Data:', logs);
        
        // Copy to clipboard if possible
        try {
            navigator.clipboard.writeText(JSON.stringify(logs, null, 2));
            console.log('✅ Log disalin ke clipboard');
        } catch (error) {
            console.log('⚠️ Tidak bisa salin ke clipboard:', error.message);
        }
        
        return logs;
    },
    
    clearStoredData() {
        console.log('🗑️ Membersihkan data tersimpan...');
        
        const keys = [
            'last_login_success',
            'last_login_failure', 
            'last_error_message',
            'last_login_account'
        ];
        
        keys.forEach(key => {
            GM_setValue(key, '');
            console.log(`✅ Cleared: ${key}`);
        });
        
        console.log('✅ Data tersimpan dibersihkan');
        GM_notification('Data tersimpan dibersihkan', 'Pembersihan');
    }
};

// Expose global debug functions
window.checkWixLogin = () => window.WixLoginDebug.checkWixLogin();
window.showTargetUrls = () => window.WixLoginDebug.showTargetUrls();
window.testPopupBypass = () => window.WixLoginDebug.testPopupBypass();
window.manualGoogleClick = () => window.WixLoginDebug.manualGoogleClick();
window.fullLoginWithBypass = () => window.WixLoginDebug.fullLoginWithBypass();
window.showAllElements = () => window.WixLoginDebug.showAllElements();
window.testAllSteps = () => window.WixLoginDebug.testAllSteps();
window.simulateUserActions = () => window.WixLoginDebug.simulateUserActions();
window.exportLogs = () => window.WixLoginDebug.exportLogs();
window.clearStoredData = () => window.WixLoginDebug.clearStoredData();

console.log('✅ WixLoginDebug loaded');
console.log('🔧 Debug functions tersedia:');
console.log('  - window.checkWixLogin()');
console.log('  - window.showTargetUrls()');
console.log('  - window.testPopupBypass()');
console.log('  - window.manualGoogleClick()');
console.log('  - window.fullLoginWithBypass()');
console.log('  - window.showAllElements()');
console.log('  - window.testAllSteps()');
console.log('  - window.simulateUserActions()');
console.log('  - window.exportLogs()');
console.log('  - window.clearStoredData()');