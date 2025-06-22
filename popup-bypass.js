// ==WixLoginPopupBypass==
// Popup blocker bypass functionality
// Version: 1.0

window.WixLoginPopupBypass = {
    
    originalWindowOpen: null,
    currentPopup: null,
    popupBlocked: false,
    
    setupPopupBypass() {
        console.log('🚫 Setting up popup blocker bypass...');
        
        // Store original window.open
        this.originalWindowOpen = window.open;
        
        // Override window.open to prevent blocking
        window.open = (...args) => {
            console.log('🔓 Intercepted window.open call:', args[0]);
            
            // Check if it's Google OAuth
            if (args[0] && args[0].includes('accounts.google.com')) {
                console.log('✅ Google OAuth detected, allowing popup...');
                
                try {
                    const popup = this.originalWindowOpen.apply(window, args);
                    
                    if (popup) {
                        console.log('✅ Popup opened successfully');
                        this.currentPopup = popup;
                        this.handleGooglePopup(popup);
                        return popup;
                    } else {
                        console.log('❌ Popup blocked, using fallback...');
                        this.handlePopupBlocked(args[0]);
                        return null;
                    }
                } catch (error) {
                    console.log('❌ Popup error:', error.message);
                    this.handlePopupBlocked(args[0]);
                    return null;
                }
            }
            
            // For non-Google popups, use original behavior
            return this.originalWindowOpen.apply(window, args);
        };
        
        this.setupUserGestureContext();
    },
    
    setupUserGestureContext() {
        console.log('👆 Setting up user gesture context...');
        
        let preCreatedPopup = null;
        
        const createPrePopup = () => {
            try {
                preCreatedPopup = this.originalWindowOpen.call(window, 'about:blank', '_blank', 'width=500,height=600');
                console.log('✅ Pre-created popup for user gesture');
            } catch (error) {
                console.log('⚠️ Could not pre-create popup:', error.message);
            }
        };
        
        document.addEventListener('click', createPrePopup, { once: true });
        document.addEventListener('keydown', createPrePopup, { once: true });
        
        this.getPreCreatedPopup = () => preCreatedPopup;
    },
    
    handlePopupBlocked(url) {
        console.log('🚫 Popup was blocked, using alternative methods...');
        this.popupBlocked = true;
        
        GM_notification(
            'Popup diblokir! Silakan nonaktifkan popup blocker untuk situs ini atau selesaikan login Google secara manual.',
            'Popup Diblokir',
            null,
            () => {
                try {
                    GM_openInTab(url, { active: true });
                    console.log('✅ Opened Google login in new tab');
                } catch (error) {
                    console.log('❌ Could not open new tab:', error.message);
                    window.location.href = url;
                }
            }
        );
    },
    
    async handleGooglePopup(popup) {
        console.log('🔐 Handling Google popup...');
        
        try {
            await window.WixLoginUtils.delay(3000);
            
            if (popup && !popup.closed) {
                console.log('✅ Popup is accessible');
                this.monitorPopupCompletion(popup);
                
                try {
                    if (popup.document && popup.document.readyState === 'complete') {
                        console.log('🔐 Attempting auto-fill...');
                        await this.fillGoogleForm(popup.document);
                    }
                } catch (crossOriginError) {
                    console.log('⚠️ Cross-origin restriction, manual completion required');
                    GM_notification(
                        `Silakan selesaikan login Google dengan: ${window.WixLoginCore?.currentAccount?.email || 'akun Anda'}`,
                        'Login Manual Diperlukan'
                    );
                }
            } else {
                console.log('❌ Popup not accessible or closed');
            }
            
        } catch (error) {
            console.log('❌ Popup handling error:', error.message);
        }
    },
    
    monitorPopupCompletion(popup) {
        console.log('👀 Monitoring popup completion...');
        
        const checkCompletion = setInterval(() => {
            try {
                if (popup.closed) {
                    console.log('✅ Popup closed, checking login status...');
                    clearInterval(checkCompletion);
                    
                    setTimeout(() => {
                        if (window.WixLoginUtils.isLoggedIn()) {
                            window.WixLoginCore?.onLoginSuccess();
                        } else {
                            console.log('⚠️ Popup closed but not logged in');
                        }
                    }, 2000);
                    
                    return;
                }
                
                try {
                    const popupUrl = popup.location.href;
                    if (popupUrl.includes('close') || popupUrl.includes('success')) {
                        console.log('✅ Login success detected in popup');
                        popup.close();
                        clearInterval(checkCompletion);
                        setTimeout(() => window.WixLoginCore?.onLoginSuccess(), 1000);
                    }
                } catch (crossOriginError) {
                    // Expected for cross-origin popup
                }
                
            } catch (error) {
                console.log('⚠️ Popup monitoring error:', error.message);
                clearInterval(checkCompletion);
            }
        }, 1000);
        
        // Timeout after 5 minutes
        setTimeout(() => {
            clearInterval(checkCompletion);
            console.log('⏰ Popup monitoring timeout');
        }, 300000);
    },
    
    async fillGoogleForm(doc) {
        try {
            console.log('🔐 Mencoba auto-fill form Google...');
            await window.WixLoginUtils.delay(2000);
            
            const currentAccount = window.WixLoginCore?.currentAccount;
            if (!currentAccount) {
                console.log('❌ No current account for auto-fill');
                return;
            }
            
            // Fill email
            const emailInput = doc.querySelector('input[type="email"], #identifierId');
            if (emailInput) {
                console.log('📧 Mengisi email...');
                emailInput.value = currentAccount.email;
                emailInput.dispatchEvent(new Event('input', { bubbles: true }));
                emailInput.dispatchEvent(new Event('change', { bubbles: true }));
                
                await window.WixLoginUtils.delay(1000);
                
                const nextBtn = doc.querySelector('#identifierNext, button[data-primary-action-label="Next"]');
                if (nextBtn) {
                    nextBtn.click();
                    await window.WixLoginUtils.delay(3000);
                }
            }
            
            // Fill password
            const passwordInput = doc.querySelector('input[type="password"]');
            if (passwordInput) {
                console.log('🔑 Mengisi password...');
                passwordInput.value = currentAccount.password;
                passwordInput.dispatchEvent(new Event('input', { bubbles: true }));
                passwordInput.dispatchEvent(new Event('change', { bubbles: true }));
                
                await window.WixLoginUtils.delay(1000);
                
                const signInBtn = doc.querySelector('#passwordNext, button[data-primary-action-label="Sign in"]');
                if (signInBtn) {
                    signInBtn.click();
                }
            }
            
            console.log('✅ Auto-fill selesai');
            
        } catch (error) {
            console.log('❌ Auto-fill error:', error.message);
            GM_notification(
                `Penyelesaian manual diperlukan. Email: ${window.WixLoginCore?.currentAccount?.email || 'N/A'}`,
                'Auto-fill Gagal'
            );
        }
    },
    
    checkPopupBlocker() {
        console.log('🔍 Mengecek status popup blocker...');
        
        try {
            const testPopup = window.open('', '_blank', 'width=1,height=1');
            
            if (testPopup) {
                console.log('✅ Popup diizinkan');
                testPopup.close();
                return 'allowed';
            } else {
                console.log('❌ Popup diblokir');
                return 'blocked';
            }
        } catch (error) {
            console.log('⚠️ Test popup gagal:', error.message);
            return 'unknown';
        }
    },
    
    testPopupBlocker() {
        console.log('🧪 Testing popup blocker...');
        
        try {
            const testPopup = window.open('about:blank', '_blank', 'width=400,height=300');
            
            if (testPopup) {
                console.log('✅ Test popup berhasil dibuka');
                
                setTimeout(() => {
                    try {
                        testPopup.close();
                        console.log('✅ Test popup ditutup');
                    } catch (e) {
                        console.log('⚠️ Tidak bisa menutup test popup');
                    }
                }, 3000);
                
                GM_notification('Test popup berhasil! Popup berfungsi.', 'Hasil Test');
                return true;
                
            } else {
                console.log('❌ Test popup diblokir');
                GM_notification(
                    'Popup diblokir! Silakan izinkan popup untuk situs ini.',
                    'Popup Diblokir'
                );
                return false;
            }
        } catch (error) {
            console.log('❌ Test popup error:', error.message);
            return false;
        }
    },
    
    restore() {
        if (this.originalWindowOpen) {
            window.open = this.originalWindowOpen;
            this.originalWindowOpen = null;
            console.log('✅ window.open asli dipulihkan');
        }
        
        if (this.currentPopup && !this.currentPopup.closed) {
            try {
                this.currentPopup.close();
                console.log('✅ Popup ditutup');
            } catch (e) {
                console.log('⚠️ Tidak bisa menutup popup');
            }
        }
        this.currentPopup = null;
        this.popupBlocked = false;
    }
};

console.log('✅ WixLoginPopupBypass loaded');