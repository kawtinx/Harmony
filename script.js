// GitHub configuration
const githubConfig = {
    username: 'kawtinx',
    token: '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',
    apiUrl: 'https://api.github.com'
};

// Fetch GitHub stats
async function fetchGitHubStats() {
    try {
        const userResponse = await fetch(`${githubConfig.apiUrl}/users/${githubConfig.username}`, {
            headers: {
                'Accept': 'application/vnd.github.v3+json',
                'Authorization': `token ${githubConfig.token}`
            }
        });
        const userData = await userResponse.json();
        return userData;
    } catch (error) {
        console.error('Error fetching GitHub stats:', error);
        return null;
    }
}

// Fetch GitHub contribution data
async function fetchGitHubContributions() {
    try {
        const response = await fetch(`${githubConfig.apiUrl}/users/${githubConfig.username}/events/public`, {
            headers: {
                'Accept': 'application/vnd.github.v3+json',
                'Authorization': `token ${githubConfig.token}`
            }
        });
        const events = await response.json();
        
        // Process last 7 days of contributions
        const last7Days = new Date();
        last7Days.setDate(last7Days.getDate() - 7);
        
        const contributions = events.filter(event => {
            const eventDate = new Date(event.created_at);
            return eventDate > last7Days && 
                ['PushEvent', 'PullRequestEvent', 'IssuesEvent', 'CreateEvent'].includes(event.type);
        });

        // Count total commits in push events
        let totalCommits = 0;
        let currentStreak = 0;
        let maxStreak = 0;
        let lastContributionDate = null;

        // Sort events by date
        const sortedEvents = events.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
        
        // Calculate streak
        sortedEvents.forEach(event => {
            const eventDate = new Date(event.created_at);
            if (event.type === 'PushEvent' && event.payload.commits) {
                totalCommits += event.payload.commits.length;
                
                // Calculate streak
                if (!lastContributionDate) {
                    currentStreak = 1;
                    maxStreak = 1;
                } else {
                    const dayDiff = Math.floor((lastContributionDate - eventDate) / (1000 * 60 * 60 * 24));
                    if (dayDiff <= 1) {
                        currentStreak++;
                        maxStreak = Math.max(maxStreak, currentStreak);
                    } else {
                        currentStreak = 1;
                    }
                }
                lastContributionDate = eventDate;
            }
        });

        return {
            weeklyContributions: contributions.length,
            totalCommits: totalCommits,
            currentStreak: currentStreak,
            maxStreak: maxStreak
        };
    } catch (error) {
        console.error('Error fetching GitHub contributions:', error);
        return { 
            weeklyContributions: 0, 
            totalCommits: 0,
            currentStreak: 0,
            maxStreak: 0 
        };
    }
}

// Fetch GitHub languages data
async function fetchGitHubLanguages() {
    try {
        const response = await fetch(`${githubConfig.apiUrl}/users/${githubConfig.username}/repos`, {
            headers: {
                'Accept': 'application/vnd.github.v3+json',
                'Authorization': `token ${githubConfig.token}`
            }
        });
        const repos = await response.json();
        
        const languagesMap = {};
        
        // Fetch languages for each repository
        await Promise.all(repos.map(async repo => {
            if (!repo.fork) { // Only count languages in non-forked repos
                const langResponse = await fetch(repo.languages_url, {
                    headers: {
                        'Accept': 'application/vnd.github.v3+json',
                        'Authorization': `token ${githubConfig.token}`
                    }
                });
                const languages = await langResponse.json();
                
                Object.entries(languages).forEach(([lang, bytes]) => {
                    languagesMap[lang] = (languagesMap[lang] || 0) + bytes;
                });
            }
        }));

        return languagesMap;
    } catch (error) {
        console.error('Error fetching GitHub languages:', error);
        return {};
    }
}

// GitHub Projects Functionality
async function fetchGitHubProjects() {
    const username = 'kawtinx';
    const projectsContainer = document.querySelector('.projects-grid');
    
    if (!projectsContainer) return;

    try {
        const response = await fetch(`https://api.github.com/users/${username}/repos`);
        const projects = await response.json();

        // Sort projects by stars and update time
        const sortedProjects = projects
            .sort((a, b) => {
                const starsCompare = (b.stargazers_count || 0) - (a.stargazers_count || 0);
                if (starsCompare !== 0) return starsCompare;
                return new Date(b.updated_at) - new Date(a.updated_at);
            })
            .slice(0, 6); // Show top 6 projects

        // Update projects container
        projectsContainer.innerHTML = sortedProjects.map(project => `
            <div class="project-card">
                <div class="project-header">
                    <h3 class="project-title">${project.name}</h3>
                    <div class="project-stats">
                        <span class="stars">⭐ ${project.stargazers_count || 0}</span>
                        <span class="forks">🔱 ${project.forks_count || 0}</span>
                    </div>
                </div>
                <p class="project-description">${project.description || 'No description available'}</p>
                <div class="project-footer">
                    <div class="project-language">
                        <span class="language-dot" style="background-color: ${getLanguageColor(project.language)}"></span>
                        ${project.language || 'Unknown'}
                    </div>
                    <a href="${project.html_url}" class="project-link" target="_blank">View Project →</a>
                </div>
            </div>
        `).join('');
    } catch (error) {
        console.error('Error fetching GitHub projects:', error);
        projectsContainer.innerHTML = '<p class="error-message">Failed to load projects. Please try again later.</p>';
    }
}

// Helper function for language colors
function getLanguageColor(language) {
    const colors = {
        JavaScript: '#f1e05a',
        Python: '#3572A5',
        HTML: '#e34c26',
        CSS: '#563d7c',
        TypeScript: '#2b7489',
        Java: '#b07219',
        'C++': '#f34b7d',
        // Add more languages as needed
    };
    return colors[language] || '#858585';
}

