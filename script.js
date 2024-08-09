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
    const url = 'https://app.simplenote.com/publish/HGCwdm';
    const proxyUrl = 'https://api.allorigins.win/get?url=';

    let retryCount = 0;
    while (retryCount < 20) {
        
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
                        joinDate: handlePart[3].split('=')[1],
                        userEventData: handlePart[4].split('=')[1],
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

            return;
        } catch (error) {
            console.error('Error fetching content:', error);
            showMessage('hidden');
            document.getElementById('hidden-account-message').textContent = 'Cannot load user data at the moment.';
            retryCount++;
            await new Promise(resolve => setTimeout(resolve, 400));
        }
    }
    throw new Error('Cannot fetch content.');
}

function showMessage(messageType) {
    const Message = document.getElementById('display-message');
    const hiddenAccountMessage = document.getElementById('hidden-account-message');
    const unsupportedAccountMessage = document.getElementById('unsupported-account-message');
    const contentContainer = document.getElementById('content-container');
    const userEvent = document.getElementById('user-event');

    Message.style.display = 'flex';
    hiddenAccountMessage.style.display = 'none';
    unsupportedAccountMessage.style.display = 'none';
    contentContainer.style.display = 'none';
    userEvent.style.display = 'none';
    document.getElementById('initial-state-title').style.display = 'none';
    document.getElementById('initial-state-description').style.display = 'none';

    switch (messageType) {
        case 'initial':
            document.getElementById('initial-state-title').style.display = 'block';
            document.getElementById('initial-state-description').style.display = 'block';
            break;
        case 'hidden':
            hiddenAccountMessage.style.display = 'block';
            break;
        case 'unsupported':
            unsupportedAccountMessage.style.display = 'block';
            break;
        case 'event':
            Message.style.display = 'none';
            contentContainer.style.display = 'block';
            userEvent.style.display = 'block';
            break;
        case 'none':
            Message.style.display = 'none';

    }
}

function displayProfile(handle) {
    const profileDetail = document.getElementById('profile-detail');
    const profileName = document.getElementById('profile-name');
    const profileHandle = document.getElementById('profile-handle');
    const profileBioInfo = document.getElementById('profile-bio-info');
    const detail1 = document.getElementById('profile-detail1');
    const detail2 = document.getElementById('profile-detail2');
    const hiddenAccountMessage = document.getElementById('hidden-account-message');
    const unsupportedAccountMessage = document.getElementById('unsupported-account-message');

    // Reset all elements
    profileName.textContent = '';
    profileHandle.textContent = '';
    profileBioInfo.textContent = '';
    detail1.textContent = '';
    detail2.textContent = '';
    hiddenAccountMessage.style.display = 'none';
    unsupportedAccountMessage.style.display = 'none';

    // Convert handle to lowercase for case-insensitive matching
    const lowerHandle = handle.toLowerCase();
    const matchedHandle = Object.keys(contentData).find(key => key.toLowerCase() === lowerHandle);

    if (matchedHandle) {
        const userData = contentData[matchedHandle];
        
        profileHandle.textContent = `@${handle}`; // Use original input for display
        
        if (userData.status === 'hidden') {
            profileName.textContent = `@${handle}`;
            showMessage('hidden');
        } else {
            if (userData.status === 'notsupported') {
                showMessage('unsupported');
            }
            profileName.textContent = userData.username;
            profileBioInfo.textContent = userData.info.bio || '';
            detail1.textContent = '📆 Joined ' + userData.joinDate || '';
            detail2.textContent = ''; // Sample followers count
        }

    } else {
        // Treat unmatched accounts as hidden
        profileName.textContent = `@${handle}`;
        profileHandle.textContent = `@${handle}`;
        showMessage('hidden');
    }
}



function displayContent(handle) {
    const contentContainer = document.getElementById('content-container');
    contentContainer.innerHTML = '';
    contentContainer.style.display = 'block';
    
    // 移除 visible 类，重置透明度
    contentContainer.classList.remove('visible');
    
    // 强制重排
    void contentContainer.offsetWidth;
    
    // 添加 visible 类来触发过渡效果
    contentContainer.classList.add('visible');
    
    // 转换 handle 为小写以进行不区分大小写的匹配
    const lowerHandle = handle.toLowerCase();
    const matchedHandle = Object.keys(contentData).find(key => key.toLowerCase() === lowerHandle);
    
    if (matchedHandle) {
        const userData = contentData[matchedHandle];
        
        //if (userData.status === 'hidden' || userData.status === 'notsupported') {
        if (userData.status === 'hidden') {
            contentContainer.style.display = 'none';
            return;
        }

        if (userData.userEventData === 'yes') {
            showMessage('event');
        }
        
        userData.tweets.forEach(tweet => {
            const contentDiv = document.createElement('div');
            contentDiv.className = tweet.contentType;
            
            const contentElement = document.createElement('p');
            contentElement.className = 'content-text';
            contentElement.textContent = tweet.message;
            
            contentDiv.appendChild(contentElement);
            
            if (tweet.colorStyle !== '') {
                contentDiv.classList.add(tweet.colorStyle);
            }
            
            contentContainer.appendChild(contentDiv);
        });
    } else {
        contentContainer.style.display = 'none';
    }
}


