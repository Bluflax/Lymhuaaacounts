const predefinedColors = {
    'green': '#82a556',
    'red': '#ff6b6b',
    'blue': '#4d96ff',
    'yellow': '#feca57',
    'purple': '#9c88ff',
    'orange': '#ff9ff3'
};

function adjustColor(color, amount) {
    return '#' + color.replace(/^#/, '').replace(/../g, color => ('0'+Math.min(255, Math.max(0, parseInt(color, 16) + amount)).toString(16)).substr(-2));
}

function createGradient(baseColor) {
    const darkColor = adjustColor(baseColor, -40);
    const lightColor = adjustColor(baseColor, 40);
    return { dark: darkColor, light: lightColor };
}

function getBaseColor(colorStyle) {
    if (colorStyle.startsWith('#')) {
        return colorStyle;
    }
    const colorName = colorStyle.split('-')[0];
    return predefinedColors[colorName] || '#cccccc';
}

let contentData = null;

async function fetchContent() {
    const url = 'https://app.simplenote.com/publish/L965Ft';
    const proxyUrl = 'https://api.allorigins.win/get?url=';
    
    try {
        const response = await fetch(proxyUrl + encodeURIComponent(url), {
            method: 'GET',
            cache: 'no-store'
        });
        const data = await response.json();
        const htmlString = data.contents;
        
        const parser = new DOMParser();
        const doc = parser.parseFromString(htmlString, 'text/html');
        
        contentData = {};
        const paragraphs = doc.querySelectorAll('.note-detail-markdown p');
        
        paragraphs.forEach((p, index) => {
            if (index === 0) return;
            
            const text = p.textContent.trim();
            if (text.startsWith('@handle=')) {
                const parts = text.split('::').map(part => part.trim());
                const handlePart = parts[0].split('\n');
                const handle = handlePart[0].split('=')[1];
                
                contentData[handle] = {
                    username: handlePart[1].split('=')[1],
                    status: handlePart[2].split('=')[1],
                    info: {},
                    tweets: []
                };
                
                // Parse user info
                const infoPart = parts[0].split(':')[1].trim();
                const infoItems = infoPart.match(/(\w+)\(([^)]+)\)/g);
                if (infoItems) {
                    infoItems.forEach(item => {
                        const [, key, value] = item.match(/(\w+)\(([^)]+)\)/);
                        contentData[handle].info[key] = value;
                    });
                }
                
                // Parse tweets
                for (let i = 1; i < parts.length - 1; i++) {
                    const contentParts = parts[i].match(/(.+),\s*(.+)\s*\((.+)\)/);
                    if (contentParts) {
                        const [, contentType, colorStyle, message] = contentParts;
                        contentData[handle].tweets.push({ contentType, colorStyle, message });
                    }
                }
            }
        });
    } catch (error) {
        console.error('Error fetching content:', error);
        document.getElementById('content-container').textContent = 'Error loading content. Please try again later.';
    }
}

function displayProfile(handle) {
    const profileDetail = document.getElementById('profile-detail');
    const profileName = document.getElementById('profile-name');
    const profileHandle = document.getElementById('profile-handle');
    const profileBioInfo = document.getElementById('profile-bio-info');
    const followingCount = document.getElementById('following-count');
    const followersCount = document.getElementById('followers-count');
    const hiddenAccountMessage = document.getElementById('hidden-account-message');
    const unsupportedAccountMessage = document.getElementById('unsupported-account-message');

    // Reset all elements
    profileName.textContent = '';
    profileHandle.textContent = '';
    profileBioInfo.textContent = '';
    followingCount.textContent = '';
    followersCount.textContent = '';
    hiddenAccountMessage.style.display = 'none';
    unsupportedAccountMessage.style.display = 'none';

    // Convert handle to lowercase for case-insensitive matching
    const lowerHandle = handle.toLowerCase();
    const matchedHandle = Object.keys(contentData).find(key => key.toLowerCase() === lowerHandle);

    if (matchedHandle) {
        const userData = contentData[matchedHandle];
        
        profileHandle.textContent = `@${handle}`; // Use original input for display
        
        if (userData.status === 'hidden' || userData.status === 'notsupported') {
            profileName.textContent = `@${handle}`;
            if (userData.status === 'hidden') {
                hiddenAccountMessage.style.display = 'block';
            } else {
                unsupportedAccountMessage.style.display = 'block';
            }
        } else {
            profileName.textContent = userData.username;
            profileBioInfo.textContent = userData.info.bio || '';
            followingCount.textContent = 'Following: 100'; // Sample following count
            followersCount.textContent = 'Followers: 200'; // Sample followers count
        }
    } else {
        // Treat unmatched accounts as hidden
        profileName.textContent = `@${handle}`;
        profileHandle.textContent = `@${handle}`;
        hiddenAccountMessage.style.display = 'block';
    }
}