// Fetch GitHub repositories
async function fetchGitHubProjectsOld() {
    const projectsContainer = document.querySelector('.projects-grid');
    if (!projectsContainer) return;

    try {
        // Show loading state
        projectsContainer.innerHTML = '<div class="loading">Loading projects...</div>';

        if (!githubConfig.token) {
            throw new Error('NO_TOKEN');
        }

        const headers = {
            'Authorization': `token ${githubConfig.token}`,
            'Accept': 'application/vnd.github.v3+json'
        };

        const response = await fetch(`${githubConfig.apiUrl}/users/${githubConfig.username}/repos`, { headers });
        
        if (!response.ok) {
            if (response.status === 403) {
                const rateLimitResponse = await fetch(`${githubConfig.apiUrl}/rate_limit`, { headers });
                const rateLimitData = await rateLimitResponse.json();
                throw new Error(`RATE_LIMIT:${JSON.stringify(rateLimitData.resources.core)}`);
            }
            throw new Error(`HTTP_ERROR:${response.status}`);
        }

        const repos = await response.json();
        
        // Filter and sort repositories
        const filteredRepos = repos
            .filter(repo => !repo.fork && !repo.archived)
            .sort((a, b) => {
                // Sort by stars first
                if (b.stargazers_count !== a.stargazers_count) {
                    return b.stargazers_count - a.stargazers_count;
                }
                // Then by last updated
                return new Date(b.updated_at) - new Date(a.updated_at);
            });

        if (filteredRepos.length === 0) {
            projectsContainer.innerHTML = `
                <div class="no-projects">
                    <p>No public repositories found for ${githubConfig.username}.</p>
                </div>`;
            return;
        }

        // Create and display project cards
        projectsContainer.innerHTML = filteredRepos
            .map(repo => createProjectCard(repo))
            .join('');

    } catch (error) {
        let errorMessage = '';
        
        if (error.message === 'NO_TOKEN') {
            errorMessage = `
                <div class="error-message">
                    <p><strong>GitHub Personal Access Token Required</strong></p>
                    <p>To display your GitHub projects, you need to add a Personal Access Token. Follow these steps:</p>
                    <ol class="error-steps">
                        <li>Go to <a href="https://github.com/settings/tokens" target="_blank">GitHub Token Settings</a></li>
                        <li>Click "Generate new token" and select "Generate new token (classic)"</li>
                        <li>Give your token a name (e.g., "Website Projects")</li>
                        <li>Select the following scopes: 
                            <ul>
                                <li>public_repo (to read public repository data)</li>
                                <li>read:user (to read user profile data)</li>
                            </ul>
                        </li>
                        <li>Click "Generate token" and copy the token</li>
                        <li>Add the token to the githubConfig object in the script</li>
                    </ol>
                    <p>After adding the token, refresh the page to see your projects.</p>
                </div>`;
        } else if (error.message.startsWith('RATE_LIMIT:')) {
            const rateLimitData = JSON.parse(error.message.split(':')[1]);
            const resetDate = new Date(rateLimitData.reset * 1000);
            errorMessage = `
                <div class="error-message">
                    <p><strong>API Rate Limit Exceeded</strong></p>
                    <p>You've hit the GitHub API rate limit. Please try again after:</p>
                    <div class="error-details">
                        ${resetDate.toLocaleString()}
                    </div>
                    <p>To avoid rate limits, add a Personal Access Token to the configuration.</p>
                </div>`;
        } else if (error.message.startsWith('HTTP_ERROR:')) {
            const statusCode = error.message.split(':')[1];
            errorMessage = `
                <div class="error-message">
                    <p><strong>Failed to Fetch Projects</strong></p>
                    <p>An error occurred while fetching your GitHub projects.</p>
                    <div class="error-details">
                        Status Code: ${statusCode}
                    </div>
                </div>`;
        } else {
            errorMessage = `
                <div class="error-message">
                    <p><strong>Unexpected Error</strong></p>
                    <div class="error-details">
                        ${error.message}
                    </div>
                </div>`;
        }
        
        projectsContainer.innerHTML = errorMessage;
        console.error('Error fetching GitHub projects:', error);
    }
}

// دالة للحصول على الصور المخزنة
function getProjectImages() {
    const imagesData = document.getElementById('project-images-data');
    if (!imagesData) return [];
    try {
        return JSON.parse(imagesData.textContent).images;
    } catch (error) {
        console.error('Error parsing project images:', error);
        return [];
    }
}

// دالة للحصول على صورة مناسبة للمشروع
function getImageForProject(repo) {
    const images = getProjectImages();
    if (images.length === 0) {
        // صورة افتراضية في حالة عدم وجود صور
        return 'https://raw.githubusercontent.com/github/explore/80688e429a7d4ef2fca1e82350fe8e3517d3494d/topics/javascript/javascript.png';
    }

    // محاولة العثور على صورة تتناسب مع لغة البرمجة
    if (repo.language) {
        const languageImage = images.find(img => 
            img.category.toLowerCase() === repo.language.toLowerCase()
        );
        if (languageImage) {
            return languageImage.url;
        }
    }

    // إذا لم نجد صورة مطابقة، نختار واحدة عشوائياً
    return images[Math.floor(Math.random() * images.length)].url;
}

function createProjectCard(repo) {
    const languages = repo.language ? `<span class="language">${repo.language}</span>` : '';
    const visibility = `<span class="visibility">${repo.private ? 'Private' : 'Public'}</span>`;
    
    // الحصول على صورة مناسبة للمشروع
    const projectImage = getImageForProject(repo);
    
    return `
        <div class="project-card">
            <div class="project-image-container">
                <img src="${projectImage}" alt="${repo.name}" class="project-image" loading="lazy" onerror="this.src='https://raw.githubusercontent.com/github/explore/80688e429a7d4ef2fca1e82350fe8e3517d3494d/topics/javascript/javascript.png'">
            </div>
            <div class="project-content">
                <div class="project-header">
                    <h3><a href="${repo.html_url}" target="_blank">${repo.name}</a></h3>
                    ${visibility}
                </div>
                <p class="project-description">${repo.description || 'No description available.'}</p>
                <div class="project-meta">
                    ${languages}
                    <span class="stars">★ ${repo.stargazers_count}</span>
                    <span class="forks">⑂ ${repo.forks_count}</span>
                </div>
            </div>
        </div>`;
}

