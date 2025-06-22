// ==WixLoginPopupBypass==
// Popup blocker bypass for Wix Google Login Script
// Version: 2.2

window.WixLoginPopupBypass = {
    
    currentPopup: null,
    originalWindowOpen: null,
    popupBlocked: false,
    bypassActive: false,
    popupInProgress: false, // NEW: Prevent double popup
    
    setupPopupBypass() {
        // Prevent multiple setup
        if (this.bypassActive) {
            console.log('⚠️ Popup bypass already active, skipping setup');
            return;
        }
        
        console.log('🚫 Setting up popup blocker bypass...');
        
        // Store original window.open
        if (!this.originalWindowOpen) {
            this.originalWindowOpen = window.open;
        }
        
        // Override window.open to prevent blocking
        window.open = (...args) => {
            console.log('🔓 Intercepted window.open call:', args[0]);
            
            // PREVENT DOUBLE POPUP
            if (this.popupInProgress) {
                console.log('⚠️ Popup already in progress, blocking duplicate');
                return null;
            }
            
            // Check if it's Google OAuth
            if (args[0] && args[0].includes('accounts.google.com')) {
                console.log('✅ Google OAuth detected, allowing popup...');
                
                // Set popup in progress flag
                this.popupInProgress = true;
                
                // Create popup with user gesture context
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
                } finally {
                    // Reset flag after delay
                    setTimeout(() => {
                        this.popupInProgress = false;
                        console.log('🔄 Popup progress flag reset');
                    }, 5000);
                }
            }
            
            // For non-Google popups, use original behavior
            return this.originalWindowOpen.apply(window, args);
        };
        
        this.bypassActive = true;
        console.log('✅ Popup bypass setup completed');
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
        this.popupInProgress = false;
        
        GM_notification(
            'Popup blocked! Please disable popup blocker for this site.',
            'Popup Blocked',
            null,
            () => {
                // Try to open in new tab using GM_openInTab
                try {
                    GM_openInTab(url, { active: true });
                    console.log('✅ Opened Google login in new tab');
                } catch (error) {
                    console.log('❌ Could not open new tab:', error.message);
                    // Fallback: direct navigation
                    window.location.href = url;
                }
            }
        );
    },
    
    async handleGooglePopup(popup) {
        console.log('🔐 Handling Google popup...');
        
        try {
            // Wait for popup to load
            setTimeout(async () => {
                // Check if popup is accessible
                if (popup && !popup.closed) {
                    console.log('✅ Popup is accessible');
                    
                    // Monitor popup for completion
                    this.monitorPopupCompletion(popup);
                    
                    // Try to auto-fill if accessible
                    try {
                        if (popup.document && popup.document.readyState === 'complete') {
                            console.log('🔐 Attempting auto-fill...');
                            await this.fillGoogleForm(popup.document);
                        }
                    } catch (crossOriginError) {
                        console.log('⚠️ Cross-origin restriction, manual completion required');
                    }
                } else {
                    console.log('❌ Popup not accessible or closed');
                }
            }, 3000);
            
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
                    
                    // Reset popup progress flag
                    this.popupInProgress = false;
                    
                    // Check if login was successful
                    setTimeout(() => {
                        if (window.WixLoginUtils?.isLoggedIn()) {
                            console.log('🎉 Login successful after popup close');
                            if (window.WixLoginCore?.onLoginSuccess) {
                                window.WixLoginCore.onLoginSuccess();
                            }
                        } else {
                            console.log('⚠️ Popup closed but not logged in');
                            window.WixLoginUI?.updateStatus('⚠️ Login may have failed');
                        }
                    }, 2000);
                    
                    return;
                }
                
                // Try to detect successful login in popup
                try {
                    const popupUrl = popup.location.href;
                    if (popupUrl.includes('close') || popupUrl.includes('success')) {
                        console.log('✅ Login success detected in popup');
                        popup.close();
                        clearInterval(checkCompletion);
                        
                        // Reset popup progress flag
                        this.popupInProgress = false;
                        
                        setTimeout(() => {
                            if (window.WixLoginCore?.onLoginSuccess) {
                                window.WixLoginCore.onLoginSuccess();
                            }
                        }, 1000);
                    }
                } catch (crossOriginError) {
                    // Expected for cross-origin popup
                }
                
            } catch (error) {
                console.log('⚠️ Popup monitoring error:', error.message);
                clearInterval(checkCompletion);
                this.popupInProgress = false;
            }
        }, 1000);
        
        // Timeout after 5 minutes
        setTimeout(() => {
            clearInterval(checkCompletion);
            this.popupInProgress = false;
            console.log('⏰ Popup monitoring timeout');
        }, 300000);
    },
    
    async fillGoogleForm(doc) {
        try {
            console.log('🔐 Attempting to auto-fill Google form...');
            const currentAccount = window.WixLoginCore?.currentAccount;
            
            if (!currentAccount) {
                console.log('⚠️ No current account for auto-fill');
                return;
            }
            
            await this.delay(2000);
            
            // Fill email
            const emailInput = doc.querySelector('input[type="email"], #identifierId');
            if (emailInput) {
                console.log('📧 Filling email...');
                emailInput.value = currentAccount.email;
                emailInput.dispatchEvent(new Event('input', { bubbles: true }));
                emailInput.dispatchEvent(new Event('change', { bubbles: true }));
                
                await this.delay(1000);
                
                const nextBtn = doc.querySelector('#identifierNext, button[data-primary-action-label="Next"]');
                if (nextBtn) {
                    nextBtn.click();
                    await this.delay(3000);
                }
            }
            
            // Fill password
            const passwordInput = doc.querySelector('input[type="password"]');
            if (passwordInput) {
                console.log('🔑 Filling password...');
                passwordInput.value = currentAccount.password;
                passwordInput.dispatchEvent(new Event('input', { bubbles: true }));
                passwordInput.dispatchEvent(new Event('change', { bubbles: true }));
                
                await this.delay(1000);
                
                const signInBtn = doc.querySelector('#passwordNext, button[data-primary-action-label="Sign in"]');
                if (signInBtn) {
                    signInBtn.click();
                }
            }
            
            console.log('✅ Auto-fill completed');
            
        } catch (error) {
            console.log('❌ Auto-fill error:', error.message);
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
    
    // ==================== RESET FUNCTIONS ====================
    resetPopupBypass() {
        console.log('🔄 Resetting popup bypass...');
        
        // Restore original window.open
        if (this.originalWindowOpen) {
            window.open = this.originalWindowOpen;
            this.originalWindowOpen = null;
            console.log('✅ Restored original window.open');
        }
        
        // Close current popup if open
        if (this.currentPopup && !this.currentPopup.closed) {
            try {
                this.currentPopup.close();
                console.log('✅ Current popup closed');
            } catch (e) {
                console.log('⚠️ Could not close current popup');
            }
        }
        
        // Reset flags
        this.currentPopup = null;
        this.popupBlocked = false;
        this.bypassActive = false;
        this.popupInProgress = false;
        
        console.log('✅ Popup bypass reset completed');
    },
    
    // ==================== UTILITY ====================
    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    },
    
    // ==================== DEBUG ====================
    getPopupStatus() {
        return {
            bypassActive: this.bypassActive,
            popupInProgress: this.popupInProgress,
            hasCurrentPopup: !!this.currentPopup && !this.currentPopup.closed,
            popupBlocked: this.popupBlocked,
            hasOriginalWindowOpen: !!this.originalWindowOpen
        };
    }
};

console.log('✅ WixLoginPopupBypass loaded with double popup prevention');
