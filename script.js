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
                const handle = parts[0].split('=')[1];
                
                contentData[handle] = {
                    tweets: []
                };
                
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
    const profileContainer = document.getElementById('profile-container');
    const profileName = document.getElementById('profile-name');
    const profileHandle = document.getElementById('profile-handle');
    const profileBio = document.getElementById('profile-bio');
    const followingCount = document.getElementById('following-count');
    const followersCount = document.getElementById('followers-count');

    profileName.textContent = handle; // Using handle as name for demonstration
    profileHandle.textContent = `@${handle}`;
    profileBio.textContent = 'This is a sample bio for the user.'; // Sample bio
    followingCount.textContent = 'Following: 100'; // Sample following count
    followersCount.textContent = 'Followers: 200'; // Sample followers count

    profileContainer.style.display = 'block';
}


function displayContent(handle) {
    const contentContainer = document.getElementById('content-container');
    contentContainer.innerHTML = '';
    
    if (contentData && contentData[handle]) {
        contentData[handle].tweets.forEach(tweet => {
            const tweetDiv = document.createElement('div');
            tweetDiv.className = `tweet ${tweet.contentType}`;
            
            const tweetContent = document.createElement('p');
            tweetContent.className = 'tweet-content';
            tweetContent.textContent = tweet.message;
            
            tweetDiv.appendChild(tweetContent);
            
            // 应用颜色样式
            if (tweet.colorStyle.endsWith('-gradient')) {
                const baseColor = getBaseColor(tweet.colorStyle);
                const gradient = createGradient(baseColor);
                tweetDiv.classList.add('gradient');
                tweetDiv.style.setProperty('--color-light', gradient.light);
                tweetDiv.style.setProperty('--color-dark', gradient.dark);
            } else {
                // 对于非渐变颜色，直接应用类名
                tweetDiv.classList.add(tweet.colorStyle);
            }
            
            contentContainer.appendChild(tweetDiv);
        });
    } else {
        contentContainer.textContent = 'No tweets found for this handle.';
    }
}

// ... 保留其余的代码 ...

function handleSubmit() {
    const handleInput = document.getElementById('handle-input');
    const handle = handleInput.value.trim();
    
    if (handle) {
        displayProfile(handle);
        displayContent(handle);
    }
}

document.addEventListener('DOMContentLoaded', () => {
    fetchContent();
    
    const submitButton = document.getElementById('submit-handle');
    submitButton.addEventListener('click', handleSubmit);
    
    const handleInput = document.getElementById('handle-input');
    handleInput.addEventListener('keypress', (event) => {
        if (event.key === 'Enter') {
            handleSubmit();
        }
    });
});