// Update stats display
async function updateStats() {
    const stats = await fetchGitHubContributions();
    
    // Update completions (7 days)
    document.querySelector('.completions-7-days').textContent = stats.weeklyContributions;
    
    // Update total completions
    document.querySelector('.total-completions').textContent = stats.totalCommits;
    
    // Update streak
    const streakElement = document.querySelector('.streak-count');
    streakElement.textContent = `${stats.currentStreak} Days `;
    streakElement.setAttribute('data-streak', Math.min(14, stats.currentStreak));
    
    // Update streak record
    document.querySelector('.streak-record').textContent = `(${stats.maxStreak} day record)`;
}

// Update activity chart with GitHub data
async function updateActivityChart() {
    const { weeklyContributions, totalCommits } = await fetchGitHubContributions();
    
    // Update stats
    document.querySelectorAll('.stat-number')[0].textContent = weeklyContributions;
    document.querySelectorAll('.stat-number')[1].textContent = totalCommits;

    // Get contribution calendar data
    const today = new Date();
    const months = Array.from({length: 13}, (_, i) => {
        const d = new Date();
        d.setMonth(d.getMonth() - (12 - i));
        return d.toLocaleString('default', { month: 'short' });
    });

    const activityCtx = document.getElementById('activityChart').getContext('2d');
    const activityChart = new Chart(activityCtx, {
        type: 'bar',
        data: {
            labels: months,
            datasets: [{
                label: 'GitHub Activity',
                data: [4, 3, 2, 1, 5, 4, 3, 2, 4, 5, 3, 2, weeklyContributions],
                backgroundColor: '#00E7C1',
                borderRadius: 4,
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                y: {
                    beginAtZero: true,
                    grid: {
                        color: '#2A2A2A'
                    },
                    ticks: {
                        color: '#FFFFFF'
                    }
                },
                x: {
                    grid: {
                        display: false
                    },
                    ticks: {
                        color: '#FFFFFF'
                    }
                }
            },
            plugins: {
                legend: {
                    display: false
                }
            }
        }
    });
}

// Update languages chart with GitHub data
async function updateLanguagesChart() {
    const languages = await fetchGitHubLanguages();
    
    // Convert languages data to percentages
    const total = Object.values(languages).reduce((a, b) => a + b, 0);
    const languagePercentages = {};
    Object.entries(languages).forEach(([lang, bytes]) => {
        languagePercentages[lang] = (bytes / total) * 100;
    });

    // Sort languages by percentage
    const sortedLanguages = Object.entries(languagePercentages)
        .sort(([,a], [,b]) => b - a)
        .slice(0, 5); // Take top 5 languages

    const languagesCtx = document.getElementById('languagesChart').getContext('2d');
    const languagesChart = new Chart(languagesCtx, {
        type: 'doughnut',
        data: {
            labels: sortedLanguages.map(([lang]) => lang),
            datasets: [{
                data: sortedLanguages.map(([,percentage]) => percentage),
                backgroundColor: [
                    '#3776AB', // Python
                    '#E34F26', // HTML
                    '#F7DF1E', // JavaScript
                    '#4EAA25', // Shell
                    '#666666'  // Others
                ],
                borderWidth: 0
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'right',
                    labels: {
                        color: '#FFFFFF',
                        padding: 20,
                        font: {
                            size: 14
                        }
                    }
                }
            },
            cutout: '70%'
        }
    });

    // Update language icons
    const languageIcons = document.querySelector('.language-icons');
    languageIcons.innerHTML = sortedLanguages.slice(0, 3).map(([lang]) => `
        <div class="language-icon">
            <img src="https://cdn.jsdelivr.net/gh/devicons/devicon/icons/${lang.toLowerCase()}/${lang.toLowerCase()}-original.svg" 
                 alt="${lang}" 
                 onerror="this.src='https://cdn.jsdelivr.net/gh/devicons/devicon/icons/github/github-original.svg'">
            <span>${lang}</span>
        </div>
    `).join('');
}

// Navigation and Section Management
document.addEventListener('DOMContentLoaded', () => {
    const sections = {
        'profile': document.querySelector('.profile-container'),
        'sites': document.querySelector('.sites-section'),
        'projects': document.querySelector('.projects-section'),
        'live': document.querySelector('.live-section'),
        'pricing': document.querySelector('.pricing-section')
    };

    // Initial GitHub projects fetch
    fetchGitHubProjects();

    // Hide all sections except profile initially
    Object.entries(sections).forEach(([key, section]) => {
        if (section) {
            section.style.display = key === 'profile' ? 'flex' : 'none';
        }
    });

    // Navigation click handler
    document.querySelectorAll('.nav-links a').forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const sectionId = link.getAttribute('data-section');
            
            // Hide all sections
            Object.values(sections).forEach(section => {
                if (section) {
                    section.style.display = 'none';
                }
            });

            // Show selected section
            if (sections[sectionId]) {
                sections[sectionId].style.display = sectionId === 'profile' ? 'flex' : 'block';
                
                // Refresh projects when projects section is shown
                if (sectionId === 'projects') {
                    fetchGitHubProjects();
                }
            }

            // Update active link
            document.querySelectorAll('.nav-links a').forEach(navLink => {
                navLink.classList.remove('active');
            });
            link.classList.add('active');
        });
    });
});

// Gemini API Configuration
const GEMINI_API_KEY = 'AIzaSyDAYR81XQqAEfHnfEJYWHiqpi8oX6V01Ag';
const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent';

// Initialize everything when DOM is loaded
document.addEventListener('DOMContentLoaded', async function() {
    try {
        // Fetch initial GitHub stats
        const stats = await fetchGitHubStats();
        if (stats) {
            // Update any additional stats if needed
            console.log('GitHub Stats:', stats);
        }

        await updateStats();
        await updateActivityChart();
        await updateLanguagesChart();

        // Modal functionality
        const modal = document.getElementById('downloadModal');
        const downloadBtns = document.querySelectorAll('.download-btn');
        
        downloadBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                modal.style.display = 'block';
                document.body.style.overflow = 'hidden';
            });
        });
        
        window.addEventListener('click', (event) => {
            if (event.target === modal) {
                modal.style.display = 'none';
                document.body.style.overflow = '';
            }
        });
    } catch (error) {
        console.error('Error initializing dashboard:', error);
    }
});

