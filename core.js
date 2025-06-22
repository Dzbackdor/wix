// ==WixLoginCore==
// Core login functionality for Wix Google Login Script
// Version: 1.0

window.WixLoginCore = {
    
    loginInProgress: false,
    currentAccount: null,
    checkInterval: null,
    scrollAttempts: 0,
    
    async startLogin() {
        if (this.loginInProgress) {
            console.log('⚠️ Login sudah dalam proses');
            return;
        }
        
        if (window.WixLoginUtils?.isLoggedIn()) {
            console.log('✅ Sudah login!');
            window.WixLoginUI?.updateStatus('✅ Sudah login');
            return;
        }
        
        this.loginInProgress = true;
        this.currentAccount = window.WixLoginUtils?.getRandomAccount();
        this.scrollAttempts = 0;
        
        try {
            console.log('🚀 Memulai login dengan popup bypass...');
            window.WixLoginUI?.updateStatus('🚀 Memulai login...');
            
            this.startMonitoring();
            
            await this.step1_FindCommentBox();
            await this.step2_LoginButton();
            await this.step3_SwitchSignup();
            await this.step4_GoogleButtonWithBypass();
            await this.step5_WaitCompletion();
            
        } catch (error) {
            console.error('❌ Login gagal:', error.message);
            this.handleLoginError(error);
        }
    },
    
    async step1_FindCommentBox() {
        console.log('\n📝 STEP 1: Mencari kotak komentar...');
        window.WixLoginUI?.updateStatus('📝 Mencari kotak komentar...');
        
        const config = window.WixLoginConfig;
        const commentBox = await window.WixLoginUtils?.waitForElementWithScroll(
            config?.selectors?.commentBox, 
            60000
        );
        
        console.log('✅ Kotak komentar ditemukan!');
        await this.clickElementAdvanced(commentBox, 'Kotak komentar');
    },
    
    async step2_LoginButton() {
        console.log('\n👤 STEP 2: Mencari tombol login...');
        window.WixLoginUI?.updateStatus('👤 Mencari tombol login...');
        
        await window.WixLoginUtils?.delay(2000);
        
        const config = window.WixLoginConfig;
        const loginButton = await window.WixLoginUtils?.waitForElementWithScroll(
            config?.selectors?.loginButton, 
            15000
        );
        await this.clickElementAdvanced(loginButton, 'Login sebagai member');
    },
    
    async step3_SwitchSignup() {
        console.log('\n📝 STEP 3: Mencari switch signup...');
        window.WixLoginUI?.updateStatus('📝 Mencari switch signup...');
        
        await window.WixLoginUtils?.delay(2000);
        
        const config = window.WixLoginConfig;
        const signupButton = await window.WixLoginUtils?.waitForElementWithScroll(
            config?.selectors?.signupSwitch, 
            15000
        );
        await this.clickElementAdvanced(signupButton, 'Switch ke signup');
    },
    
    async step4_GoogleButtonWithBypass() {
        console.log('\n🔓 STEP 4: Tombol Google dengan popup bypass...');
        window.WixLoginUI?.updateStatus('🔓 Mencari tombol Google...');
        
        await window.WixLoginUtils?.delay(3000);
        
        try {
            const googleButton = await this.findGoogleButton();
            
            if (googleButton) {
                console.log('✅ Tombol Google ditemukan, setup bypass...');
                
                // Pre-setup popup bypass
                window.WixLoginPopupBypass?.setupPopupBypass();
                
                GM_notification(
                    'Popup login Google akan terbuka. Silakan izinkan popup untuk situs ini.',
                    'Izin Popup Diperlukan',
                    null,
                    () => console.log('User diberitahu tentang popup')
                );
                
                await window.WixLoginUtils?.delay(2000);
                
                const clickSuccess = await this.clickElementAdvanced(googleButton, 'Tombol signup Google');
                
                if (clickSuccess) {
                    console.log('✅ Tombol Google diklik dengan bypass');
                } else {
                    console.log('⚠️ Klik tidak pasti, melanjutkan...');
                }
                
                await window.WixLoginUtils?.delay(window.WixLoginConfig?.delays?.wait || 2000);
            } else {
                throw new Error('Tombol Google tidak ditemukan');
            }
            
        } catch (error) {
            console.log('❌ Step tombol Google gagal:', error.message);
            this.showManualInstructions();
        }
    },
    
    async step5_WaitCompletion() {
        console.log('\n⏳ STEP 5: Menunggu penyelesaian login...');
        window.WixLoginUI?.updateStatus('⏳ Menunggu penyelesaian...');
        
        GM_notification(
            `Selesaikan login Google dengan: ${this.currentAccount?.email}`,
            'Selesaikan Login',
            null,
            () => console.log('User diberitahu untuk menyelesaikan login')
        );
        
        return new Promise((resolve, reject) => {
            let attempts = 0;
            const maxAttempts = 120;
            
            const checkLogin = setInterval(() => {
                attempts++;
                
                if (window.WixLoginUtils?.isLoggedIn()) {
                    console.log('🎉 LOGIN BERHASIL!');
                    clearInterval(checkLogin);
                    this.onLoginSuccess();
                    resolve();
                    return;
                }
                
                if (attempts >= maxAttempts) {
                    console.log('⏰ Login timeout');
                    clearInterval(checkLogin);
                    reject(new Error('Login timeout'));
                    return;
                }
                
                if (attempts % 20 === 0) {
                    console.log(`⏳ Masih menunggu... ${attempts}/${maxAttempts}`);
                    window.WixLoginUI?.updateStatus(`⏳ Menunggu... ${attempts}/${maxAttempts}`);
                }
            }, 2000);
        });
    },
    
    async findGoogleButton() {
        console.log('🔍 Pencarian tombol Google yang ditingkatkan...');
        
        const config = window.WixLoginConfig;
        const selectors = config?.selectors?.googleButtons || [];
        
        for (const selector of selectors) {
            try {
                const elements = document.querySelectorAll(selector);
                
                for (const element of elements) {
                    const text = element.textContent?.toLowerCase() || '';
                    const ariaLabel = element.getAttribute('aria-label')?.toLowerCase() || '';
                    const title = element.getAttribute('title')?.toLowerCase() || '';
                    const className = element.className?.toLowerCase() || '';
                    
                    if (text.includes('google') || 
                        ariaLabel.includes('google') || 
                        title.includes('google') ||
                        className.includes('google')) {
                        
                        console.log(`✅ Tombol Google ditemukan dengan selector: ${selector}`);
                        console.log('Detail tombol:', {
                            text: text.substring(0, 50),
                            ariaLabel: element.getAttribute('aria-label'),
                            title: element.getAttribute('title'),
                            className: element.className
                        });
                        
                        return element;
                    }
                }
            } catch (error) {
                console.log(`⚠️ Selector gagal: ${selector}`, error.message);
            }
        }
        
        // Fallback: search by text content
        console.log('🔍 Fallback: mencari berdasarkan konten teks...');
        const allButtons = document.querySelectorAll('button, [role="button"], input[type="button"], input[type="submit"]');
        
        for (const button of allButtons) {
            const text = button.textContent?.toLowerCase() || '';
            if (text.includes('google') || text.includes('sign up with google') || text.includes('continue with google')) {
                console.log('✅ Tombol Google ditemukan berdasarkan konten teks:', text);
                return button;
            }
        }
        
        return null;
    },
    
    async clickElementAdvanced(element, description = '') {
        if (!element) {
            throw new Error(`Tidak bisa klik: ${description} - element tidak ditemukan`);
        }
        
        console.log(`🖱️ Klik lanjutan dengan popup bypass: ${description}`);
        
        // Scroll to element first
        await window.WixLoginUtils?.scrollToElement(element);
        await window.WixLoginUtils?.delay(500);
        
        // For Google buttons, setup popup bypass first
        if (description.toLowerCase().includes('google')) {
            console.log('🔓 Setup popup bypass untuk tombol Google...');
            window.WixLoginPopupBypass?.setupPopupBypass();
            
            const clickHandler = (event) => {
                console.log('👆 User gesture terdeteksi untuk tombol Google');
                element.removeEventListener('click', clickHandler);
            };
            element.addEventListener('click', clickHandler);
        }
        
        // Multiple click methods with popup context
        const clickMethods = [
            () => {
                console.log('   Method 1: Standard click() dengan user gesture');
                const mouseEvent = new MouseEvent('click', {
                    bubbles: true,
                    cancelable: true,
                    view: window,
                    isTrusted: true
                });
                element.dispatchEvent(mouseEvent);
                element.click();
            },
            () => {
                console.log('   Method 2: Focus + click dengan user gesture');
                element.focus();
                element.click();
            },
            () => {
                console.log('   Method 3: MouseEvent sequence');
                const mouseDown = new MouseEvent('mousedown', { 
                    bubbles: true, 
                    cancelable: true,
                    view: window,
                    isTrusted: true
                });
                const mouseUp = new MouseEvent('mouseup', { 
                    bubbles: true, 
                    cancelable: true,
                    view: window,
                    isTrusted: true
                });
                const clickEvent = new MouseEvent('click', { 
                    bubbles: true, 
                    cancelable: true,
                    view: window,
                    isTrusted: true
                });
                
                element.dispatchEvent(mouseDown);
                element.dispatchEvent(mouseUp);
                element.dispatchEvent(clickEvent);
            },
            () => {
                console.log('   Method 4: Direct onclick dengan context');
                if (element.onclick) {
                    element.onclick.call(element);
                } else {
                    element.click();
                }
            },
            () => {
                console.log('   Method 5: Programmatic click dengan delay');
                setTimeout(() => element.click(), 100);
            }
        ];
        
        // Try each click method
        for (let i = 0; i < clickMethods.length; i++) {
            try {
                console.log(`🖱️ Mencoba click method ${i + 1}/${clickMethods.length}`);
                clickMethods[i]();
                await window.WixLoginUtils?.delay(1500);
                
                if (this.checkClickSuccess()) {
                    console.log(`✅ Click method ${i + 1} berhasil!`);
                    return true;
                }
            } catch (error) {
                console.log(`   Click method ${i + 1} gagal:`, error.message);
            }
        }
        
        console.log('⚠️ Semua click method telah dicoba');
        return false;
    },
    
    checkClickSuccess() {
        // Check if Google popup opened
        const popupBypass = window.WixLoginPopupBypass;
        if (popupBypass?.currentPopup && !popupBypass.currentPopup.closed) {
            console.log('✅ Popup Google terbuka');
            return true;
        }
        
        // Check if redirected to Google
        if (window.location.href.includes('accounts.google.com')) {
            console.log('✅ Redirect ke Google');
            return true;
        }
        
        // Check for new modal/overlay
        const modals = document.querySelectorAll('[role="dialog"], .modal, .overlay, .popup');
        if (modals.length > 0) {
            console.log('✅ Modal/dialog baru terdeteksi');
            return true;
        }
        
        // Check if popup was blocked but URL changed
        if (popupBypass?.popupBlocked) {
            console.log('⚠️ Popup diblokir tapi klik terdaftar');
            return true;
        }
        
        return false;
    },
    
    showManualInstructions() {
        console.log('📋 Menampilkan instruksi manual...');
        
        GM_notification(
            'Silakan klik tombol signup Google secara manual. Pastikan popup diizinkan.',
            'Aksi Manual Diperlukan',
            null,
            () => {
                // Try to find and highlight Google button
                this.findGoogleButton().then(googleButton => {
                    if (googleButton) {
                        googleButton.style.border = '5px solid red';
                        googleButton.style.backgroundColor = 'rgba(255, 0, 0, 0.3)';
                        googleButton.scrollIntoView({ behavior: 'smooth', block: 'center' });
                    }
                });
            }
        );
    },
    
    startMonitoring() {
        console.log('👀 Memulai monitoring login...');
        
        const config = window.WixLoginConfig;
        this.checkInterval = setInterval(() => {
            if (window.WixLoginUtils?.isLoggedIn()) {
                console.log('🎉 Login terdeteksi!');
                this.onLoginSuccess();
                this.stopMonitoring();
            }
        }, config?.delays?.check || 3000);
    },
    
    stopMonitoring() {
        if (this.checkInterval) {
            clearInterval(this.checkInterval);
            this.checkInterval = null;
            console.log('⏹️ Monitoring dihentikan');
        }
    },
    
    onLoginSuccess() {
        console.log('🎉 LOGIN BERHASIL DIKONFIRMASI!');
        
        window.WixLoginUI?.updateStatus('🎉 Login berhasil!');
        GM_notification('Login berhasil diselesaikan!', 'Berhasil');
        
        this.loginInProgress = false;
        this.stopMonitoring();
        
        // Close popup if still open
        const popupBypass = window.WixLoginPopupBypass;
        if (popupBypass?.currentPopup && !popupBypass.currentPopup.closed) {
            try {
                popupBypass.currentPopup.close();
                console.log('✅ Popup ditutup');
            } catch (e) {
                console.log('⚠️ Tidak bisa menutup popup:', e.message);
            }
        }
        
        // Restore original window.open
        popupBypass?.restore();
        
        GM_setValue('last_login_success', Date.now());
        GM_setValue('last_login_account', this.currentAccount?.email);
        
        console.log('✅ Siap untuk fase berikutnya');
    },
    
    handleLoginError(error) {
        console.error('❌ Error login:', error.message);
        
        GM_setValue('last_login_failure', Date.now());
        GM_setValue('last_error_message', error.message);
        
        window.WixLoginUI?.updateStatus(`❌ Error: ${error.message}`);
        window.WixLoginUI?.updateInfo('Login gagal');
        
        this.loginInProgress = false;
        this.stopMonitoring();
        
        GM_notification(
            `Login gagal: ${error.message}`,
            'Error Login',
            null,
            () => {
                if (confirm('Login gagal. Coba lagi?')) {
                    setTimeout(() => this.startLogin(), 2000);
                }
            }
        );
    },
    
    shouldAutoStart() {
        // Check if already logged in
        if (window.WixLoginUtils?.isLoggedIn()) {
            console.log('⚠️ Sudah login, tidak perlu auto-start');
            return false;
        }
        
        // Check if this is target site
        if (!window.WixLoginUtils?.isTargetSite()) {
            console.log('⚠️ Bukan situs target, tidak auto-start');
            return false;
        }
        
        // Check if recently failed (within 5 minutes)
        const lastFailure = GM_getValue('last_login_failure', 0);
        const now = Date.now();
        if (now - lastFailure < 5 * 60 * 1000) {
            console.log('⚠️ Baru saja gagal login, skip auto-start');
            return false;
        }
        
        // Check if already succeeded today
        const lastSuccess = GM_getValue('last_login_success', 0);
        const today = new Date().toDateString();
        const lastSuccessDate = new Date(lastSuccess).toDateString();
        
        if (today === lastSuccessDate) {
            console.log('⚠️ Sudah berhasil login hari ini, skip auto-start');
            return false;
        }
        
        return true;
    },
    
    resetState() {
        console.log('🔄 Reset state...');
        
        this.loginInProgress = false;
        this.currentAccount = null;
        this.scrollAttempts = 0;
        
        // Stop monitoring
        this.stopMonitoring();
        
        // Reset popup bypass
        window.WixLoginPopupBypass?.restore();
        
        // Update UI
        window.WixLoginUI?.updateStatus('🔄 Reset selesai');
        window.WixLoginUI?.updateInfo('State direset');
        window.WixLoginUI?.updatePopupStatus();
        
        // Re-check status
        setTimeout(() => {
            window.WixLoginUI?.updateInitialStatus();
        }, 1000);
        
        console.log('✅ Reset selesai');
        GM_notification('State berhasil direset', 'Reset');
    }
};

console.log('✅ WixLoginCore loaded');