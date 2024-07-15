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
    return predefinedColors[colorName] || '#cccccc'; // Default to a light grey if color not found
}

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
        
        const contentDiv = document.getElementById('content-container');
        contentDiv.innerHTML = ''; // Clear existing content
        const paragraphs = doc.querySelectorAll('.note-detail-markdown p');
        
        paragraphs.forEach((p, index) => {
            if (index === 0) return; // Skip the title
            
            const text = p.textContent.trim();
            if (text.startsWith('@handle=')) {
                const parts = text.split('::').map(part => part.trim());
                const handle = parts[0].split('=')[1];
                
                const handleDiv = document.createElement('div');
                handleDiv.className = 'handle';
                handleDiv.textContent = `@${handle}`;
                contentDiv.appendChild(handleDiv);
                
                for (let i = 1; i < parts.length - 1; i++) {
                    const contentParts = parts[i].match(/(.+),\s*(.+)\s*\((.+)\)/);
                    if (contentParts) {
                        const [, contentType, colorStyle, message] = contentParts;
                        
                        const contentDiv = document.createElement('div');
                        contentDiv.className = `content ${contentType}`;
                        contentDiv.textContent = message;
                        
                        if (colorStyle.endsWith('-gradient')) {
                            const baseColor = getBaseColor(colorStyle);
                            const gradient = createGradient(baseColor);
                            contentDiv.classList.add('gradient');
                            contentDiv.style.setProperty('--color-dark', gradient.dark);
                            contentDiv.style.setProperty('--color-light', gradient.light);
                        } else {
                            contentDiv.classList.add(colorStyle);
                        }
                        
                        handleDiv.appendChild(contentDiv);
                    }
                }
            }
        });
    } catch (error) {
        console.error('Error fetching content:', error);
        document.getElementById('content-container').textContent = 'Error loading content. Please try again later.';
    }
}

function startPeriodicFetch(interval = 60000) {
    fetchContent(); // Initial fetch
    setInterval(fetchContent, interval); // Fetch every 'interval' milliseconds
}

document.addEventListener('DOMContentLoaded', () => startPeriodicFetch());