// Twitter Feed Functionality
async function fetchTwitterFeed() {
    const twitterContainer = document.querySelector('.twitter-feed .social-posts');
    if (!twitterContainer) return;

    const TWITTER_TOKEN = 'AAAAAAAAAAAAAAAAAAAAAMZgxQEAAAAA4DhILHV9uMAhpnFzAK9t79Y5YyI%3DQdk2Ia2HjqribJ9HHoXSc7SnUZQ3qK9acSO0Ht675yq03riH0o';
    const TWITTER_API_URL = 'https://api.twitter.com/2/tweets/search/recent';
    const TWO_HOURS = 2 * 60 * 60 * 1000; // 2 hours in milliseconds

    // Function to update tweets
    async function updateTweets() {
        // Show loading state
        twitterContainer.innerHTML = '<div class="loading">Loading tweets...</div>';

        try {
            // Prepare search parameters
            const params = new URLSearchParams({
                'query': 'programming OR coding OR webdev OR javascript OR python -is:retweet lang:en',
                'max_results': '10',
                'tweet.fields': 'public_metrics,created_at',
                'expansions': 'author_id',
                'user.fields': 'name,username,profile_image_url'
            });

            // Fetch tweets about programming
            const response = await fetch(`${TWITTER_API_URL}?${params}`, {
                headers: {
                    'Authorization': `Bearer ${TWITTER_TOKEN}`,
                    'Content-Type': 'application/json'
                }
            });

            if (!response.ok) {
                throw new Error('Failed to fetch tweets');
            }

            const data = await response.json();
            
            // Process the tweets
            const tweets = data.data.map(tweet => {
                const author = data.includes.users.find(user => user.id === tweet.author_id);
                return {
                    name: author.name,
                    username: `@${author.username}`,
                    profilePic: author.profile_image_url,
                    content: tweet.text,
                    likes: tweet.public_metrics.like_count,
                    retweets: tweet.public_metrics.retweet_count
                };
            });

            // Update the container with real tweets
            twitterContainer.innerHTML = tweets.map(tweet => `
                <div class="post">
                    <div class="post-header">
                        <img src="${tweet.profilePic}" alt="${tweet.name}" class="profile-pic">
                        <div class="post-info">
                            <span class="name">${tweet.name}</span>
                            <span class="username">${tweet.username}</span>
                        </div>
                    </div>
                    <p class="post-content">${tweet.content}</p>
                    <div class="post-stats">
                        <span>❤️ ${tweet.likes}</span>
                        <span>🔁 ${tweet.retweets}</span>
                    </div>
                </div>
            `).join('');

            // Add last updated timestamp
            const timestampDiv = document.createElement('div');
            timestampDiv.className = 'last-updated';
            timestampDiv.textContent = `Last updated: ${new Date().toLocaleTimeString()}`;
            twitterContainer.insertAdjacentElement('beforebegin', timestampDiv);

        } catch (error) {
            console.error('Error fetching tweets:', error);
            // Fallback to sample tweets if API fails
            const sampleTweets = [
                {
                    name: "JavaScript Daily",
                    username: "@JavaScriptDaily",
                    profilePic: "https://pbs.twimg.com/profile_images/988505844915556354/lgUSY3mZ_400x400.jpg",
                    content: "🔥 New in JavaScript: The Optional Chaining Operator (?.) - Write safer code when accessing nested properties! #JavaScript #WebDev",
                    likes: 324,
                    retweets: 156
                },
                {
                    name: "CSS-Tricks",
                    username: "@css",
                    profilePic: "https://pbs.twimg.com/profile_images/1080202898372362240/akqRGyta_400x400.jpg",
                    content: "💡 CSS Grid Tip: Use minmax() for responsive layouts without media queries! Example: grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); #CSS #WebDesign",
                    likes: 452,
                    retweets: 201
                },
                {
                    name: "GitHub",
                    username: "@github",
                    profilePic: "https://pbs.twimg.com/profile_images/1633247750010830848/8zF3Muws_400x400.png",
                    content: "🎉 Copilot is now available for everyone! Write better code faster with AI-powered code suggestions. #GitHub #AI #Programming",
                    likes: 1205,
                    retweets: 508
                }
            ];

            twitterContainer.innerHTML = sampleTweets.map(tweet => `
                <div class="post">
                    <div class="post-header">
                        <img src="${tweet.profilePic}" alt="${tweet.name}" class="profile-pic">
                        <div class="post-info">
                            <span class="name">${tweet.name}</span>
                            <span class="username">${tweet.username}</span>
                        </div>
                    </div>
                    <p class="post-content">${tweet.content}</p>
                    <div class="post-stats">
                        <span>❤️ ${tweet.likes}</span>
                        <span>🔁 ${tweet.retweets}</span>
                    </div>
                </div>
            `).join('');
        }
    }

    // Initial load
    await updateTweets();

    // Set up auto-refresh every 2 hours
    setInterval(updateTweets, TWO_HOURS);
}

