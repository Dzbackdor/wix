// ==WixLoginUtils==
// Utility functions for Wix Google Login Script
// Version: 2.0

window.WixLoginUtils = {
    
    // Get config from main.js
    getConfig() {
        return window.WixLoginConfig || {};
    },
    
    // ==================== SITE DETECTION ====================
    isTargetSite() {
        const currentUrl = window.location.href;
        const config = this.getConfig();
        
        console.log('🔍 Checking current URL:', currentUrl);
        
        if (!config.daftar_wix || config.daftar_wix.length === 0) {
            console.log('⚠️ No target URLs configured');
            return false;
        }
        
        const isInList = config.daftar_wix.some(targetUrl => {
            try {
                const targetHost = new URL(targetUrl).hostname;
                const currentHost = window.location.hostname;
                const isMatch = currentHost === targetHost || currentUrl.includes(targetUrl);
                
                if (isMatch) {
                    console.log(`✅ URL match found: ${targetUrl}`);
                }
                
                return isMatch;
            } catch (e) {
                console.log('❌ Invalid URL in config:', targetUrl);
                return false;
            }
        });
        
        const metaGenerator = document.querySelector('meta[name="generator"]');
        const isWixSite = metaGenerator && metaGenerator.content.includes('Wix.com Website Builder');
        const isWixDomain = window.location.hostname.includes('wixsite.com');
        
        console.log('📊 Site detection results:');
        console.log('  - In target list:', isInList);
        console.log('  - Is Wix site (meta):', isWixSite);
        console.log('  - Is Wix domain:', isWixDomain);
        
        const isTarget = isInList && (isWixSite || isWixDomain);
        console.log(`🎯 Final result: ${isTarget ? 'TARGET SITE' : 'NOT TARGET SITE'}`);
        
        return isTarget;
    },
    
    // ==================== LOGIN DETECTION ====================
    isLoggedIn() {
        const config = this.getConfig();
        const logoutSelector = config.selectors?.logout || '[data-hook="user-auth-logout"]';
        
        const logoutButton = document.querySelector(logoutSelector);
        const isLogged = logoutButton !== null;
        
        if (isLogged) {
            console.log('✅ LOGGED IN - Found logout button');
        } else {
            console.log('❌ NOT LOGGED IN - No logout button');
        }
        
        return isLogged;
    },
    
    // ==================== ELEMENT WAITING WITH ENHANCED DETECTION ====================
    async waitForElementWithScroll(selector, timeout = 60000) {
        console.log(`🔍 Waiting for element with scroll: ${selector}`);
        
        const startTime = Date.now();
        
        // First try: immediate check
        let element = document.querySelector(selector);
        if (element) {
            console.log(`✅ Element found immediately: ${selector}`);
            this.highlightElement(element);
            return element;
        }
        
        // Second try: wait a bit for dynamic content
        await this.delay(2000);
        element = document.querySelector(selector);
        if (element) {
            console.log(`✅ Element found after delay: ${selector}`);
            this.highlightElement(element);
            return element;
        }
        
        // Third try: smart scroll search
        try {
            element = await this.smartScroll(selector, timeout);
            return element;
        } catch (scrollError) {
            console.log('❌ Smart scroll failed, trying alternative selectors...');
            
            // Fourth try: alternative selectors
            const alternatives = this.getAlternativeSelectors(selector);
            for (const altSelector of alternatives) {
                console.log(`🔍 Trying alternative selector: ${altSelector}`);
                element = document.querySelector(altSelector);
                if (element) {
                    console.log(`✅ Found with alternative selector: ${altSelector}`);
                    this.highlightElement(element);
                    return element;
                }
            }
            
            // Fifth try: manual search with timeout
            return new Promise((resolve, reject) => {
                let attempts = 0;
                const maxAttempts = Math.floor(timeout / 1000);
                
                const searchInterval = setInterval(async () => {
                    attempts++;
                    
                    // Try main selector
                    const el = document.querySelector(selector);
                    if (el) {
                        clearInterval(searchInterval);
                        console.log(`✅ Found via manual search: ${selector}`);
                        this.highlightElement(el);
                        resolve(el);
                        return;
                    }
                    
                    // Try alternatives
                    for (const altSelector of alternatives) {
                        const altEl = document.querySelector(altSelector);
                        if (altEl) {
                            clearInterval(searchInterval);
                            console.log(`✅ Found via alternative in manual search: ${altSelector}`);
                            this.highlightElement(altEl);
                            resolve(altEl);
                            return;
                        }
                    }
                    
                    // Scroll periodically
                    if (attempts % 3 === 0) {
                        window.scrollBy(0, 200);
                    }
                    
                    if (Date.now() - startTime > timeout || attempts >= maxAttempts) {
                        clearInterval(searchInterval);
                        console.log(`❌ Timeout waiting for: ${selector}`);
                        console.log(`   Tried ${attempts} attempts over ${Date.now() - startTime}ms`);
                        reject(new Error(`Timeout menunggu: ${selector}`));
                        return;
                    }
                    
                    if (attempts % 10 === 0) {
                        console.log(`🔍 Manual search attempt ${attempts}/${maxAttempts} for: ${selector}`);
                    }
                }, 1000);
            });
        }
    },
    
    // Get alternative selectors based on the main selector
    getAlternativeSelectors(mainSelector) {
        const alternatives = [];
        
        // For login button
        if (mainSelector.includes('login-as-member')) {
            alternatives.push(
                '[data-testid="login-button"]',
                '[data-hook*="login"]',
                'button[aria-label*="login"]',
                'button[aria-label*="Log in"]',
                '.login-button',
                '[role="button"]:contains("Log in")',
                '[role="button"]:contains("Login")',
                'button:contains("Log in")',
                'button:contains("Login")',
                'a[href*="login"]'
            );
        }
        
        // For signup switch
        if (mainSelector.includes('switchToSignUp')) {
            alternatives.push(
                '[data-testid="signup-switch"]',
                '[data-testid="switch-signup"]',
                '[data-hook*="signup"]',
                'button[aria-label*="sign up"]',
                'button[aria-label*="Sign up"]',
                '.signup-switch',
                '[role="button"]:contains("Sign up")',
                'button:contains("Sign up")',
                'a:contains("Sign up")'
            );
        }
        
        // For comment box
        if (mainSelector.includes('comment-box')) {
            alternatives.push(
                '[data-testid="comment-box"]',
                '[data-hook*="comment"]',
                '.comment-box',
                '.comment-placeholder',
                '[placeholder*="comment"]',
                '[placeholder*="Comment"]',
                'textarea[placeholder*="comment"]',
                'input[placeholder*="comment"]'
            );
        }
        
        // For Google buttons
        if (mainSelector.includes('google') || mainSelector.includes('Google')) {
            const config = this.getConfig();
            if (config.selectors?.googleButtons) {
                alternatives.push(...config.selectors.googleButtons);
            }
        }
        
        return alternatives;
    },
    
    async smartScroll(selector, timeout = 60000) {
        console.log(`🔍 Smart scrolling to find: ${selector}`);
        
        const config = this.getConfig();
        const maxScrolls = config.scroll?.maxScrolls || 20;
        const scrollStep = config.scroll?.step || 300;
        const waitAfterScroll = config.scroll?.waitAfterScroll || 1000;
        
        const startTime = Date.now();
        
        for (let i = 0; i < maxScrolls; i++) {
            console.log(`📜 Scroll attempt ${i + 1}/${maxScrolls}`);
            
            const element = document.querySelector(selector);
            if (element) {
                console.log(`✅ Found element on scroll ${i + 1}`);
                await this.scrollToElement(element);
                return element;
            }
            
            // Check timeout
            if (Date.now() - startTime > timeout) {
                throw new Error(`Timeout during smart scroll for: ${selector}`);
            }
            
            // Scroll down
            window.scrollBy(0, scrollStep);
            await this.delay(waitAfterScroll);
            
            // Check if we've reached the bottom
            const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
            const scrollHeight = document.documentElement.scrollHeight;
            const clientHeight = window.innerHeight;
            
            if (scrollTop + clientHeight >= scrollHeight - 100) {
                console.log('📜 Reached bottom of page');
                break;
            }
        }
        
        throw new Error(`Element not found after ${maxScrolls} scroll attempts: ${selector}`);
    },
    
    // ==================== UTILITY FUNCTIONS ====================
    async scrollToElement(element) {
        if (!element) return;
        
        console.log('📜 Scrolling to element...');
        element.scrollIntoView({ 
            behavior: 'smooth', 
            block: 'center',
            inline: 'center'
        });
        
        await this.delay(1000);
        
        // Highlight element
        this.highlightElement(element);
    },
    
    highlightElement(element) {
        if (!element) return;
        
        const originalBorder = element.style.border;
        const originalBackground = element.style.backgroundColor;
        
        element.style.border = '3px solid #ff6b6b';
        element.style.backgroundColor = 'rgba(255, 107, 107, 0.1)';
        element.style.transition = 'all 0.3s ease';
        
        setTimeout(() => {
            element.style.border = originalBorder;
            element.style.backgroundColor = originalBackground;
        }, 3000);
    },
    
    getRandomAccount() {
        const config = this.getConfig();
        if (!config.akun_google || config.akun_google.length === 0) {
            throw new Error('No Google accounts configured');
        }
        
        const account = config.akun_google[Math.floor(Math.random() * config.akun_google.length)];
        console.log(`👤 Selected account: ${account.email}`);
        return account;
    },
    
    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    },
    
    // ==================== ENHANCED ELEMENT DETECTION ====================
    async findElementWithMultipleStrategies(selectors, description = 'element') {
        console.log(`🔍 Finding ${description} with multiple strategies...`);
        
        if (typeof selectors === 'string') {
            selectors = [selectors];
        }
        
        // Strategy 1: Direct query
        for (const selector of selectors) {
            const element = document.querySelector(selector);
            if (element) {
                console.log(`✅ Found ${description} with direct query: ${selector}`);
                this.highlightElement(element);
                return element;
            }
        }
        
        // Strategy 2: Wait and retry
        await this.delay(2000);
        for (const selector of selectors) {
            const element = document.querySelector(selector);
            if (element) {
                console.log(`✅ Found ${description} after delay: ${selector}`);
                this.highlightElement(element);
                return element;
            }
        }
        
        // Strategy 3: Scroll search
        for (const selector of selectors) {
            try {
                const element = await this.waitForElementWithScroll(selector, 30000);
                console.log(`✅ Found ${description} with scroll: ${selector}`);
                return element;
            } catch (error) {
                console.log(`⚠️ Scroll search failed for ${selector}:`, error.message);
            }
        }
        
        // Strategy 4: Text-based search
        const textPatterns = this.getTextPatternsForElement(description);
        for (const pattern of textPatterns) {
            const elements = document.querySelectorAll('button, [role="button"], a, input[type="button"], input[type="submit"]');
            for (const el of elements) {
                const text = el.textContent?.toLowerCase().trim() || '';
                const ariaLabel = el.getAttribute('aria-label')?.toLowerCase() || '';
                
                if (text.includes(pattern) || ariaLabel.includes(pattern)) {
                    console.log(`✅ Found ${description} by text pattern "${pattern}": ${text || ariaLabel}`);
                    this.highlightElement(el);
                    return el;
                }
            }
        }
        
        throw new Error(`Could not find ${description} with any strategy`);
    },
    
    getTextPatternsForElement(description) {
        const patterns = {
            'login button': ['log in', 'login', 'sign in', 'member'],
            'signup switch': ['sign up', 'signup', 'register', 'create account'],
            'comment box': ['comment', 'write a comment', 'add comment'],
            'google button': ['google', 'sign up with google', 'continue with google']
        };
        
        return patterns[description.toLowerCase()] || [];
    },
    
    // ==================== PAGE STATE DETECTION ====================
    isPageReady() {
        return document.readyState === 'complete' && 
               document.querySelector('body') !== null &&
               window.location.href !== 'about:blank';
    },
    
    async waitForPageReady(timeout = 30000) {
        console.log('⏳ Waiting for page to be ready...');
        
        const startTime = Date.now();
        
        while (!this.isPageReady() && (Date.now() - startTime) < timeout) {
            await this.delay(500);
        }
        
        if (!this.isPageReady()) {
            throw new Error('Page not ready within timeout');
        }
        
        console.log('✅ Page is ready');
        
        // Additional delay for dynamic content
        await this.delay(2000);
    },
    
    // ==================== ERROR HANDLING ====================
    createDetailedError(message, context = {}) {
        const error = new Error(message);
        error.context = {
            url: window.location.href,
            timestamp: new Date().toISOString(),
            userAgent: navigator.userAgent,
            ...context
        };
        
        console.error('🚨 Detailed error:', error);
        return error;
    },
    
    // ==================== ELEMENT INTERACTION ====================
    async clickElementAdvanced(element, description = '') {
        if (!element) {
            throw this.createDetailedError(`Cannot click: ${description} - element not found`);
        }
        
        console.log(`🖱️ Advanced clicking: ${description}`);
        
        // Scroll to element first
        await this.scrollToElement(element);
        await this.delay(500);
        
        // Multiple click methods
        const clickMethods = [
            () => {
                console.log('   Method 1: Standard click()');
                element.click();
            },
            () => {
                console.log('   Method 2: Focus + click');
                element.focus();
                element.click();
            },
            () => {
                console.log('   Method 3: MouseEvent');
                const event = new MouseEvent('click', {
                    bubbles: true,
                    cancelable: true,
                    view: window,
                    isTrusted: true
                });
                element.dispatchEvent(event);
            },
            () => {
                console.log('   Method 4: Direct onclick');
                if (element.onclick) {
                    element.onclick.call(element);
                } else {
                    element.click();
                }
            }
        ];
        
        // Try each click method
        for (let i = 0; i < clickMethods.length; i++) {
            try {
                console.log(`🖱️ Trying click method ${i + 1}/${clickMethods.length}`);
                clickMethods[i]();
                await this.delay(1500);
                
                // Check if click worked (basic check)
                if (this.checkBasicClickSuccess()) {
                    console.log(`✅ Click method ${i + 1} successful!`);
                    return true;
                }
            } catch (error) {
                console.log(`   Click method ${i + 1} failed:`, error.message);
            }
        }
        
        console.log('⚠️ All click methods attempted');
        return false;
    },
    
    checkBasicClickSuccess() {
        // Basic checks for click success
        // This can be overridden by specific implementations
        return true;
    },
    
    // ==================== GOOGLE BUTTON DETECTION ====================
    async findGoogleButton() {
        console.log('🔍 Enhanced Google button search...');
        
        const config = this.getConfig();
        const selectors = config.selectors?.googleButtons || [
            '[aria-label="Sign up with Google"]',
            '[aria-label*="Google"]',
            'button[aria-label*="Google"]',
            '[data-testid*="google"]',
            '[data-testid*="Google"]',
            'button[data-testid*="google"]',
            'button[data-testid*="Google"]',
            '.google-signup-button',
            '.google-login-button',
            'button[title*="Google"]',
            '[role="button"][aria-label*="Google"]',
            'div[role="button"][aria-label*="Google"]',
            '[data-hook*="google"]',
            '[data-hook*="Google"]',
            'button[data-hook*="google"]',
            'button[data-hook*="Google"]',
            '[class*="google"]',
            '[class*="Google"]'
        ];
        
        // Try direct selectors first
        for (const selector of selectors) {
            try {
                const elements = document.querySelectorAll(selector);
                
                for (const element of elements) {
                    if (this.isGoogleButton(element)) {
                        console.log(`✅ Google button found with selector: ${selector}`);
                        this.logButtonDetails(element);
                        return element;
                    }
                }
            } catch (error) {
                console.log(`⚠️ Selector failed: ${selector}`, error.message);
            }
        }
        
        // Fallback: search by text content and attributes
        console.log('🔍 Fallback: searching by text content and attributes...');
        const allButtons = document.querySelectorAll('button, [role="button"], input[type="button"], input[type="submit"], div[onclick], a');
        
        for (const button of allButtons) {
            if (this.isGoogleButton(button)) {
                console.log('✅ Google button found by content analysis');
                this.logButtonDetails(button);
                return button;
            }
        }
        
        return null;
    },
    
    isGoogleButton(element) {
        if (!element) return false;
        
        const text = element.textContent?.toLowerCase() || '';
        const ariaLabel = element.getAttribute('aria-label')?.toLowerCase() || '';
        const title = element.getAttribute('title')?.toLowerCase() || '';
        const className = element.className?.toLowerCase() || '';
        const dataTestId = element.getAttribute('data-testid')?.toLowerCase() || '';
        const dataHook = element.getAttribute('data-hook')?.toLowerCase() || '';
        
        const googleKeywords = ['google', 'sign up with google', 'continue with google', 'login with google'];
        
        return googleKeywords.some(keyword => 
            text.includes(keyword) || 
            ariaLabel.includes(keyword) || 
            title.includes(keyword) ||
            className.includes(keyword) ||
            dataTestId.includes(keyword) ||
            dataHook.includes(keyword)
        );
    },
    
    logButtonDetails(element) {
        console.log('🔍 Button details:', {
            text: element.textContent?.trim().substring(0, 50),
            tagName: element.tagName,
            className: element.className,
            ariaLabel: element.getAttribute('aria-label'),
            title: element.getAttribute('title'),
            dataTestId: element.getAttribute('data-testid'),
            dataHook: element.getAttribute('data-hook'),
            id: element.id
        });
    },
    
    // ==================== FORM DETECTION ====================
    async findCommentBox() {
        console.log('🔍 Finding comment box...');
        
        const config = this.getConfig();
        const selector = config.selectors?.commentBox || '[data-hook="comment-box-placeholder-text"]';
        
        try {
            return await this.findElementWithMultipleStrategies([
                selector,
                '[data-testid="comment-box"]',
                '[data-hook*="comment"]',
                '.comment-box',
                '.comment-placeholder',
                '[placeholder*="comment"]',
                'textarea[placeholder*="comment"]'
            ], 'comment box');
        } catch (error) {
            throw this.createDetailedError('Comment box not found', { 
                selector,
                searchedSelectors: 7
            });
        }
    },
    
    async findLoginButton() {
        console.log('🔍 Finding login button...');
        
        const config = this.getConfig();
        const selector = config.selectors?.loginButton || '[data-hook="login-as-member-text-button"]';
        
        try {
            return await this.findElementWithMultipleStrategies([
                selector,
                '[data-testid="login-button"]',
                '[data-hook*="login"]',
                'button[aria-label*="login"]',
                'button[aria-label*="Log in"]',
                '.login-button',
                'button:contains("Log in")',
                'button:contains("Login")',
                'a[href*="login"]'
            ], 'login button');
        } catch (error) {
            throw this.createDetailedError('Login button not found', { 
                selector,
                searchedSelectors: 9
            });
        }
    },
    
    async findSignupSwitch() {
        console.log('🔍 Finding signup switch...');
        
        const config = this.getConfig();
        const selector = config.selectors?.signupSwitch || '[data-testid="switchToSignUp"]';
        
        try {
            return await this.findElementWithMultipleStrategies([
                selector,
                '[data-testid="signup-switch"]',
                '[data-testid="switch-signup"]',
                '[data-hook*="signup"]',
                'button[aria-label*="sign up"]',
                'button[aria-label*="Sign up"]',
                '.signup-switch',
                'button:contains("Sign up")',
                'a:contains("Sign up")'
            ], 'signup switch');
        } catch (error) {
            throw this.createDetailedError('Signup switch not found', { 
                selector,
                searchedSelectors: 9
            });
        }
    },
    
    // ==================== PAGE ANALYSIS ====================
    analyzePageElements() {
        console.log('🔍 Analyzing page elements...');
        
        const analysis = {
            timestamp: new Date().toISOString(),
            url: window.location.href,
            title: document.title,
            elements: {
                buttons: document.querySelectorAll('button').length,
                inputs: document.querySelectorAll('input').length,
                forms: document.querySelectorAll('form').length,
                links: document.querySelectorAll('a').length
            },
            wixElements: {
                dataHooks: document.querySelectorAll('[data-hook]').length,
                dataTestIds: document.querySelectorAll('[data-testid]').length
            },
            loginElements: {
                commentBox: !!document.querySelector('[data-hook="comment-box-placeholder-text"]'),
                loginButton: !!document.querySelector('[data-hook="login-as-member-text-button"]'),
                signupSwitch: !!document.querySelector('[data-testid="switchToSignUp"]'),
                logoutButton: !!document.querySelector('[data-hook="user-auth-logout"]')
            },
            googleElements: []
        };
        
        // Find potential Google buttons
        const potentialGoogleButtons = document.querySelectorAll('button, [role="button"], input[type="button"]');
        potentialGoogleButtons.forEach((btn, index) => {
            if (this.isGoogleButton(btn)) {
                analysis.googleElements.push({
                    index,
                    text: btn.textContent?.trim().substring(0, 30),
                    selector: this.generateSelector(btn)
                });
            }
        });
        
        console.log('📊 Page analysis:', analysis);
        return analysis;
    },
    
    generateSelector(element) {
        if (element.id) return `#${element.id}`;
        if (element.getAttribute('data-testid')) return `[data-testid="${element.getAttribute('data-testid')}"]`;
        if (element.getAttribute('data-hook')) return `[data-hook="${element.getAttribute('data-hook')}"]`;
        if (element.className) return `.${element.className.split(' ')[0]}`;
        return element.tagName.toLowerCase();
    },
    
    // ==================== DEBUGGING HELPERS ====================
    debugElementSearch(selector, description = 'element') {
        console.log(`🔧 Debug search for ${description}:`, selector);
        
        const element = document.querySelector(selector);
        console.log(`  - Direct query result:`, element);
        
        if (!element) {
            console.log(`  - Checking if selector exists in DOM...`);
            const allElements = document.querySelectorAll('*');
            let found = false;
            
            allElements.forEach(el => {
                if (el.matches && el.matches(selector)) {
                    console.log(`  - Found matching element:`, el);
                    found = true;
                }
            });
            
            if (!found) {
                console.log(`  - No elements match selector: ${selector}`);
                
                // Try partial matches
                if (selector.includes('[data-hook=')) {
                    const dataHookElements = document.querySelectorAll('[data-hook]');
                    console.log(`  - Found ${dataHookElements.length} elements with data-hook`);
                    dataHookElements.forEach(el => {
                        console.log(`    - data-hook="${el.getAttribute('data-hook')}"`);
                    });
                }
                
                if (selector.includes('[data-testid=')) {
                    const dataTestIdElements = document.querySelectorAll('[data-testid]');
                    console.log(`  - Found ${dataTestIdElements.length} elements with data-testid`);
                    dataTestIdElements.forEach(el => {
                        console.log(`    - data-testid="${el.getAttribute('data-testid')}"`);
                    });
                }
            }
        }
        
        return element;
    },
    
    // ==================== STORAGE HELPERS ====================
    saveElementSnapshot(key, element) {
        if (!element) return;
        
        const snapshot = {
            timestamp: Date.now(),
            url: window.location.href,
            selector: this.generateSelector(element),
            text: element.textContent?.trim(),
            attributes: {
                id: element.id,
                className: element.className,
                dataHook: element.getAttribute('data-hook'),
                dataTestId: element.getAttribute('data-testid'),
                ariaLabel: element.getAttribute('aria-label')
            }
        };
        
        GM_setValue(`element_snapshot_${key}`, JSON.stringify(snapshot));
        console.log(`💾 Saved element snapshot: ${key}`);
    },
    
    loadElementSnapshot(key) {
        try {
            const snapshotJson = GM_getValue(`element_snapshot_${key}`, null);
            if (snapshotJson) {
                const snapshot = JSON.parse(snapshotJson);
                console.log(`📂 Loaded element snapshot: ${key}`, snapshot);
                return snapshot;
            }
        } catch (error) {
            console.log(`⚠️ Failed to load snapshot: ${key}`, error.message);
        }
        return null;
    }
};

console.log('✅ WixLoginUtils loaded with enhanced element detection');
