/**
 * Main JavaScript file for the Game AI Platform
 * Contains shared functionality used across the application
 */

// DOM Content Loaded Event
document.addEventListener('DOMContentLoaded', function() {
    // Initialize Bootstrap tooltips
    const tooltipTriggerList = [].slice.call(document.querySelectorAll('[data-bs-toggle="tooltip"]'));
    tooltipTriggerList.map(function(tooltipTriggerEl) {
        return new bootstrap.Tooltip(tooltipTriggerEl);
    });

    // Initialize Bootstrap popovers
    const popoverTriggerList = [].slice.call(document.querySelectorAll('[data-bs-toggle="popover"]'));
    popoverTriggerList.map(function(popoverTriggerEl) {
        return new bootstrap.Popover(popoverTriggerEl);
    });

    // Form validation
    const forms = document.querySelectorAll('.needs-validation');
    Array.from(forms).forEach(form => {
        form.addEventListener('submit', event => {
            if (!form.checkValidity()) {
                event.preventDefault();
                event.stopPropagation();
            }
            form.classList.add('was-validated');
        }, false);
    });

    // Password confirmation validation
    const password = document.getElementById('password');
    const confirmPassword = document.getElementById('confirm_password');
    
    if (password && confirmPassword) {
        confirmPassword.addEventListener('input', function() {
            if (password.value !== confirmPassword.value) {
                confirmPassword.setCustomValidity("Passwords don't match");
            } else {
                confirmPassword.setCustomValidity('');
            }
        });
    }

    // Flash message auto-dismiss
    const flashMessages = document.querySelectorAll('.alert');
    flashMessages.forEach(message => {
        setTimeout(() => {
            message.classList.add('fade');
            setTimeout(() => {
                message.remove();
            }, 500);
        }, 5000);
    });

    // API utility functions
    window.apiUtils = {
        /**
         * Save game results to the server
         * @param {string} gameType - 'tetris' or 'snake'
         * @param {number} score - Player's score
         * @param {number} aiLevel - AI difficulty level
         * @returns {Promise} - Promise with the server response
         */
        saveGameResults: function(gameType, score, aiLevel) {
            return fetch('/api/save_game', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    game_type: gameType,
                    score: score,
                    ai_level: aiLevel
                })
            })
            .then(response => response.json())
            .catch(error => {
                console.error('Error saving game results:', error);
                return { success: false, message: 'Failed to save game results' };
            });
        },

        /**
         * Save gameplay data for AI training
         * @param {string} gameType - 'tetris' or 'snake'
         * @param {Array} moves - Array of player moves
         * @returns {Promise} - Promise with the server response
         */
        saveGameplayData: function(gameType, moves) {
            return fetch('/api/save_gameplay_data', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    game_type: gameType,
                    moves: moves
                })
            })
            .then(response => response.json())
            .catch(error => {
                console.error('Error saving gameplay data:', error);
                return { success: false, message: 'Failed to save gameplay data' };
            });
        }
    };
});