// Reddit Programming Feed
async function fetchRedditProgramming() {
    const redditContainer = document.querySelector('.instagram-feed .social-posts');
    if (!redditContainer) return;

    // Show loading state
    redditContainer.innerHTML = '<div class="loading">Loading posts...</div>';

    try {
        // For now, showing sample programming posts from Reddit
        const samplePosts = [
            {
                title: "The Future of Web Development",
                content: "Just completed my first full-stack project using Next.js 13 and loving the developer experience! Here's what I learned... #webdev #programming",
                image: "https://images.unsplash.com/photo-1517180102446-f3ece451e9d8?w=500",
                upvotes: 2543,
                comments: 342
            },
            {
                title: "Python Tips & Tricks",
                content: "5 Python features that will make your code more elegant and readable. Check out these practical examples! #Python #coding",
                image: "https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?w=500",
                upvotes: 1876,
                comments: 231
            },
            {
                title: "Modern Development Tools",
                content: "Essential VS Code extensions every developer should have in 2024. Boost your productivity! #VSCode #DevTools",
                image: "https://images.unsplash.com/photo-1461749280684-dccba630e2f6?w=500",
                upvotes: 3102,
                comments: 456
            }
        ];

        // Update the container with Reddit posts
        redditContainer.innerHTML = samplePosts.map(post => `
            <div class="post">
                <img src="${post.image}" alt="${post.title}" class="post-image">
                <div class="post-content">
                    <h4>${post.title}</h4>
                    <p>${post.content}</p>
                    <div class="post-stats">
                        <span>⬆️ ${post.upvotes}</span>
                        <span>💬 ${post.comments}</span>
                    </div>
                </div>
            </div>
        `).join('');

    } catch (error) {
        console.error('Error fetching Reddit posts:', error);
        redditContainer.innerHTML = '<div class="error">Failed to load posts. Please try again later.</div>';
    }
}

// Update the section visibility code to fetch feeds when showing the pricing section
document.addEventListener('DOMContentLoaded', () => {
    const sections = {
        'profile': document.querySelector('.profile-container'),
        'sites': document.querySelector('.sites-section'),
        'projects': document.querySelector('.projects-section'),
        'live': document.querySelector('.live-section'),
        'pricing': document.querySelector('.pricing-section')
    };

    // Initial GitHub projects fetch
    fetchGitHubProjects();

    // Hide all sections except profile initially
    Object.entries(sections).forEach(([key, section]) => {
        if (section) {
            section.style.display = key === 'profile' ? 'flex' : 'none';
        }
    });

    // Navigation click handler
    document.querySelectorAll('.nav-links a').forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const sectionId = link.getAttribute('data-section');
            
            // Hide all sections
            Object.values(sections).forEach(section => {
                if (section) {
                    section.style.display = 'none';
                }
            });

            // Show selected section
            if (sections[sectionId]) {
                sections[sectionId].style.display = sectionId === 'profile' ? 'flex' : 'block';
                
                // Refresh content based on section
                if (sectionId === 'projects') {
                    fetchGitHubProjects();
                } else if (sectionId === 'pricing') {
                    fetchProgrammingFeed();
                    fetchRedditProgramming();
                }
            }

            // Update active link
            document.querySelectorAll('.nav-links a').forEach(navLink => {
                navLink.classList.remove('active');
            });
            link.classList.add('active');
        });
    });
});

// Programming Highlights Feed
async function fetchProgrammingHighlights() {
    const highlightsContainer = document.querySelector('.twitter-feed .social-posts');
    if (!highlightsContainer) return;

    const TWO_HOURS = 2 * 60 * 60 * 1000;

    // Curated programming highlights
    const highlights = [
        {
            author: "JavaScript Tips",
            username: "@js_tips",
            profilePic: "https://pbs.twimg.com/profile_images/988505844915556354/lgUSY3mZ_400x400.jpg",
            content: "🔥 نصيحة برمجية #1: \nاستخدم Optional Chaining (?.) في JavaScript للوصول الآمن للخصائص المتداخلة:\n\n```js\nconst data = response?.data?.user?.name || 'Default';\n```\n\nيمنع الأخطاء عند عدم وجود القيم! #JavaScript #البرمجة",
            code: `const data = response?.data?.user?.name || 'Default';`,
            likes: 234,
            retweets: 89,
            language: 'javascript'
        },
        {
            author: "Python Dev Tips",
            username: "@python_tips",
            profilePic: "https://pbs.twimg.com/profile_images/1387795351017943041/DGIHFtZP_400x400.jpg",
            content: "🐍 نصيحة برمجية #2: \nاستخدم List Comprehension في Python لكتابة كود أنظف:\n\n```python\nnumbers = [x for x in range(10) if x % 2 == 0]\n```\n\nأسرع وأوضح من الحلقات التقليدية! #Python #البرمجة",
            code: `numbers = [x for x in range(10) if x % 2 == 0]`,
            likes: 456,
            retweets: 178,
            language: 'python'
        },
        {
            author: "React Tips",
            username: "@react_tips",
            profilePic: "https://pbs.twimg.com/profile_images/446356636710363136/OYIaJ1KK_400x400.png",
            content: "⚛️ نصيحة برمجية #3: \nاستخدم React.memo لتحسين الأداء:\n\n```jsx\nconst MemoizedComponent = React.memo(MyComponent);\n```\n\nيمنع إعادة التصيير غير الضرورية! #React #البرمجة",
            code: `const MemoizedComponent = React.memo(MyComponent);`,
            likes: 567,
            retweets: 234,
            language: 'jsx'
        },
        {
            author: "Git Master",
            username: "@git_tips",
            profilePic: "https://git-scm.com/images/logos/downloads/Git-Icon-1788C.png",
            content: "🌳 نصيحة برمجية #4: \nاستخدم Git Stash لحفظ التغييرات المؤقتة:\n\n```bash\ngit stash push -m 'my changes'\ngit stash pop\n```\n\nمثالي للتبديل بين المهام! #Git #البرمجة",
            code: `git stash push -m 'my changes'\ngit stash pop`,
            likes: 345,
            retweets: 123,
            language: 'bash'
        },
        {
            author: "CSS Wizard",
            username: "@css_tips",
            profilePic: "https://pbs.twimg.com/profile_images/1080202898372362240/akqRGyta_400x400.jpg",
            content: "🎨 نصيحة برمجية #5: \nاستخدم CSS Grid للتخطيطات المتقدمة:\n\n```css\n.grid {\n  display: grid;\n  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));\n}\n```\n\nتخطيطات متجاوبة بسطر واحد! #CSS #البرمجة",
            code: `.grid {\n  display: grid;\n  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));\n}`,
            likes: 678,
            retweets: 245,
            language: 'css'
        }
    ];

    async function updateHighlights() {
        try {
            highlightsContainer.innerHTML = highlights.map(highlight => `
                <div class="post highlight">
                    <div class="post-header">
                        <img src="${highlight.profilePic}" alt="${highlight.author}" class="profile-pic">
                        <div class="post-info">
                            <span class="name">${highlight.author}</span>
                            <span class="username">${highlight.username}</span>
                        </div>
                    </div>
                    <p class="post-content">${highlight.content}</p>
                    <div class="code-block">
                        <pre><code class="language-${highlight.language}">${highlight.code}</code></pre>
                    </div>
                    <div class="post-stats">
                        <span class="stat">❤️ ${highlight.likes}</span>
                        <span class="stat">🔁 ${highlight.retweets}</span>
                    </div>
                </div>
            `).join('');

            // Initialize Prism.js for syntax highlighting
            if (window.Prism) {
                Prism.highlightAll();
            }

            // Add last updated timestamp
            const timestampDiv = document.createElement('div');
            timestampDiv.className = 'last-updated';
            timestampDiv.textContent = `آخر تحديث: ${new Date().toLocaleTimeString('ar-SA')}`;
            highlightsContainer.insertAdjacentElement('beforebegin', timestampDiv);

        } catch (error) {
            console.error('Error updating highlights:', error);
            highlightsContainer.innerHTML = '<div class="error">فشل تحميل المحتوى. يرجى المحاولة مرة أخرى لاحقاً.</div>';
        }
    }

    // Initial load
    await updateHighlights();

    // Set up auto-refresh every 2 hours
    setInterval(updateHighlights, TWO_HOURS);
}

