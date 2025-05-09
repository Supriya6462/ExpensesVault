// Debug flag
const DEBUG = true;

// Helper function for logging
function log(message, data = null) {
    if (DEBUG) {
        if (data) {
            console.log(`[Profile] ${message}:`, data);
        } else {
            console.log(`[Profile] ${message}`);
        }
    }
}

// Function to update profile information
function updateProfileInfo() {
    log('Fetching profile information...');
    return fetch('get_profile.php')
        .then(response => {
            log('Response received', response);
            return response.json();
        })
        .then(data => {
            log('Profile data', data);
            if (data.status === 'success' && data.user) {
                // Update profile button initial
                const profileButton = document.getElementById('profile-menu-button');
                if (profileButton && data.user.name) {
                    profileButton.textContent = data.user.name.charAt(0).toUpperCase();
                    log('Updated profile button initial');
                } else {
                    log('Profile button not found or name missing');
                }

                // Update profile dropdown information
                const nameElement = document.querySelector('#profile-dropdown .font-semibold.text-lg');
                const emailElement = document.querySelector('#profile-dropdown .text-gray-500');
                
                if (nameElement && data.user.name) {
                    nameElement.textContent = data.user.name;
                    log('Updated name element');
                } else {
                    log('Name element not found or name missing');
                }
                
                if (emailElement && data.user.email) {
                    const email = data.user.email;
                    emailElement.textContent = email.length > 20 ? email.substring(0, 20) + '...' : email;
                    log('Updated email element');
                } else {
                    log('Email element not found or email missing');
                }
                return true;
            }
            log('Profile update failed - invalid data');
            return false;
        })
        .catch(error => {
            console.error('[Profile] Error fetching profile info:', error);
            return false;
        });
}

// Function to toggle dropdown
function toggleDropdown(event, profileButton, profileDropdown) {
    event.stopPropagation();
    const isHidden = profileDropdown.classList.contains('hidden');
    profileDropdown.classList.toggle('hidden');
    log(isHidden ? 'Opening dropdown' : 'Closing dropdown');
}

// Initialize profile functionality
function initializeProfile() {
    log('Initializing profile functionality...');
    
    const profileButton = document.getElementById('profile-menu-button');
    const profileDropdown = document.getElementById('profile-dropdown');

    if (!profileButton || !profileDropdown) {
        log('Required elements not found', { profileButton: !!profileButton, profileDropdown: !!profileDropdown });
        return;
    }

    log('Found required elements');

    // Update profile information immediately
    updateProfileInfo().then(success => {
        log('Initial profile update ' + (success ? 'successful' : 'failed'));
    });

    // Toggle dropdown on button click
    profileButton.addEventListener('click', (event) => toggleDropdown(event, profileButton, profileDropdown));
    log('Added click handler to profile button');

    // Close dropdown when clicking outside
    document.addEventListener('click', function(event) {
        if (!profileButton.contains(event.target) && !profileDropdown.contains(event.target)) {
            profileDropdown.classList.add('hidden');
            log('Closing dropdown - clicked outside');
        }
    });
    log('Added document click handler');
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    log('DOM loaded - initializing profile');
    initializeProfile();
});
