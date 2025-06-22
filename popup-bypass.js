// ==WixLoginPopupBypass==
// Popup blocker bypass for Wix Google Login Script
// Version: 2.3

window.WixLoginPopupBypass = {
    
    currentPopup: null,
    originalWindowOpen: null,
    popupBlocked: false,
    bypassActive: false,
    popupInProgress: false,
    autoFillAttempted: false, // NEW: Track auto-fill attempts
    
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
                this.autoFillAttempted = false; // Reset auto-fill flag
                
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
                    // Reset flag after longer delay to allow auto-fill
                    setTimeout(() => {
                        this.popupInProgress = false;
                        console.log('🔄 Popup progress flag reset');
                    }, 15000); // Increased from 5000 to 15000
                }
            }
            
            // For non-Google popups, use original behavior
            return this.originalWindowOpen.apply(window, args);
        };
        
        this.bypassActive = true;
        console.log('✅ Popup bypass setup completed');
    },
    
    async handleGooglePopup(popup) {
        console.log('🔐 Handling Google popup...');
        
        try {
            // Wait for popup to load completely
            await this.delay(4000); // Increased delay
            
            // Check if popup is accessible
            if (popup && !popup.closed) {
                console.log('✅ Popup is accessible');
                
                // Start monitoring popup for completion
                this.monitorPopupCompletion(popup);
                
                // Try multiple auto-fill attempts
                await this.attemptAutoFill(popup);
                
            } else {
                console.log('❌ Popup not accessible or closed');
            }
            
        } catch (error) {
            console.log('❌ Popup handling error:', error.message);
        }
    },
    
    async attemptAutoFill(popup) {
        console.log('🔐 Starting auto-fill attempts...');
        
        const maxAttempts = 5;
        let attempt = 0;
        
        const tryAutoFill = async () => {
            attempt++;
            console.log(`🔐 Auto-fill attempt ${attempt}/${maxAttempts}`);
            
            try {
                // Check if popup is still open
                if (!popup || popup.closed) {
                    console.log('❌ Popup closed during auto-fill');
                    return false;
                }
                
                // Try to access popup document
                let popupDoc = null;
                try {
                    popupDoc = popup.document;
                    if (!popupDoc || popupDoc.readyState !== 'complete') {
                        console.log('⏳ Popup document not ready, waiting...');
                        await this.delay(2000);
                        return false;
                    }
                } catch (crossOriginError) {
                    console.log('⚠️ Cross-origin restriction, trying alternative methods...');
                    
                    // Try to detect Google login page by URL
                    try {
                        const popupUrl = popup.location.href;
                        console.log('🔍 Popup URL:', popupUrl);
                        
                        if (popupUrl.includes('accounts.google.com')) {
                            console.log('✅ Google login page detected');
                            // Send message to popup for auto-fill
                            this.sendAutoFillMessage(popup);
                            return true;
                        }
                    } catch (urlError) {
                        console.log('⚠️ Cannot access popup URL');
                    }
                    
                    return false;
                }
                
                // Attempt auto-fill with popup document
                if (popupDoc) {
                    console.log('🔐 Attempting auto-fill with popup document...');
                    const success = await this.fillGoogleForm(popupDoc);
                    
                    if (success) {
                        console.log('✅ Auto-fill successful');
                        this.autoFillAttempted = true;
                        return true;
                    }
                }
                
                return false;
                
            } catch (error) {
                console.log(`❌ Auto-fill attempt ${attempt} error:`, error.message);
                return false;
            }
        };
        
        // Try auto-fill multiple times with delays
        for (let i = 0; i < maxAttempts; i++) {
            const success = await tryAutoFill();
            
            if (success) {
                console.log('✅ Auto-fill completed successfully');
                break;
            }
            
            if (i < maxAttempts - 1) {
                console.log(`⏳ Waiting before next auto-fill attempt...`);
                await this.delay(3000);
            }
        }
        
        // If auto-fill failed, show manual instruction
        if (!this.autoFillAttempted) {
            console.log('⚠️ Auto-fill failed, showing manual instruction');
            this.showManualLoginInstruction();
        }
    },
    
    sendAutoFillMessage(popup) {
        console.log('📤 Sending auto-fill message to popup...');
        
        const currentAccount = window.WixLoginCore?.currentAccount;
        if (!currentAccount) {
            console.log('⚠️ No current account for auto-fill message');
            return;
        }
        
        try {
            // Try to send message to popup
            popup.postMessage({
                type: 'AUTO_FILL_GOOGLE',
                email: currentAccount.email,
                password: currentAccount.password
            }, '*');
            
            console.log('✅ Auto-fill message sent');
            
            // Also try to inject script into popup
            this.injectAutoFillScript(popup, currentAccount);
            
        } catch (error) {
            console.log('❌ Failed to send auto-fill message:', error.message);
        }
    },
    
    injectAutoFillScript(popup, account) {
        console.log('💉 Injecting auto-fill script into popup...');
        
        try {
            const script = popup.document.createElement('script');
            script.textContent = `
                (function() {
                    console.log('🔐 Auto-fill script injected');
                    
                    const fillForm = () => {
                        // Fill email
                        const emailInput = document.querySelector('input[type="email"], #identifierId');
                        if (emailInput && !emailInput.value) {
                            console.log('📧 Filling email...');
                            emailInput.value = '${account.email}';
                            emailInput.dispatchEvent(new Event('input', { bubbles: true }));
                            emailInput.dispatchEvent(new Event('change', { bubbles: true }));
                            
                            setTimeout(() => {
                                const nextBtn = document.querySelector('#identifierNext, button[jsname="LgbsSe"]');
                                if (nextBtn) {
                                    console.log('👆 Clicking next button...');
                                    nextBtn.click();
                                }
                            }, 1000);
                            
                            return true;
                        }
                        
                        // Fill password
                        const passwordInput = document.querySelector('input[type="password"]');
                        if (passwordInput && !passwordInput.value) {
                            console.log('🔑 Filling password...');
                            passwordInput.value = '${account.password}';
                            passwordInput.dispatchEvent(new Event('input', { bubbles: true }));
                            passwordInput.dispatchEvent(new Event('change', { bubbles: true }));
                            
                            setTimeout(() => {
                                const signInBtn = document.querySelector('#passwordNext, button[jsname="LgbsSe"]');
                                if (signInBtn) {
                                    console.log('👆 Clicking sign in button...');
                                    signInBtn.click();
                                }
                            }, 1000);
                            
                            return true;
                        }
                        
                        return false;
                    };
                    
                    // Try to fill form immediately
                    if (!fillForm()) {
                        // If not ready, try multiple times
                        let attempts = 0;
                        const maxAttempts = 10;
                        
                        const interval = setInterval(() => {
                            attempts++;
                            console.log('🔄 Auto-fill attempt', attempts);
                            
                            if (fillForm() || attempts >= maxAttempts) {
                                clearInterval(interval);
                                if (attempts >= maxAttempts) {
                                    console.log('⚠️ Auto-fill attempts exhausted');
                                }
                            }
                        }, 2000);
                    }
                })();
            `;
            
            popup.document.head.appendChild(script);
            console.log('✅ Auto-fill script injected successfully');
            
        } catch (error) {
            console.log('❌ Failed to inject auto-fill script:', error.message);
        }
    },
    
    async fillGoogleForm(doc) {
        try {
            console.log('🔐 Attempting to auto-fill Google form...');
            const currentAccount = window.WixLoginCore?.currentAccount;
            
            if (!currentAccount) {
                console.log('⚠️ No current account for auto-fill');
                return false;
            }
            
            let filledSomething = false;
            
            // Wait for page to be ready
            await this.delay(2000);
            
            // Fill email
            const emailInput = doc.querySelector('input[type="email"], #identifierId');
            if (emailInput && !emailInput.value) {
                console.log('📧 Filling email...');
                emailInput.value = currentAccount.email;
                emailInput.dispatchEvent(new Event('input', { bubbles: true }));
                emailInput.dispatchEvent(new Event('change', { bubbles: true }));
                emailInput.dispatchEvent(new Event('blur', { bubbles: true }));
                
                filledSomething = true;
                
                await this.delay(1500);
                
                // Click next button
                const nextBtn = doc.querySelector('#identifierNext, button[jsname="LgbsSe"], button[data-primary-action-label="Next"]');
                if (nextBtn) {
                    console.log('👆 Clicking next button...');
                    nextBtn.click();
                    await this.delay(3000);
                }
            }
            
            // Fill password
            const passwordInput = doc.querySelector('input[type="password"]');
            if (passwordInput && !passwordInput.value) {
                console.log('🔑 Filling password...');
                passwordInput.value = currentAccount.password;
                passwordInput.dispatchEvent(new Event('input', { bubbles: true }));
                passwordInput.dispatchEvent(new Event('change', { bubbles: true }));
                passwordInput.dispatchEvent(new Event('blur', { bubbles: true }));
                
                filledSomething = true;
                
                await this.delay(1500);
                
                // Click sign in button
                const signInBtn = doc.querySelector('#passwordNext, button[jsname="LgbsSe"], button[data-primary-action-label="Sign in"]');
                if (signInBtn) {
                    console.log('👆 Clicking sign in button...');
                    signInBtn.click();
                }
            }
            
            if (filledSomething) {
                console.log('✅ Auto-fill completed');
                return true;
            } else {
                console.log('⚠️ No form fields found to fill');
                return false;
            }
            
        } catch (error) {
            console.log('❌ Auto-fill error:', error.message);
            return false;
        }
    },
    
    showManualLoginInstruction() {
        console.log('📋 Showing manual login instruction...');
        
        const currentAccount = window.WixLoginCore?.currentAccount;
        if (currentAccount) {
            GM_notification(
                `Please complete Google login manually with: ${currentAccount.email}`,
                'Manual Login Required'
            );
            
            console.log(`📧 Manual login required with: ${currentAccount.email}`);
            console.log(`🔑 Password: ${currentAccount.password}`);
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
                                    if (popupUrl.includes('close') || popupUrl.includes('success') || popupUrl.includes('oauth/callback')) {
                                        console.log('✅ Login success detected in popup URL');
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
                        
                        // Timeout after 10 minutes (increased for manual login)
                        setTimeout(() => {
                            clearInterval(checkCompletion);
                            this.popupInProgress = false;
                            console.log('⏰ Popup monitoring timeout');
                        }, 600000); // 10 minutes
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
                    
                    // ==================== MESSAGE LISTENER FOR POPUP ====================
                    setupMessageListener() {
                        console.log('👂 Setting up message listener for popup communication...');
                        
                        window.addEventListener('message', (event) => {
                            if (event.data && event.data.type === 'GOOGLE_LOGIN_SUCCESS') {
                                console.log('✅ Received login success message from popup');
                                
                                // Close popup if still open
                                if (this.currentPopup && !this.currentPopup.closed) {
                                    try {
                                        this.currentPopup.close();
                                        console.log('✅ Popup closed after success message');
                                    } catch (e) {
                                        console.log('⚠️ Could not close popup');
                                    }
                                }
                                
                                // Reset flags
                                this.popupInProgress = false;
                                
                                // Trigger login success
                                setTimeout(() => {
                                    if (window.WixLoginCore?.onLoginSuccess) {
                                        window.WixLoginCore.onLoginSuccess();
                                    }
                                }, 1000);
                            }
                        });
                    },
                    
                    // ==================== ENHANCED AUTO-FILL WITH RETRY ====================
                    async enhancedAutoFill(popup) {
                        console.log('🚀 Starting enhanced auto-fill with retry mechanism...');
                        
                        const currentAccount = window.WixLoginCore?.currentAccount;
                        if (!currentAccount) {
                            console.log('⚠️ No account available for auto-fill');
                            return false;
                        }
                        
                        // Strategy 1: Direct document access
                        try {
                            if (popup.document && popup.document.readyState === 'complete') {
                                console.log('📄 Strategy 1: Direct document access');
                                const success = await this.fillGoogleForm(popup.document);
                                if (success) return true;
                            }
                        } catch (e) {
                            console.log('⚠️ Strategy 1 failed:', e.message);
                        }
                        
                        // Strategy 2: Script injection
                        try {
                            console.log('💉 Strategy 2: Script injection');
                            this.injectAutoFillScript(popup, currentAccount);
                            await this.delay(5000); // Wait for script to work
                        } catch (e) {
                            console.log('⚠️ Strategy 2 failed:', e.message);
                        }
                        
                        // Strategy 3: PostMessage communication
                        try {
                            console.log('📤 Strategy 3: PostMessage communication');
                            this.sendAutoFillMessage(popup);
                            await this.delay(3000);
                        } catch (e) {
                            console.log('⚠️ Strategy 3 failed:', e.message);
                        }
                        
                        // Strategy 4: Polling for form elements
                        try {
                            console.log('🔄 Strategy 4: Polling for form elements');
                            await this.pollAndFillForm(popup, currentAccount);
                        } catch (e) {
                            console.log('⚠️ Strategy 4 failed:', e.message);
                        }
                        
                        return false;
                    },
                    
                    async pollAndFillForm(popup, account) {
                        console.log('🔄 Starting form polling...');
                        
                        const maxPolls = 20;
                        let polls = 0;
                        
                        return new Promise((resolve) => {
                            const pollInterval = setInterval(async () => {
                                polls++;
                                console.log(`🔄 Form poll ${polls}/${maxPolls}`);
                                
                                try {
                                    if (popup.closed) {
                                        console.log('❌ Popup closed during polling');
                                        clearInterval(pollInterval);
                                        resolve(false);
                                        return;
                                    }
                                    
                                    // Try to access and fill form
                                    if (popup.document) {
                                        const emailInput = popup.document.querySelector('input[type="email"], #identifierId');
                                        const passwordInput = popup.document.querySelector('input[type="password"]');
                                        
                                        if (emailInput && !emailInput.value) {
                                            console.log('📧 Found email input during polling');
                                            emailInput.value = account.email;
                                            emailInput.dispatchEvent(new Event('input', { bubbles: true }));
                                            
                                            // Click next
                                            setTimeout(() => {
                                                const nextBtn = popup.document.querySelector('#identifierNext, button[jsname="LgbsSe"]');
                                                if (nextBtn) nextBtn.click();
                                            }, 1000);
                                        }
                                        
                                        if (passwordInput && !passwordInput.value) {
                                            console.log('🔑 Found password input during polling');
                                            passwordInput.value = account.password;
                                            passwordInput.dispatchEvent(new Event('input', { bubbles: true }));
                                            
                                            // Click sign in
                                            setTimeout(() => {
                                                const signInBtn = popup.document.querySelector('#passwordNext, button[jsname="LgbsSe"]');
                                                if (signInBtn) signInBtn.click();
                                            }, 1000);
                                            
                                            clearInterval(pollInterval);
                                            resolve(true);
                                            return;
                                        }
                                    }
                                    
                                } catch (error) {
                                    console.log(`⚠️ Poll ${polls} error:`, error.message);
                                }
                                
                                if (polls >= maxPolls) {
                                    console.log('⏰ Form polling timeout');
                                    clearInterval(pollInterval);
                                    resolve(false);
                                }
                            }, 2000);
                        });
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
                        this.autoFillAttempted = false;
                        
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
                            hasOriginalWindowOpen: !!this.originalWindowOpen,
                            autoFillAttempted: this.autoFillAttempted
                        };
                    },
                    
                    // ==================== MANUAL TEST FUNCTIONS ====================
                    async testAutoFill() {
                        console.log('🧪 Testing auto-fill functionality...');
                        
                        if (!this.currentPopup || this.currentPopup.closed) {
                            console.log('❌ No popup available for testing');
                            return false;
                        }
                        
                        const success = await this.enhancedAutoFill(this.currentPopup);
                        console.log(`🧪 Auto-fill test result: ${success ? 'Success' : 'Failed'}`);
                        return success;
                    },
                    
                    forceManualLogin() {
                        console.log('👤 Forcing manual login instruction...');
                        this.showManualLoginInstruction();
                    }
                };
                
                // Setup message listener on load
                window.WixLoginPopupBypass.setupMessageListener();
                
                console.log('✅ WixLoginPopupBypass loaded with enhanced auto-fill');
                console.log('🔧 Available test functions:');
                console.log('  - window.WixLoginPopupBypass.testAutoFill()');
                console.log('  - window.WixLoginPopupBypass.forceManualLogin()');
                
