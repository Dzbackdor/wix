// ==WixLoginCore==
// Core login functionality for Wix Google Login Script
// Version: 2.1

window.WixLoginCore = {
    
    loginInProgress: false,
    currentAccount: null,
    checkInterval: null,
    scrollAttempts: 0,
    loginCompleted: false,
    
    getConfig() {
        return window.WixLoginConfig || {};
    },
    
    shouldAutoStart() {
        // Jangan auto start jika sudah login
        if (window.WixLoginUtils?.isLoggedIn()) {
            console.log('⚠️ Skip auto-start: Sudah login');
            return false;
        }
        
        // Jangan auto start jika login sedang berlangsung
        if (this.loginInProgress) {
            console.log('⚠️ Skip auto-start: Login sedang berlangsung');
            return false;
        }
        
        // Jangan auto start jika login sudah selesai
        if (this.loginCompleted) {
            console.log('⚠️ Skip auto-start: Login sudah selesai');
            return false;
        }
        
        return true;
    },
    
    async startLogin() {
        console.log('🚀 Starting login process...');
        
        // PENGECEKAN AWAL - STOP JIKA SUDAH LOGIN
        if (window.WixLoginUtils?.isLoggedIn()) {
            console.log('✅ SUDAH LOGIN - Skip ke bagian komentar');
            window.WixLoginUI?.updateStatus('✅ Sudah login - Skip ke komentar');
            this.onLoginAlreadyComplete();
            return;
        }
        
        if (this.loginInProgress) {
            console.log('⚠️ Login sudah berlangsung');
            return;
        }
        
        if (this.loginCompleted) {
            console.log('⚠️ Login sudah selesai sebelumnya');
            return;
        }
        
        this.loginInProgress = true;
        this.loginCompleted = false;
        this.currentAccount = window.WixLoginUtils?.getRandomAccount();
        this.scrollAttempts = 0;
        
        try {
            console.log('🚀 Starting login process...');
            window.WixLoginUI?.updateStatus('🚀 Memulai login...');
            
            this.startMonitoring();
            
            // STEP 1: Cari comment box SAMBIL cek login status
            await this.step1_FindCommentBoxWithLoginCheck();
            
        } catch (error) {
            console.error('❌ Login failed:', error.message);
            window.WixLoginUI?.updateStatus(`❌ Error: ${error.message}`);
            this.loginInProgress = false;
            this.stopMonitoring();
            
            GM_notification(`Login error: ${error.message}`, 'Error');
        }
    },
    
    async step1_FindCommentBoxWithLoginCheck() {
        console.log('\n📝 STEP 1: Finding comment box with login check...');
        window.WixLoginUI?.updateStatus('📝 Mencari comment box...');
        
        try {
            // Gunakan fungsi khusus yang cek login selama scroll
            const result = await this.findCommentBoxWithLoginMonitoring();
            
            if (result.alreadyLoggedIn) {
                console.log('✅ Login terdeteksi selama pencarian comment box');
                this.onLoginAlreadyComplete();
                return;
            }
            
            if (result.commentBox) {
                console.log('✅ Comment box found, user belum login');
                await window.WixLoginUtils?.clickElementAdvanced(result.commentBox, 'Comment box');
                
                // Delay dan cek login setelah klik
                await this.delay(2000);
                if (window.WixLoginUtils?.isLoggedIn()) {
                    console.log('✅ Login terdeteksi setelah klik comment box');
                    this.onLoginSuccess();
                    return;
                }
                
                // Lanjut ke step 2
                await this.step2_LoginButton();
            } else {
                throw new Error('Comment box tidak ditemukan dan user belum login');
            }
            
        } catch (error) {
            console.log('❌ Step 1 failed:', error.message);
            throw new Error(`Comment box step failed: ${error.message}`);
        }
    },
    
    async findCommentBoxWithLoginMonitoring() {
        console.log('🔍 Mencari comment box sambil monitor login status...');
        
        const config = this.getConfig();
        const maxScrolls = config.scroll?.maxScrolls || 20;
        const scrollStep = config.scroll?.step || 300;
        const waitAfterScroll = config.scroll?.waitAfterScroll || 1000;
        
        const commentBoxSelectors = [
            '[data-hook="comment-box-placeholder-text"]',
            '[data-testid="comment-box"]',
            '[data-hook*="comment"]',
            '.comment-box',
            '.comment-placeholder'
        ];
        
        // Cek awal sebelum scroll
        console.log('🔍 Cek awal sebelum scroll...');
        
        // CEK LOGIN DULU
        if (window.WixLoginUtils?.isLoggedIn()) {
            console.log('✅ SUDAH LOGIN - Ditemukan logout button');
            return { alreadyLoggedIn: true, commentBox: null };
        }
        
        // CEK COMMENT BOX
        for (const selector of commentBoxSelectors) {
            const element = document.querySelector(selector);
            if (element) {
                console.log(`✅ Comment box ditemukan tanpa scroll: ${selector}`);
                return { alreadyLoggedIn: false, commentBox: element };
            }
        }
        
        // Mulai scroll dan monitor
        console.log('📜 Mulai scroll dan monitor...');
        
        for (let i = 0; i < maxScrolls; i++) {
            console.log(`📜 Scroll ${i + 1}/${maxScrolls}`);
            window.WixLoginUI?.updateStatus(`📜 Scroll ${i + 1}/${maxScrolls} - Cek login...`);
            
            // Scroll dulu
            window.scrollBy(0, scrollStep);
            await this.delay(waitAfterScroll);
            
            // CEK LOGIN SETELAH SCROLL - PRIORITAS UTAMA
            if (window.WixLoginUtils?.isLoggedIn()) {
                console.log('✅ SUDAH LOGIN - Ditemukan logout button saat scroll');
                return { alreadyLoggedIn: true, commentBox: null };
            }
            
            // CEK COMMENT BOX SETELAH SCROLL
            for (const selector of commentBoxSelectors) {
                const element = document.querySelector(selector);
                if (element) {
                    console.log(`✅ Comment box ditemukan saat scroll ${i + 1}: ${selector}`);
                    await window.WixLoginUtils?.scrollToElement(element);
                    return { alreadyLoggedIn: false, commentBox: element };
                }
            }
            
            // Cek jika sudah sampai bawah
            const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
            const scrollHeight = document.documentElement.scrollHeight;
            const clientHeight = window.innerHeight;
            
            if (scrollTop + clientHeight >= scrollHeight - 100) {
                console.log('📜 Reached bottom of page');
                break;
            }
        }
        
        // Final check setelah scroll selesai
        console.log('🔍 Final check setelah scroll selesai...');
        
        // CEK LOGIN FINAL
        if (window.WixLoginUtils?.isLoggedIn()) {
            console.log('✅ SUDAH LOGIN - Final check');
            return { alreadyLoggedIn: true, commentBox: null };
        }
        
        // CEK COMMENT BOX FINAL
        for (const selector of commentBoxSelectors) {
            const element = document.querySelector(selector);
            if (element) {
                console.log(`✅ Comment box ditemukan di final check: ${selector}`);
                return { alreadyLoggedIn: false, commentBox: element };
            }
        }
        
        throw new Error('Comment box tidak ditemukan dan user belum login');
    },
    
    async step2_LoginButton() {
        console.log('\n👤 STEP 2: Looking for login button...');
        window.WixLoginUI?.updateStatus('👤 Mencari login button...');
        
        // CEK LOGIN SEBELUM STEP 2
        if (window.WixLoginUtils?.isLoggedIn()) {
            console.log('✅ SUDAH LOGIN - Skip step 2');
            this.onLoginAlreadyComplete();
            return;
        }
        
        await this.delay(2000);
        
        try {
            const loginButton = await window.WixLoginUtils?.findLoginButton();
            await window.WixLoginUtils?.clickElementAdvanced(loginButton, 'Login as member');
            
            // Delay dan cek login setelah klik
            await this.delay(3000);
            if (window.WixLoginUtils?.isLoggedIn()) {
                console.log('✅ Login terdeteksi setelah klik login button');
                this.onLoginSuccess();
                return;
            }
            
            // Lanjut ke step 3
            await this.step3_SwitchSignup();
            
        } catch (error) {
            console.log('❌ Step 2 failed:', error.message);
            throw new Error(`Login button step failed: ${error.message}`);
        }
    },
    
    async step3_SwitchSignup() {
        console.log('\n📝 STEP 3: Looking for signup switch...');
        window.WixLoginUI?.updateStatus('📝 Mencari signup switch...');
        
        // CEK LOGIN SEBELUM STEP 3
        if (window.WixLoginUtils?.isLoggedIn()) {
            console.log('✅ SUDAH LOGIN - Skip step 3');
            this.onLoginAlreadyComplete();
            return;
        }
        
        await this.delay(2000);
        
        try {
            const signupButton = await window.WixLoginUtils?.findSignupSwitch();
            await window.WixLoginUtils?.clickElementAdvanced(signupButton, 'Switch to signup');
            
            // Delay dan cek login setelah klik
            await this.delay(3000);
            if (window.WixLoginUtils?.isLoggedIn()) {
                console.log('✅ Login terdeteksi setelah switch signup');
                this.onLoginSuccess();
                return;
            }
            
            // Lanjut ke step 4
            await this.step4_GoogleButton();
            
        } catch (error) {
            console.log('❌ Step 3 failed:', error.message);
            throw new Error(`Signup switch step failed: ${error.message}`);
        }
    },
    
    async step4_GoogleButton() {
        console.log('\n🔓 STEP 4: Google button...');
        window.WixLoginUI?.updateStatus('🔓 Mencari Google button...');
        
        // CEK LOGIN SEBELUM STEP 4
        if (window.WixLoginUtils?.isLoggedIn()) {
            console.log('✅ SUDAH LOGIN - Skip step 4');
            this.onLoginAlreadyComplete();
            return;
        }
        
        await this.delay(3000);
        
        try {
            const googleButton = await window.WixLoginUtils?.findGoogleButton();
            
            if (googleButton) {
                console.log('✅ Google button found');
                
                // Setup popup bypass
                if (window.WixLoginPopupBypass?.setupPopupBypass) {
                    window.WixLoginPopupBypass.setupPopupBypass();
                }
                
                // Show notification about popup
                GM_notification(
                    'Google login popup akan terbuka. Pastikan popup diizinkan.',
                    'Popup Permission Required'
                );
                
                await this.delay(2000);
                
                // Click Google button
                const clickSuccess = await window.WixLoginUtils?.clickElementAdvanced(googleButton, 'Google signup button');
                
                if (clickSuccess) {
                    console.log('✅ Google button clicked');
                } else {
                    console.log('⚠️ Click uncertain, continuing...');
                }
                
                await this.delay(5000);
                
                // Cek login setelah Google button
                if (window.WixLoginUtils?.isLoggedIn()) {
                    console.log('✅ Login terdeteksi setelah Google button');
                    this.onLoginSuccess();
                    return;
                }
                
                // Lanjut ke step 5 (wait completion)
                await this.step5_WaitCompletion();
                
            } else {
                throw new Error('Google button not found');
            }
            
        } catch (error) {
            console.log('❌ Step 4 failed:', error.message);
            this.showManualInstructions();
            
            // Tetap lanjut ke wait completion
            await this.step5_WaitCompletion();
        }
    },
    
    async step5_WaitCompletion() {
        console.log('\n⏳ STEP 5: Waiting for login completion...');
        window.WixLoginUI?.updateStatus('⏳ Menunggu completion...');
        
        GM_notification(
            `Selesaikan Google login dengan: ${this.currentAccount?.email}`,
            'Complete Login'
        );
        
        return new Promise((resolve, reject) => {
            let attempts = 0;
            const maxAttempts = 120; // 4 menit
            
            const checkLogin = setInterval(() => {
                attempts++;
                
                if (window.WixLoginUtils?.isLoggedIn()) {
                    console.log('🎉 LOGIN SUCCESS!');
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
                    console.log(`⏳ Still waiting... ${attempts}/${maxAttempts}`);
                    window.WixLoginUI?.updateStatus(`⏳ Menunggu... ${attempts}/${maxAttempts}`);
                }
            }, 2000);
        });
    },
    
    showManualInstructions() {
        console.log('📋 Showing manual instructions...');
        
        GM_notification(
            'Silakan klik tombol Google signup secara manual. Pastikan popup diizinkan.',
            'Manual Action Required',
            null,
            () => {
                // Try to find and highlight Google button
                const googleButton = window.WixLoginUtils?.findGoogleButton();
                if (googleButton) {
                    googleButton.style.border = '5px solid red';
                    googleButton.style.backgroundColor = 'rgba(255, 0, 0, 0.3)';
                    googleButton.scrollIntoView({ behavior: 'smooth', block: 'center' });
                }
            }
        );
    },
    
    // ==================== MONITORING ====================
    startMonitoring() {
        console.log('👀 Starting login monitoring...');
        
        this.checkInterval = setInterval(() => {
            if (window.WixLoginUtils?.isLoggedIn()) {
                console.log('🎉 Login detected via monitoring!');
                this.onLoginSuccess();
                this.stopMonitoring();
            }
        }, 3000); // Check every 3 seconds
    },
    
    stopMonitoring() {
        if (this.checkInterval) {
            clearInterval(this.checkInterval);
            this.checkInterval = null;
            console.log('⏹️ Monitoring stopped');
        }
    },
    
    // ==================== LOGIN SUCCESS HANDLERS ====================
    onLoginSuccess() {
        console.log('🎉 LOGIN SUCCESS - User baru saja login!');
        
        // Set flags
        this.loginInProgress = false;
        this.loginCompleted = true;
        
        window.WixLoginUI?.updateStatus('🎉 Login berhasil!');
        GM_notification('Login berhasil!', 'Success');
        
        this.stopMonitoring();
        
        // Save login info
        GM_setValue('last_login_success', Date.now());
        GM_setValue('last_login_account', this.currentAccount?.email || 'unknown');
        
        console.log('✅ Login process completed, ready for next phase');
        
        // Trigger next phase (comment) setelah delay
        setTimeout(() => {
            this.triggerCommentPhase();
        }, 3000);
    },
    
    onLoginAlreadyComplete() {
        console.log('✅ LOGIN ALREADY COMPLETE - User sudah login sebelumnya!');
        
        // Set flags
        this.loginInProgress = false;
        this.loginCompleted = true;
        
        window.WixLoginUI?.updateStatus('✅ Sudah login - Skip ke komentar');
        GM_notification('Sudah login, langsung ke bagian komentar', 'Already Logged In');
        
        this.stopMonitoring();
        
        console.log('✅ Skip login process, ready for comment phase');
        
        // Trigger comment phase immediately
        setTimeout(() => {
            this.triggerCommentPhase();
        }, 2000);
    },
    
    triggerCommentPhase() {
        console.log('💬 Triggering comment phase...');
        
        if (window.WixLoginApp?.handleLoggedInUser) {
            console.log('🚀 Starting comment phase...');
            window.WixLoginApp.handleLoggedInUser();
        } else {
            console.log('⚠️ Comment phase handler not available yet');
            window.WixLoginUI?.updateStatus('⚠️ Comment phase belum tersedia');
            window.WixLoginUI?.updateInfo('Comment handler belum diimplementasi');
        }
    },
    
    // ==================== RESET FUNCTIONS ====================
    resetLoginState() {
        console.log('🔄 Resetting login state...');
        
        this.loginInProgress = false;
        this.loginCompleted = false;
        this.currentAccount = null;
        this.scrollAttempts = 0;
        
        this.stopMonitoring();
        
        console.log('✅ Login state reset');
    },
    
    forceRestartLogin() {
        console.log('🔄 Force restart login...');
        
        this.resetLoginState();
        
        setTimeout(() => {
            this.startLogin();
        }, 2000);
    },
    
    // ==================== UTILITY ====================
    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    },
    
    // ==================== STATUS CHECKS ====================
    getLoginStatus() {
        return {
            isLoggedIn: window.WixLoginUtils?.isLoggedIn() || false,
            loginInProgress: this.loginInProgress,
            loginCompleted: this.loginCompleted,
            currentAccount: this.currentAccount?.email || null,
            hasMonitoring: !!this.checkInterval
        };
    },
    
    // ==================== DEBUG FUNCTIONS ====================
    debugCurrentState() {
        const status = this.getLoginStatus();
        console.log('🔧 Current Login State:', status);
        
        // Cek elemen penting
        const logoutButton = document.querySelector('[data-hook="user-auth-logout"]');
        const commentBox = document.querySelector('[data-hook="comment-box-placeholder-text"]');
        
        console.log('🔧 Important Elements:');
        console.log('  - Logout button:', logoutButton ? '✅ Found' : '❌ Not found');
        console.log('  - Comment box:', commentBox ? '✅ Found' : '❌ Not found');
        
        return {
            ...status,
            elements: {
                logoutButton: !!logoutButton,
                commentBox: !!commentBox
            }
        };
    },
    
    // Test function untuk cek logika
    async testLoginLogic() {
        console.log('🧪 Testing login logic...');
        
        const initialState = this.debugCurrentState();
        console.log('🧪 Initial state:', initialState);
        
        if (initialState.isLoggedIn) {
            console.log('🧪 User sudah login - Should skip to comment');
            this.onLoginAlreadyComplete();
        } else {
            console.log('🧪 User belum login - Should start login process');
            
            // Test comment box search with login monitoring
            try {
                const result = await this.findCommentBoxWithLoginMonitoring();
                console.log('🧪 Comment box search result:', result);
                
                if (result.alreadyLoggedIn) {
                    console.log('🧪 Login detected during search - Should skip to comment');
                } else if (result.commentBox) {
                    console.log('🧪 Comment box found, user not logged in - Should continue login');
                } else {
                    console.log('🧪 No comment box, user not logged in - Should show error');
                }
            } catch (error) {
                console.log('🧪 Test error:', error.message);
            }
        }
    }
};

console.log('✅ WixLoginCore loaded with improved login logic');
console.log('🔧 Available test function: window.WixLoginCore.testLoginLogic()');

