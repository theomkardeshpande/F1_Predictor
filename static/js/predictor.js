class F1Predictor {
    constructor() {
        this.initializeElements();
        this.setupEventListeners();
        this.initializeSliders();
    }

    initializeElements() {
        // Form elements
        this.form = document.getElementById('predictionForm');
        this.resetBtn = document.getElementById('resetBtn');
        this.predictBtn = document.getElementById('predictBtn');
        this.resultsSection = document.getElementById('resultsSection');
        this.predictedTimeElement = document.getElementById('predictedTime');

        // Button states
        this.btnText = this.predictBtn.querySelector('.btn-text');
        this.btnLoader = this.predictBtn.querySelector('.btn-loader');

        // Slider configuration with defaults
        this.sliderConfig = {
            qualifying_time: { min: 69.0, max: 73.0, default: 70.5, unit: 's', decimals: 1 },
            rain_probability: { min: 0, max: 100, default: 20, unit: '%', decimals: 0 },
            temperature: { min: 15, max: 40, default: 25, unit: '°C', decimals: 0 },
            team_performance: { min: 0.0, max: 1.0, default: 0.70, unit: '', decimals: 2 },
            clean_air_pace: { min: 90.0, max: 100.0, default: 94.0, unit: 's', decimals: 1 },
            position_change: { min: -3.0, max: 3.0, default: 0.0, unit: '', decimals: 1 },
            sector_time: { min: 90.0, max: 100.0, default: 95.0, unit: 's', decimals: 1 }
        };

        // Get all sliders
        this.sliders = {};
        Object.keys(this.sliderConfig).forEach(name => {
            const input = document.getElementById(name);
            const valueDisplay = document.getElementById(`${name}_value`);
            const trackFill = input.closest('.parameter-group').querySelector('.slider-track-fill');
            
            if (input && valueDisplay && trackFill) {
                this.sliders[name] = {
                    input: input,
                    valueDisplay: valueDisplay,
                    trackFill: trackFill
                };
            } else {
                console.error(`Missing elements for slider: ${name}`);
            }
        });
    }

    setupEventListeners() {
        // Form submission
        if (this.form) {
            this.form.addEventListener('submit', (e) => {
                e.preventDefault();
                this.handlePredict(e);
            });
        }
        
        // Reset button
        if (this.resetBtn) {
            this.resetBtn.addEventListener('click', (e) => {
                e.preventDefault();
                this.resetValues();
            });
        }

        // Predict button
        if (this.predictBtn) {
            this.predictBtn.addEventListener('click', (e) => {
                e.preventDefault();
                this.handlePredict(e);
            });
        }

        // Slider events
        Object.keys(this.sliders).forEach(name => {
            const slider = this.sliders[name];
            if (slider && slider.input) {
                // Use multiple event types for better compatibility
                slider.input.addEventListener('input', () => this.updateSlider(name));
                slider.input.addEventListener('change', () => this.updateSlider(name));
                slider.input.addEventListener('mousemove', () => this.updateSlider(name));
                slider.input.addEventListener('touchmove', () => this.updateSlider(name));
            }
        });

        // Add keyboard navigation
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' && e.ctrlKey) {
                e.preventDefault();
                this.handlePredict(e);
            }
            if (e.key === 'Escape') {
                e.preventDefault();
                this.resetValues();
            }
        });
    }

    initializeSliders() {
        // Set initial values and update displays
        Object.keys(this.sliderConfig).forEach(name => {
            const config = this.sliderConfig[name];
            const slider = this.sliders[name];
            
            if (slider && slider.input) {
                slider.input.value = config.default;
                this.updateSlider(name);
            }
        });
    }

    updateSlider(name) {
        const config = this.sliderConfig[name];
        const slider = this.sliders[name];
        
        if (!config || !slider || !slider.input || !slider.valueDisplay || !slider.trackFill) {
            return;
        }
        
        const value = parseFloat(slider.input.value);
        
        // Update value display
        const formattedValue = value.toFixed(config.decimals);
        slider.valueDisplay.textContent = `${formattedValue}${config.unit}`;
        
        // Update track fill
        const percentage = ((value - config.min) / (config.max - config.min)) * 100;
        slider.trackFill.style.width = `${Math.max(0, Math.min(100, percentage))}%`;
    }

    async handlePredict(e) {
        if (e) {
            e.preventDefault();
        }
        
        // Show loading state
        this.setLoadingState(true);
        
        try {
            // Get form data
            const formData = this.getFormData();
            
            // Simulate API call delay for realistic UX
            await this.delay(1500);
            
            // Get prediction (simulate ML model)
            const prediction = this.simulateMLPrediction(formData);
            
            // Display results
            this.displayResults(prediction);
            
        } catch (error) {
            console.error('Prediction error:', error);
            this.showError('Failed to predict lap time. Please try again.');
        } finally {
            this.setLoadingState(false);
        }
    }

    getFormData() {
        const data = {};
        Object.keys(this.sliders).forEach(name => {
            if (this.sliders[name] && this.sliders[name].input) {
                data[name] = parseFloat(this.sliders[name].input.value);
            }
        });
        return data;
    }

    simulateMLPrediction(data) {
        // Simulate a realistic ML model prediction
        // This is a simplified version based on the provided model features
        
        const {
            qualifying_time,
            rain_probability,
            temperature,
            team_performance,
            clean_air_pace,
            position_change,
            sector_time
        } = data;
        
        // Base prediction around qualifying time with adjustments
        let prediction = qualifying_time * 1.35; // Base conversion factor
        
        // Apply feature influences (simplified model)
        prediction += (rain_probability / 100) * 2.5; // Rain slows down
        prediction += (temperature - 25) * 0.02; // Temperature effect
        prediction -= (team_performance - 0.5) * 1.5; // Team performance
        prediction += (clean_air_pace - 94) * 0.3; // Clean air pace correlation
        prediction += position_change * 0.1; // Position change minor effect
        prediction += (sector_time - 95) * 0.2; // Sector time correlation
        
        // Add some realistic randomness
        prediction += (Math.random() - 0.5) * 0.3;
        
        // Clamp to realistic range
        prediction = Math.max(92.5, Math.min(97.5, prediction));
        
        return {
            lapTime: prediction,
            confidence: 0.85 + Math.random() * 0.1,
            factors: this.getInfluencingFactors(data)
        };
    }

    getInfluencingFactors(data) {
        const factors = [];
        
        if (data.rain_probability > 30) {
            factors.push('High rain probability increasing lap time');
        }
        if (data.team_performance > 0.8) {
            factors.push('Strong team performance advantage');
        }
        if (data.temperature > 30) {
            factors.push('High temperature affecting tire performance');
        }
        if (data.clean_air_pace < 92) {
            factors.push('Excellent clean air pace');
        }
        
        return factors;
    }

    displayResults(prediction) {
        if (!this.predictedTimeElement || !this.resultsSection) {
            return;
        }
        
        // Format lap time
        const formattedTime = prediction.lapTime.toFixed(2);
        this.predictedTimeElement.textContent = `${formattedTime}s`;
        
        // Show results section
        this.resultsSection.classList.remove('hidden');
        
        // Scroll to results smoothly
        setTimeout(() => {
            this.resultsSection.scrollIntoView({ 
                behavior: 'smooth', 
                block: 'center' 
            });
        }, 200);
    }

    resetValues() {
        // Reset all sliders to default values
        Object.keys(this.sliderConfig).forEach(name => {
            const config = this.sliderConfig[name];
            const slider = this.sliders[name];
            
            if (slider && slider.input) {
                slider.input.value = config.default;
                this.updateSlider(name);
            }
        });
        
        // Hide results
        if (this.resultsSection) {
            this.resultsSection.classList.add('hidden');
        }
        
        // Add visual feedback
        if (this.resetBtn) {
            this.resetBtn.style.transform = 'scale(0.95)';
            setTimeout(() => {
                this.resetBtn.style.transform = 'scale(1)';
            }, 150);
        }
        
        // Scroll back to top of form
        if (this.form) {
            this.form.scrollIntoView({ 
                behavior: 'smooth', 
                block: 'start' 
            });
        }
    }

    setLoadingState(loading) {
        if (!this.predictBtn || !this.btnText || !this.btnLoader) {
            return;
        }
        
        if (loading) {
            this.predictBtn.disabled = true;
            this.btnText.style.opacity = '0';
            this.btnLoader.classList.remove('hidden');
            this.predictBtn.style.cursor = 'not-allowed';
        } else {
            this.predictBtn.disabled = false;
            this.btnText.style.opacity = '1';
            this.btnLoader.classList.add('hidden');
            this.predictBtn.style.cursor = 'pointer';
        }
    }

    showError(message) {
        // Create error notification
        const errorDiv = document.createElement('div');
        errorDiv.className = 'error-notification';
        errorDiv.textContent = message;
        errorDiv.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: linear-gradient(135deg, #e10600, #ff4444);
            color: white;
            padding: 16px 24px;
            border-radius: 8px;
            box-shadow: 0 8px 32px rgba(225, 6, 0, 0.3);
            z-index: 1000;
            font-family: 'Rajdhani', sans-serif;
            font-weight: 600;
            transform: translateX(100%);
            transition: transform 0.3s cubic-bezier(0.16, 1, 0.3, 1);
        `;
        
        document.body.appendChild(errorDiv);
        
        // Animate in
        setTimeout(() => {
            errorDiv.style.transform = 'translateX(0)';
        }, 100);
        
        // Remove after delay
        setTimeout(() => {
            errorDiv.style.transform = 'translateX(100%)';
            setTimeout(() => {
                if (errorDiv.parentNode) {
                    document.body.removeChild(errorDiv);
                }
            }, 300);
        }, 4000);
    }

    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
}

// Enhanced visual effects
class VisualEffects {
    constructor() {
        this.initializeEffects();
    }
    
    initializeEffects() {
        // Add subtle parallax to racing grid
        this.setupParallax();
        
        // Add glow effects on hover
        this.setupGlowEffects();
        
        // Add racing stripe animations
        this.setupRacingStripes();
    }
    
    setupParallax() {
        const grid = document.querySelector('.racing-grid');
        if (!grid) return;
        
        let ticking = false;
        
        function updateParallax() {
            const scrolled = window.pageYOffset;
            const rate = scrolled * -0.5;
            grid.style.transform = `translate3d(0, ${rate}px, 0)`;
            ticking = false;
        }
        
        function requestTick() {
            if (!ticking) {
                requestAnimationFrame(updateParallax);
                ticking = true;
            }
        }
        
        window.addEventListener('scroll', requestTick);
    }
    
    setupGlowEffects() {
        const glowElements = document.querySelectorAll('.btn, .parameter-group, .results-card');
        
        glowElements.forEach(element => {
            element.addEventListener('mouseenter', function() {
                this.style.filter = 'drop-shadow(0 0 20px rgba(255, 215, 0, 0.3))';
            });
            
            element.addEventListener('mouseleave', function() {
                this.style.filter = 'none';
            });
        });
    }
    
    setupRacingStripes() {
        // Add animated racing stripes to buttons
        const buttons = document.querySelectorAll('.btn--primary');
        
        buttons.forEach(button => {
            button.addEventListener('mouseenter', function() {
                if (!this.querySelector('.racing-stripes')) {
                    const stripes = document.createElement('div');
                    stripes.className = 'racing-stripes';
                    stripes.style.cssText = `
                        position: absolute;
                        top: 0;
                        left: -100%;
                        width: 100%;
                        height: 100%;
                        background: linear-gradient(
                            45deg,
                            transparent 30%,
                            rgba(255, 255, 255, 0.1) 50%,
                            transparent 70%
                        );
                        animation: stripeMove 1.5s ease-in-out;
                        pointer-events: none;
                    `;
                    this.appendChild(stripes);
                    
                    setTimeout(() => {
                        if (stripes.parentNode) {
                            stripes.parentNode.removeChild(stripes);
                        }
                    }, 1500);
                }
            });
        });
        
        // Add CSS animation for racing stripes
        if (!document.getElementById('racing-stripe-styles')) {
            const style = document.createElement('style');
            style.id = 'racing-stripe-styles';
            style.textContent = `
                @keyframes stripeMove {
                    0% { left: -100%; }
                    100% { left: 100%; }
                }
            `;
            document.head.appendChild(style);
        }
    }
}

// Initialize application when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    // Wait a bit for all elements to be rendered
    setTimeout(() => {
        // Initialize main predictor
        try {
            window.f1Predictor = new F1Predictor();
            console.log('✅ F1 Predictor initialized successfully');
        } catch (error) {
            console.error('❌ Error initializing F1 Predictor:', error);
        }
        
        // Initialize visual effects
        try {
            window.visualEffects = new VisualEffects();
            console.log('✅ Visual effects initialized successfully');
        } catch (error) {
            console.error('❌ Error initializing visual effects:', error);
        }
        
        // Add loading completion class for animations
        document.body.classList.add('loaded');
        
        // Add welcome message in console
        console.log(`
    🏎️ F1 Monaco GP Predictor Loaded
    ================================
    Advanced ML-powered lap time prediction interface
    Built with modern web technologies
    Ready for race predictions!
        `);
    }, 100);
});

// Export for potential external use
window.F1Predictor = F1Predictor;