// Update the initialization to use Programming Highlights
document.addEventListener('DOMContentLoaded', () => {
    // ... other initialization code ...
    
    // Replace Twitter feed with Programming Highlights
    fetchProgrammingHighlights();
});

// Featured Article
async function fetchFeaturedArticle() {
    const articleContainer = document.querySelector('.article-container');
    if (!articleContainer) return;

    const featuredArticle = {
        title: "كيف تصبح مبرمجاً محترفاً في 2024",
        author: "أحمد المطور",
        date: new Date(),
        content: `
            تعلم البرمجة رحلة ممتعة ومليئة بالتحديات. في هذا المقال، سنستعرض أهم المهارات والأدوات التي يحتاجها المبرمج المحترف في عام 2024.
            
            🔑 النقاط الرئيسية:
            • تعلم أساسيات البرمجة بشكل قوي
            • اختيار المسار المناسب (Web, Mobile, AI)
            • التدرب على حل المشكلات البرمجية
            • بناء مشاريع حقيقية
            • المشاركة في مجتمع المبرمجين
        `,
        image: "https://images.unsplash.com/photo-1461749280684-dccba630e2f6?w=800",
        tags: ["تعلم البرمجة", "نصائح احترافية", "تطوير الذات"]
    };

    articleContainer.innerHTML = `
        <div class="featured-article-content">
            <img src="${featuredArticle.image}" alt="${featuredArticle.title}" class="featured-image">
            <div class="article-meta">
                <span class="author">${featuredArticle.author}</span>
                <span class="date">${featuredArticle.date.toLocaleDateString('ar-SA')}</span>
            </div>
            <h4 class="article-title">${featuredArticle.title}</h4>
            <p class="article-text">${featuredArticle.content}</p>
            <div class="article-tags">
                ${featuredArticle.tags.map(tag => `<span class="tag">${tag}</span>`).join('')}
            </div>
        </div>
    `;
}

// Update initialization
document.addEventListener('DOMContentLoaded', () => {
    // ... other initialization code ...
    
    // Initialize Dshomo section
    fetchFeaturedArticle();
    fetchProgrammingHighlights();
});

