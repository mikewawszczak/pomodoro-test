class PomodoroTimer {
    constructor() {
        this.timeLeft = 25 * 60; // 25 minutes in seconds
        this.totalTime = 25 * 60;
        this.isRunning = false;
        this.interval = null;
        this.sessionCount = 0;
        this.currentMode = 'focus';
        
        this.initializeElements();
        this.bindEvents();
        this.updateDisplay();
    }

    initializeElements() {
        this.timeDisplay = document.getElementById('time');
        this.timerLabel = document.getElementById('timer-label');
        this.startBtn = document.getElementById('start-btn');
        this.pauseBtn = document.getElementById('pause-btn');
        this.resetBtn = document.getElementById('reset-btn');
        this.sessionCountDisplay = document.getElementById('session-count');
        this.progressFill = document.getElementById('progress-fill');
        this.modeButtons = document.querySelectorAll('.mode-btn');
        
        // Settings inputs
        this.focusTimeInput = document.getElementById('focus-time');
        this.shortBreakInput = document.getElementById('short-break');
        this.longBreakInput = document.getElementById('long-break');
    }

    bindEvents() {
        this.startBtn.addEventListener('click', () => this.start());
        this.pauseBtn.addEventListener('click', () => this.pause());
        this.resetBtn.addEventListener('click', () => this.reset());
        
        // Mode buttons
        this.modeButtons.forEach(btn => {
            btn.addEventListener('click', (e) => this.switchMode(e));
        });
        
        // Settings inputs
        this.focusTimeInput.addEventListener('change', () => this.updateSettings());
        this.shortBreakInput.addEventListener('change', () => this.updateSettings());
        this.longBreakInput.addEventListener('change', () => this.updateSettings());
    }

    start() {
        if (!this.isRunning) {
            this.isRunning = true;
            this.startBtn.disabled = true;
            this.pauseBtn.disabled = false;
            
            this.interval = setInterval(() => {
                this.timeLeft--;
                this.updateDisplay();
                
                if (this.timeLeft <= 0) {
                    this.complete();
                }
            }, 1000);
        }
    }

    pause() {
        if (this.isRunning) {
            this.isRunning = false;
            this.startBtn.disabled = false;
            this.pauseBtn.disabled = true;
            clearInterval(this.interval);
        }
    }

    reset() {
        this.pause();
        this.timeLeft = this.totalTime;
        this.updateDisplay();
    }

    complete() {
        this.pause();
        this.playNotification();
        this.showCompletionMessage();
        
        if (this.currentMode === 'focus') {
            this.sessionCount++;
            this.sessionCountDisplay.textContent = this.sessionCount;
            
            // Auto-switch to short break after focus session
            if (this.sessionCount % 4 === 0) {
                this.switchToMode('long-break');
            } else {
                this.switchToMode('short-break');
            }
        } else {
            // Auto-switch back to focus after break
            this.switchToMode('focus');
        }
    }

    switchMode(event) {
        const btn = event.target;
        const time = parseInt(btn.dataset.time);
        const label = btn.dataset.label;
        
        // Update active button
        this.modeButtons.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        
        // Update timer
        this.totalTime = time * 60;
        this.timeLeft = this.totalTime;
        this.timerLabel.textContent = label;
        
        // Determine mode
        if (time === 25) {
            this.currentMode = 'focus';
        } else if (time === 5) {
            this.currentMode = 'short-break';
        } else {
            this.currentMode = 'long-break';
        }
        
        this.updateDisplay();
    }

    switchToMode(mode) {
        let time, label;
        
        switch (mode) {
            case 'focus':
                time = parseInt(this.focusTimeInput.value);
                label = 'Focus Time';
                this.currentMode = 'focus';
                break;
            case 'short-break':
                time = parseInt(this.shortBreakInput.value);
                label = 'Short Break';
                this.currentMode = 'short-break';
                break;
            case 'long-break':
                time = parseInt(this.longBreakInput.value);
                label = 'Long Break';
                this.currentMode = 'long-break';
                break;
        }
        
        this.totalTime = time * 60;
        this.timeLeft = this.totalTime;
        this.timerLabel.textContent = label;
        
        // Update active button
        this.modeButtons.forEach(btn => {
            btn.classList.remove('active');
            if (parseInt(btn.dataset.time) === time) {
                btn.classList.add('active');
            }
        });
        
        this.updateDisplay();
    }

    updateSettings() {
        // Update the mode buttons with new values
        this.modeButtons[0].dataset.time = this.focusTimeInput.value;
        this.modeButtons[1].dataset.time = this.shortBreakInput.value;
        this.modeButtons[2].dataset.time = this.longBreakInput.value;
        
        // If we're not running, update the current timer
        if (!this.isRunning) {
            this.reset();
        }
    }

    updateDisplay() {
        const minutes = Math.floor(this.timeLeft / 60);
        const seconds = this.timeLeft % 60;
        
        this.timeDisplay.textContent = 
            `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
        
        // Update progress bar
        const progress = ((this.totalTime - this.timeLeft) / this.totalTime) * 100;
        this.progressFill.style.width = `${progress}%`;
    }

    playNotification() {
        // Create audio context for notification sound
        const audioContext = new (window.AudioContext || window.webkitAudioContext)();
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();
        
        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);
        
        oscillator.frequency.setValueAtTime(800, audioContext.currentTime);
        oscillator.frequency.setValueAtTime(600, audioContext.currentTime + 0.1);
        oscillator.frequency.setValueAtTime(800, audioContext.currentTime + 0.2);
        
        gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.3);
        
        oscillator.start(audioContext.currentTime);
        oscillator.stop(audioContext.currentTime + 0.3);
    }

    showCompletionMessage() {
        const message = this.currentMode === 'focus' 
            ? 'Focus session completed! Time for a break.' 
            : 'Break completed! Ready to focus?';
        
        // Add visual feedback
        this.timeDisplay.classList.add('timer-complete');
        setTimeout(() => {
            this.timeDisplay.classList.remove('timer-complete');
        }, 500);
        
        // Show browser notification if supported
        if ('Notification' in window && Notification.permission === 'granted') {
            new Notification('Pomodoro Timer', {
                body: message,
                icon: 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="%23667eea"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/></svg>'
            });
        } else if ('Notification' in window && Notification.permission === 'default') {
            Notification.requestPermission().then(permission => {
                if (permission === 'granted') {
                    new Notification('Pomodoro Timer', { body: message });
                }
            });
        }
    }
}

// Initialize the timer when the page loads
document.addEventListener('DOMContentLoaded', () => {
    new PomodoroTimer();

    // Settings modal functionality
    const hamburgerMenu = document.getElementById('hamburger-menu');
    const settingsModal = document.getElementById('settings-modal');
    const closeSettings = document.getElementById('close-settings');

    hamburgerMenu.addEventListener('click', () => {
        settingsModal.classList.add('active');
    });

    closeSettings.addEventListener('click', () => {
        settingsModal.classList.remove('active');
    });

    // Close modal when clicking outside
    settingsModal.addEventListener('click', (e) => {
        if (e.target === settingsModal) {
            settingsModal.classList.remove('active');
        }
    });

    // Close modal with Escape key
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && settingsModal.classList.contains('active')) {
            settingsModal.classList.remove('active');
        }
    });
});