function displayContent(handle) {
    const contentContainer = document.getElementById('content-container');
    contentContainer.innerHTML = '';
    contentContainer.style.display = 'block';
    
    // Convert handle to lowercase for case-insensitive matching
    const lowerHandle = handle.toLowerCase();
    const matchedHandle = Object.keys(contentData).find(key => key.toLowerCase() === lowerHandle);
    
    if (matchedHandle) {
        const userData = contentData[matchedHandle];
        
        if (userData.status === 'hidden' || userData.status === 'notsupported') {
            contentContainer.style.display = 'none';
            return;
        }
        
        userData.tweets.forEach(tweet => {
            const tweetDiv = document.createElement('div');
            tweetDiv.className = `tweet ${tweet.contentType}`;
            
            const tweetContent = document.createElement('p');
            tweetContent.className = 'tweet-content';
            tweetContent.textContent = tweet.message;
            
            tweetDiv.appendChild(tweetContent);
            
            // Apply color style
            if (tweet.colorStyle.endsWith('-gradient')) {
                const baseColor = getBaseColor(tweet.colorStyle);
                const gradient = createGradient(baseColor);
                tweetDiv.classList.add('gradient');
                tweetDiv.style.setProperty('--color-light', gradient.light);
                tweetDiv.style.setProperty('--color-dark', gradient.dark);
            } else {
                tweetDiv.classList.add(tweet.colorStyle);
            }
            
            contentContainer.appendChild(tweetDiv);
        });
    } else {
        // For unmatched accounts, don't display any content
        contentContainer.style.display = 'none';
    }
}

function handleSubmit() {
    const handleInput = document.getElementById('handle-input');
    const handle = handleInput.value.trim();
    const profileInfo = document.getElementById('profile-info');
    const profileAnimated = document.getElementById('profileanimated');
    const inputContainer = document.getElementById('input-container');
    const classIndicator = document.querySelector('.classindicator');
    
    if (handle) {
        profileInfo.style.display = 'block';
        profileAnimated.style.display = 'block';
        inputContainer.style.display = 'none';
        displayProfile(handle);
        displayContent(handle);
        
        // Convert handle to lowercase for case-insensitive matching
        const lowerHandle = handle.toLowerCase();
        const matchedHandle = Object.keys(contentData).find(key => key.toLowerCase() === lowerHandle);
        
        // Check if the account is normal and show/hide classindicator accordingly
        if (matchedHandle && contentData[matchedHandle].status !== 'hidden' && contentData[matchedHandle].status !== 'notsupported') {
            classIndicator.style.display = 'flex';
        } else {
            classIndicator.style.display = 'none';
        }
    }
}

function backtoinput() {
    const profileInfo = document.getElementById('profile-info');
    const profileAnimated = document.getElementById('profileanimated');
    const inputContainer = document.getElementById('input-container');
    const contentContainer = document.getElementById('content-container');
    const handleInput = document.getElementById('handle-input');
    const hiddenAccountMessage = document.getElementById('hidden-account-message');
    const unsupportedAccountMessage = document.getElementById('unsupported-account-message');
    const classIndicator = document.querySelector('.classindicator');
    
    hiddenAccountMessage.style.display = 'none';
    unsupportedAccountMessage.style.display = 'none';
    profileInfo.style.display = 'none';
    profileAnimated.style.display = 'none';
    inputContainer.style.display = 'block';
    contentContainer.style.display = 'none';
    classIndicator.style.display = 'none';  // Hide classindicator when going back to input
    handleInput.focus();
}

document.addEventListener('DOMContentLoaded', () => {
    fetchContent();
    
    const submitButton = document.getElementById('submit-handle');
    const changeButton = document.getElementById('change-handle');
    changeButton.addEventListener('click', backtoinput);
    submitButton.addEventListener('click', handleSubmit);
    
    const handleInput = document.getElementById('handle-input');
    handleInput.addEventListener('keypress', (event) => {
        if (event.key === 'Enter') {
            handleSubmit();
        }
    });
});