// Chat Interface
document.addEventListener('DOMContentLoaded', () => {
    const chatInput = document.getElementById('chat-input');
    const sendButton = document.getElementById('send-message');
    const chatMessages = document.getElementById('chat-messages');
    let isProcessing = false;

    // Auto-resize input
    chatInput.addEventListener('input', () => {
        chatInput.style.height = 'auto';
        chatInput.style.height = chatInput.scrollHeight + 'px';
    });

    // Function to make API call to Gemini
    async function getGeminiResponse(message) {
        try {
            const response = await fetch(`${GEMINI_API_URL}?key=${GEMINI_API_KEY}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    contents: [{
                        parts: [{
                            text: message
                        }]
                    }]
                })
            });

            if (!response.ok) {
                throw new Error('API request failed');
            }

            const data = await response.json();
            return data.candidates[0].content.parts[0].text;
        } catch (error) {
            console.error('Error calling Gemini API:', error);
            return 'Sorry, I encountered an error while processing your request.';
        }
    }

    // Send message function
    const sendMessage = async () => {
        const message = chatInput.value.trim();
        if (message === '' || isProcessing) return;

        // Add user message
        const userMessageDiv = document.createElement('div');
        userMessageDiv.className = 'message user-message';
        userMessageDiv.textContent = message;
        chatMessages.appendChild(userMessageDiv);

        // Clear input and reset height
        chatInput.value = '';
        chatInput.style.height = 'auto';

        // Show loading indicator
        isProcessing = true;
        const loadingDiv = document.createElement('div');
        loadingDiv.className = 'loading';
        loadingDiv.innerHTML = '<span></span><span></span><span></span>';
        chatMessages.appendChild(loadingDiv);

        try {
            // Get response from Gemini API
            const aiResponse = await getGeminiResponse(message);
            
            // Remove loading indicator
            loadingDiv.remove();
            
            // Add AI response
            const aiMessageDiv = document.createElement('div');
            aiMessageDiv.className = 'message ai-message';
            aiMessageDiv.textContent = aiResponse;
            chatMessages.appendChild(aiMessageDiv);
        } catch (error) {
            loadingDiv.remove();
            const errorDiv = document.createElement('div');
            errorDiv.className = 'message ai-message error';
            errorDiv.textContent = 'Sorry, I encountered an error. Please try again.';
            chatMessages.appendChild(errorDiv);
        } finally {
            isProcessing = false;
            chatMessages.scrollTop = chatMessages.scrollHeight;
        }
    };

    // Send button click
    sendButton.addEventListener('click', sendMessage);

    // Enter key press
    chatInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            sendMessage();
        }
    });
});

// Function to fetch featured articles from an RSS feed
async function fetchFeaturedArticles() {
    try {
        // List of RSS feeds to fetch from
        const rssFeeds = [
            'https://news.ycombinator.com/rss',  // Hacker News
            'https://dev.to/feed/tag/programming',
            'https://medium.com/feed/tag/programming'
        ];
        
        const articles = [];
        for (const feed of rssFeeds) {
            try {
                const response = await fetch(`https://api.rss2json.com/v1/api.json?rss_url=${encodeURIComponent(feed)}&api_key=YOUR_RSS2JSON_API_KEY`);
                const data = await response.json();
                
                if (data.status === 'ok' && data.items) {
                    // Process each article
                    const processedItems = data.items.map(item => ({
                        title: item.title,
                        pubDate: item.pubDate,
                        link: item.link,
                        author: item.author || data.feed.title, // Use feed title if no author
                        thumbnail: item.thumbnail || getDefaultThumbnail(data.feed.title),
                        description: cleanDescription(item.description),
                        categories: item.categories || [data.feed.title],
                        source: data.feed.title
                    }));
                    articles.push(...processedItems);
                }
            } catch (feedError) {
                console.error(`Error fetching feed ${feed}:`, feedError);
                continue; // Continue with other feeds if one fails
            }
        }

        // Sort by date and get the most recent articles
        const sortedArticles = articles
            .sort((a, b) => new Date(b.pubDate) - new Date(a.pubDate))
            .slice(0, 5); // Get top 5 articles

        return sortedArticles;
    } catch (error) {
        console.error('Error in fetchFeaturedArticles:', error);
        return [];
    }
}

// Helper function to clean article descriptions
function cleanDescription(description) {
    // Remove HTML tags and limit length
    const cleanText = description.replace(/<[^>]*>/g, '');
    return cleanText.length > 200 ? cleanText.substring(0, 200) + '...' : cleanText;
}

// Helper function to get default thumbnail based on source
function getDefaultThumbnail(source) {
    const defaultThumbnails = {
        'Hacker News': 'https://news.ycombinator.com/y18.gif',
        'DEV Community': 'https://dev-to-uploads.s3.amazonaws.com/uploads/logos/resized_logo_UQww2soKuUsjaOGNB38o.png',
        'Medium': 'https://miro.medium.com/max/1200/1*vuXwRetEydrZ6YHmYjKwIQ.png'
    };
    return defaultThumbnails[source] || 'https://images.unsplash.com/photo-1461749280684-dccba630e2f6?ixlib=rb-4.0.3';
}

// Function to display featured articles
function displayFeaturedArticles(articles) {
    if (!articles || articles.length === 0) return;

    const featuredArticleSection = document.querySelector('.featured-article-content');
    if (!featuredArticleSection) return;

    // Display the first (most recent) article as featured
    const featuredArticle = articles[0];
    const date = new Date(featuredArticle.pubDate).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });

    featuredArticleSection.innerHTML = `
        <img src="${featuredArticle.thumbnail}" alt="Article thumbnail" class="featured-image">
        <div class="article-meta">
            <span class="author">From ${featuredArticle.source}</span>
            <span class="date">${date}</span>
        </div>
        <h4 class="article-title">${featuredArticle.title}</h4>
        <p class="article-text">${featuredArticle.description}</p>
        <div class="article-tags">
            ${featuredArticle.categories.map(category => `<span class="tag">${category}</span>`).join('')}
        </div>
        <a href="${featuredArticle.link}" target="_blank" class="read-more">Read More →</a>
    `;

    // Display other articles in the related articles section
    const relatedArticlesSection = document.querySelector('.related-articles');
    if (relatedArticlesSection && articles.length > 1) {
        const relatedArticlesHTML = articles.slice(1).map(article => `
            <div class="related-article-card">
                <h5>${article.title}</h5>
                <div class="article-meta">
                    <span class="source">${article.source}</span>
                    <span class="date">${new Date(article.pubDate).toLocaleDateString()}</span>
                </div>
                <a href="${article.link}" target="_blank">Read →</a>
            </div>
        `).join('');
        
        relatedArticlesSection.innerHTML = `
            <h3>More Articles</h3>
            <div class="related-articles-grid">
                ${relatedArticlesHTML}
            </div>
        `;
    }
}

// Update the initialization function
async function initializeAutoContent() {
    // Load initial content
    const articles = await fetchFeaturedArticles();
    displayFeaturedArticles(articles);

    const tweets = await fetchProgrammingTweets();
    displayProgrammingTips(tweets);

    // Refresh content periodically (every 30 minutes)
    setInterval(async () => {
        const newArticles = await fetchFeaturedArticles();
        displayFeaturedArticles(newArticles);

        const newTweets = await fetchProgrammingTweets();
        displayProgrammingTips(newTweets);
    }, 30 * 60 * 1000);
}

// Function to fetch featured articles from an RSS feed
async function fetchFeaturedArticles() {
    try {
        // List of RSS feeds to fetch from
        const rssFeeds = [
            'https://news.ycombinator.com/rss',  // Hacker News
            'https://dev.to/feed/tag/programming',
            'https://medium.com/feed/tag/programming'
        ];
        
        const articles = [];
        for (const feed of rssFeeds) {
            try {
                const response = await fetch(`https://api.rss2json.com/v1/api.json?rss_url=${encodeURIComponent(feed)}&api_key=YOUR_RSS2JSON_API_KEY`);
                const data = await response.json();
                
                if (data.status === 'ok' && data.items) {
                    // Process each article
                    const processedItems = data.items.map(item => ({
                        title: item.title,
                        pubDate: item.pubDate,
                        link: item.link,
                        author: item.author || data.feed.title, // Use feed title if no author
                        thumbnail: item.thumbnail || getDefaultThumbnail(data.feed.title),
                        description: cleanDescription(item.description),
                        categories: item.categories || [data.feed.title],
                        source: data.feed.title
                    }));
                    articles.push(...processedItems);
                }
            } catch (feedError) {
                console.error(`Error fetching feed ${feed}:`, feedError);
                continue; // Continue with other feeds if one fails
            }
        }

        // Sort by date and get the most recent articles
        const sortedArticles = articles
            .sort((a, b) => new Date(b.pubDate) - new Date(a.pubDate))
            .slice(0, 5); // Get top 5 articles

        return sortedArticles;
    } catch (error) {
        console.error('Error in fetchFeaturedArticles:', error);
        return [];
    }
}

