// ==WixLoginUtils==
// Utility functions for Wix Google Login Script
// Version: 1.0

window.WixLoginUtils = {
    
    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    },
    
    async scrollToElement(element) {
        if (!element) return;
        
        console.log('📜 Scrolling ke element...');
        element.scrollIntoView({ 
            behavior: 'smooth', 
            block: 'center',
            inline: 'center'
        });
        
        await this.delay(1000);
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
    
    async smartScroll(selector) {
        console.log(`🔍 Smart scrolling untuk mencari: ${selector}`);
        
        const config = window.WixLoginConfig;
        const maxScrolls = config.scroll.maxScrolls;
        const scrollStep = config.scroll.step;
        
        for (let i = 0; i < maxScrolls; i++) {
            console.log(`📜 Scroll attempt ${i + 1}/${maxScrolls}`);
            
            const element = document.querySelector(selector);
            if (element) {
                console.log(`✅ Element ditemukan pada scroll ${i + 1}`);
                await this.scrollToElement(element);
                return element;
            }
            
            window.scrollBy(0, scrollStep);
            await this.delay(config.scroll.waitAfterScroll);
            
            const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
            const scrollHeight = document.documentElement.scrollHeight;
            const clientHeight = window.innerHeight;
            
            if (scrollTop + clientHeight >= scrollHeight - 100) {
                console.log('📜 Mencapai bagian bawah halaman');
                break;
            }
        }
        
        throw new Error(`Element tidak ditemukan setelah ${maxScrolls} scroll attempts: ${selector}`);
    },
    
    async waitForElementWithScroll(selector, timeout = 60000) {
        console.log(`🔍 Menunggu element dengan scroll: ${selector}`);
        
        const startTime = Date.now();
        
        let element = document.querySelector(selector);
        if (element) {
            console.log(`✅ Element ditemukan langsung: ${selector}`);
            this.highlightElement(element);
            return element;
        }
        
        try {
            element = await this.smartScroll(selector);
            return element;
        } catch (scrollError) {
            console.log('❌ Smart scroll gagal, mencoba pencarian manual...');
            
            return new Promise((resolve, reject) => {
                let attempts = 0;
                const maxAttempts = 30;
                
                const searchInterval = setInterval(async () => {
                    attempts++;
                    
                    const el = document.querySelector(selector);
                    if (el) {
                        clearInterval(searchInterval);
                        console.log(`✅ Ditemukan via pencarian manual: ${selector}`);
                        this.highlightElement(el);
                        resolve(el);
                        return;
                    }
                    
                    window.scrollBy(0, 200);
                    
                    if (Date.now() - startTime > timeout || attempts >= maxAttempts) {
                        clearInterval(searchInterval);
                        reject(new Error(`Timeout menunggu: ${selector}`));
                        return;
                    }
                    
                    console.log(`🔍 Pencarian manual attempt ${attempts}/${maxAttempts}`);
                }, 1000);
            });
        }
    },
    
    getRandomAccount() {
        const config = window.WixLoginConfig;
        const account = config.akun_google[Math.floor(Math.random() * config.akun_google.length)];
        console.log(`👤 Akun terpilih: ${account.email}`);
        return account;
    },
    
    isTargetSite() {
        const currentUrl = window.location.href;
        const config = window.WixLoginConfig;
        
        console.log('🔍 Checking current URL:', currentUrl);
        
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
    
    isLoggedIn() {
        const config = window.WixLoginConfig;
        const logoutButton = document.querySelector(config.selectors.logout);
        const isLogged = logoutButton !== null;
        
        if (isLogged) {
            console.log('✅ SUDAH LOGIN - Tombol logout ditemukan');
        } else {
            console.log('❌ BELUM LOGIN - Tidak ada tombol logout');
        }
        
        return isLogged;
    }
};

console.log('✅ WixLoginUtils loaded');