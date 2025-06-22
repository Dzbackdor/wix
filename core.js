// ==WixLoginCore==
// Core login functionality for Wix Google Login Script
// Version: 2.0

window.WixLoginCore = {
    
    loginInProgress: false,
    currentAccount: null,
    checkInterval: null,
    scrollAttempts: 0,
    loginCompleted: false, // Tambahan flag
    
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
        // PENGECEKAN AWAL - STOP JIKA SUDAH LOGIN
        if (window.WixLoginUtils?.isLoggedIn()) {
            console.log('✅ SUDAH LOGIN - Menghentikan proses login');
            window.WixLoginUI?.updateStatus('✅ Sudah login - Proses dihentikan');
            this.onLoginSuccess();
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
            
            // STEP 1: Cek lagi sebelum mencari comment box
            if (await this.checkLoginBeforeStep('comment box')) return;
            await this.step1_FindCommentBox();
            
            // STEP 2: Cek lagi sebelum mencari login button
            if (await this.checkLoginBeforeStep('login button')) return;
            await this.step2_LoginButton();
            
            // STEP 3: Cek lagi sebelum switch signup
            if (await this.checkLoginBeforeStep('signup switch')) return;
            await this.step3_SwitchSignup();
            
            // STEP 4: Cek lagi sebelum Google button
            if (await this.checkLoginBeforeStep('Google button')) return;
            await this.step4_GoogleButton();
            
            // STEP 5: Wait for completion
            await this.step5_WaitCompletion();
            
        } catch (error) {
            console.error('❌ Login failed:', error.message);
            window.WixLoginUI?.updateStatus(`❌ Error: ${error.message}`);
            this.loginInProgress = false;
            this.stopMonitoring();
            
            // Jangan set loginCompleted = true jika error
            GM_notification(`Login error: ${error.message}`, 'Error');
        }
    },
    
    // Fungsi untuk cek login sebelum setiap step
    async checkLoginBeforeStep(stepName) {
        console.log(`🔍 Checking login status before ${stepName} step...`);
        
        if (window.WixLoginUtils?.isLoggedIn()) {
            console.log(`✅ SUDAH LOGIN - Skip ${stepName} step`);
            window.WixLoginUI?.updateStatus(`✅ Sudah login - Skip ${stepName}`);
            this.onLoginSuccess();
            return true; // Return true = skip step
        }
        
        return false; // Return false = continue step
    },
    
    async step1_FindCommentBox() {
        console.log('\n📝 STEP 1: Finding comment box...');
        window.WixLoginUI?.updateStatus('📝 Mencari comment box...');
        
        try {
            const commentBox = await window.WixLoginUtils?.findCommentBox();
            console.log('✅ Comment box found!');
            await window.WixLoginUtils?.clickElementAdvanced(commentBox, 'Comment box');
            
            // Delay dan cek login setelah klik
            await this.delay(2000);
            if (window.WixLoginUtils?.isLoggedIn()) {
                console.log('✅ Login terdeteksi setelah klik comment box');
                this.onLoginSuccess();
                return;
            }
            
        } catch (error) {
            console.log('❌ Step 1 failed:', error.message);
            throw new Error(`Comment box step failed: ${error.message}`);
        }
    },
    
    async step2_LoginButton() {
        console.log('\n👤 STEP 2: Looking for login button...');
        window.WixLoginUI?.updateStatus('👤 Mencari login button...');
        
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
            
        } catch (error) {
            console.log('❌ Step 2 failed:', error.message);
            throw new Error(`Login button step failed: ${error.message}`);
        }
    },
    
    async step3_SwitchSignup() {
        console.log('\n📝 STEP 3: Looking for signup switch...');
        window.WixLoginUI?.updateStatus('📝 Mencari signup switch...');
        
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
            
        } catch (error) {
            console.log('❌ Step 3 failed:', error.message);
            throw new Error(`Signup switch step failed: ${error.message}`);
        }
    },
    
    async step4_GoogleButton() {
        console.log('\n🔓 STEP 4: Google button...');
        window.WixLoginUI?.updateStatus('🔓 Mencari Google button...');
        
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
                
            } else {
                throw new Error('Google button not found');
            }
            
        } catch (error) {
            console.log('❌ Step 4 failed:', error.message);
            this.showManualInstructions();
        }
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
    
    onLoginSuccess() {
        console.log('🎉 LOGIN SUCCESS CONFIRMED!');
        
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
            if (window.WixLoginApp?.handleLoggedInUser) {
                console.log('🚀 Triggering next phase...');
                window.WixLoginApp.handleLoggedInUser();
            }
        }, 3000);
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
    }
};

console.log('✅ WixLoginCore loaded with login completion detection');