// Helper function to clean article descriptions
function cleanDescription(description) {
    // Remove HTML tags and limit length
    const cleanText = description.replace(/<[^>]*>/g, '');
    return cleanText.length > 200 ? cleanText.substring(0, 200) + '...' : cleanText;
}

// Helper function to get default thumbnail based on source
function getDefaultThumbnail(source) {
    const defaultThumbnails = {
        'Hacker News': 'https://news.ycombinator.com/y18.gif',
        'DEV Community': 'https://dev-to-uploads.s3.amazonaws.com/uploads/logos/resized_logo_UQww2soKuUsjaOGNB38o.png',
        'Medium': 'https://miro.medium.com/max/1200/1*vuXwRetEydrZ6YHmYjKwIQ.png'
    };
    return defaultThumbnails[source] || 'https://images.unsplash.com/photo-1461749280684-dccba630e2f6?ixlib=rb-4.0.3';
}

// Function to display featured articles
function displayFeaturedArticles(articles) {
    if (!articles || articles.length === 0) return;

    const featuredArticleSection = document.querySelector('.featured-article-content');
    if (!featuredArticleSection) return;

    // Display the first (most recent) article as featured
    const featuredArticle = articles[0];
    const date = new Date(featuredArticle.pubDate).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });

    featuredArticleSection.innerHTML = `
        <img src="${featuredArticle.thumbnail}" alt="Article thumbnail" class="featured-image">
        <div class="article-meta">
            <span class="author">From ${featuredArticle.source}</span>
            <span class="date">${date}</span>
        </div>
        <h4 class="article-title">${featuredArticle.title}</h4>
        <p class="article-text">${featuredArticle.description}</p>
        <div class="article-tags">
            ${featuredArticle.categories.map(category => `<span class="tag">${category}</span>`).join('')}
        </div>
        <a href="${featuredArticle.link}" target="_blank" class="read-more">Read More →</a>
    `;

    // Display other articles in the related articles section
    const relatedArticlesSection = document.querySelector('.related-articles');
    if (relatedArticlesSection && articles.length > 1) {
        const relatedArticlesHTML = articles.slice(1).map(article => `
            <div class="related-article-card">
                <h5>${article.title}</h5>
                <div class="article-meta">
                    <span class="source">${article.source}</span>
                    <span class="date">${new Date(article.pubDate).toLocaleDateString()}</span>
                </div>
                <a href="${article.link}" target="_blank">Read →</a>
            </div>
        `).join('');
        
        relatedArticlesSection.innerHTML = `
            <h3>More Articles</h3>
            <div class="related-articles-grid">
                ${relatedArticlesHTML}
            </div>
        `;
    }
}

// Update the initialization function
async function initializeAutoContent() {
    // Load initial content
    const articles = await fetchFeaturedArticles();
    displayFeaturedArticles(articles);

    const tweets = await fetchProgrammingTweets();
    displayProgrammingTips(tweets);

    // Refresh content periodically (every 30 minutes)
    setInterval(async () => {
        const newArticles = await fetchFeaturedArticles();
        displayFeaturedArticles(newArticles);

        const newTweets = await fetchProgrammingTweets();
        displayProgrammingTips(newTweets);
    }, 30 * 60 * 1000);
}

// Function to fetch programming tweets
async function fetchProgrammingTweets() {
    try {
        // Using a proxy API to fetch tweets with #programming hashtag
        const response = await fetch('https://nitter.net/search/rss?f=tweets&q=%23programming');
        const data = await response.text();
        const parser = new DOMParser();
        const xml = parser.parseFromString(data, 'text/xml');
        const items = xml.querySelectorAll('item');
        
        return Array.from(items).map(item => ({
            author: item.querySelector('creator')?.textContent || 'Unknown',
            content: item.querySelector('description')?.textContent,
            date: new Date(item.querySelector('pubDate')?.textContent).toLocaleDateString(),
            link: item.querySelector('link')?.textContent
        })).slice(0, 5); // Get the 5 most recent tweets
    } catch (error) {
        console.error('Error fetching tweets:', error);
        return [];
    }
}

// Function to display programming tips/tweets
function displayProgrammingTips(tweets) {
    const tipsGrid = document.querySelector('.tips-grid');
    if (!tipsGrid) return;

    tipsGrid.innerHTML = tweets.map(tweet => `
        <div class="tip-card">
            <div class="tip-header">
                <div class="tip-meta">
                    <span class="tip-author">${tweet.author}</span>
                    <span class="tip-date">${tweet.date}</span>
                </div>
            </div>
            <p class="tip-content">${tweet.content}</p>
            <a href="${tweet.link}" target="_blank" class="tip-link">View on Twitter →</a>
        </div>
    `).join('');
}

// Function to initialize automatic content loading
async function initializeAutoContent() {
    // Load initial content
    const article = await fetchFeaturedArticles();
    displayFeaturedArticle(article);

    const tweets = await fetchProgrammingTweets();
    displayProgrammingTips(tweets);

    // Refresh content periodically (every 30 minutes)
    setInterval(async () => {
        const newArticle = await fetchFeaturedArticles();
        displayFeaturedArticle(newArticle);

        const newTweets = await fetchProgrammingTweets();
        displayProgrammingTips(newTweets);
    }, 30 * 60 * 1000);
}

// Start automatic content loading when the page loads
document.addEventListener('DOMContentLoaded', initializeAutoContent);