function handleSubmit() {
    const handleInput = document.getElementById('handle-input');
    const handle = handleInput.value.trim();
    const profileInfo = document.getElementById('profile-info');
    const profile = document.getElementById('profile');
    const profileDetail = document.getElementById('profile-detail');
    const profileAnimated = document.getElementById('profileanimated');
    const profileFixed = document.getElementById('profilefixed');
    const inputContainer = document.getElementById('input-container');
    
    if (handle) {
        // Save the handle to localStorage
        localStorage.setItem('lastHandle', handle);

        profileInfo.style.display = 'block';
        profileAnimated.style.display = 'block';
        inputContainer.style.display = 'none';
        //showMessage('none'); // Hide all messages
        
        // Force a reflow before removing the 'animated' class
        void profileDetail.offsetWidth;
        void profileFixed.offsetWidth;
        
        displayProfile(handle);
        displaycontentTimeout = setTimeout(() => {
            displayContent(handle);
        }, 1);
        
        // Convert handle to lowercase for case-insensitive matching
        const lowerHandle = handle.toLowerCase();
        const matchedHandle = Object.keys(contentData).find(key => key.toLowerCase() === lowerHandle);
        
        // Check if the account is normal and show/hide classindicator accordingly
        //if (matchedHandle && contentData[matchedHandle].status !== 'hidden' && contentData[matchedHandle].status !== 'notsupported') {
        if (matchedHandle && contentData[matchedHandle].status !== 'hidden') {
            profileFixed.style.display = 'flex';
            profile.classList.add('animated');
            profile.classList.remove('noneborder');
            setTimeout(() => {
                profile.classList.remove('animated');
                
            }, 1);
            // Force a reflow before removing the 'animated' class
            void profileFixed.offsetWidth;
        } else {
            profileFixed.style.display = 'none';
            profile.classList.remove('animated');
        }
    } else {
        showMessage('initial');
        // Clear localStorage when input is empty
        localStorage.removeItem('lastHandle');
    }
}


function loadLastHandle() {
    const lastHandle = localStorage.getItem('lastHandle');
    const profile = document.getElementById('profile-container');
    const submitButton = document.getElementById('submit-handle');
    if (lastHandle) {
        const handleInput = document.getElementById('handle-input');
        handleInput.value = lastHandle;
        handleInput.blur();
        profile.style.opacity = '0.5';
        profile.style.pointerEvents = 'none';
        showMessage('none');
        setTimeout(() => {
            handleSubmit();
            profile.style.opacity = '1';
            profile.style.pointerEvents = 'auto';
            submitButton.classList.remove('forbidden');
        }, 0);
    }
}


function backtoinput() {
    const profile = document.getElementById('profile');
    const profileInfo = document.getElementById('profile-info');
    const profileDetail = document.getElementById('profile-detail');
    const profileAnimated = document.getElementById('profileanimated');
    const profileFixed = document.getElementById('profilefixed');
    const inputContainer = document.getElementById('input-container');
    const contentContainer = document.getElementById('content-container');
    const handleInput = document.getElementById('handle-input');
    const classIndicator = document.querySelector('.classindicator');

    fetchContent();

    contentContainer.classList.remove('visible');

    clearTimeout(displaycontentTimeout);
    profileInfo.style.display = 'none';
    profileAnimated.style.display = 'none';
    inputContainer.style.display = 'block';
    contentContainer.style.display = 'none';
    
    // Force a reflow before adding the 'animated' class
    void profileDetail.offsetWidth;
    void classIndicator.offsetWidth;
    
    profileFixed.style.display = 'none';
    profile.classList.add('noneborder');
    showMessage('none');
    handleInput.focus();
}

function animateLogo() {
    const launch = document.getElementById('logo-overlay');
    const main = document.getElementById('main');
    setTimeout(() => {
        launch.classList.add('logoanimated');
        main.classList.add('mainanimated');
    }, 0);
}

document.addEventListener('DOMContentLoaded', async () => {
    await fetchContent();
    
    const inputContainer = document.getElementById('input-container');
    const submitButton = document.getElementById('submit-handle');
    const changeButton = document.getElementById('change-handle');
    changeButton.addEventListener('click', backtoinput);
    submitButton.addEventListener('click', handleSubmit);
    
    const handleInput = document.getElementById('handle-input');
    handleInput.focus();
    handleInput.addEventListener('input', () => {
        if (handleInput.value.trim() === '') {
            showMessage('initial');
            submitButton.classList.add('forbidden');
            localStorage.removeItem('lastHandle');
        } else {
            submitButton.classList.remove('forbidden');
            showMessage('none');
        }
    });

    handleInput.addEventListener('keypress', (event) => {
        if (event.key === 'Enter') {
            handleSubmit();
        }
    });

    document.addEventListener('keydown', (event) => {
        if (event.key === 'Backspace' && inputContainer.style.display === 'none') {
            backtoinput();
        }
    });
    
    showMessage('initial');
    loadLastHandle();
    animateLogo();
});