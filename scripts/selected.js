document.addEventListener('DOMContentLoaded', () => {
    const selectedLink = document.getElementById('selected-link');

    if (selectedLink) {
        selectedLink.addEventListener('click', (e) => {
            e.preventDefault();
            loadSelectedContent();
        });
    }
});

// 加载精选内容函数
export function loadSelectedContent() {
    fetch('html/selected.html')
        .then(response => response.text())
        .then(htmlStr => {
            const parser = new DOMParser();
            const doc = parser.parseFromString(htmlStr, 'text/html');
            const newMainContent = doc.querySelector('main').innerHTML;
            document.getElementById('main-content').innerHTML = newMainContent;
            
            // 初始化分类按钮并加载默认分类（推荐）的歌单
            initCategoryButtons();
            loadPlaylistsByCategory('全部');
        })
        .catch(err => console.error('加载 Selected 页面失败:', err));
}

// 格式化播放次数
function formatPlayCount(count) {
    if (count < 10000) return count;
    if (count < 100000000) return Math.floor(count / 10000) + '万';
    return Math.floor(count / 100000000) + '亿';
}

// 获取精品歌单
async function fetchHighqualityPlaylists(category = '全部', limit = 50) {
    try {
        const url = `http://localhost:3000/top/playlist/highquality?cat=${encodeURIComponent(category)}&limit=${limit}`;
        const response = await fetch(url);
        const data = await response.json();
        return data.playlists;
    } catch (error) {
        console.error('获取精品歌单失败:', error);
        return [];
    }
}

// 渲染歌单列表
function renderPlaylists(playlists) {
    const gridContainer = document.querySelector('.recommend-grid'); // 继承 home.css 的 recommend-grid
    if (!gridContainer || !playlists) return;

    const playlistsHtml = playlists.map(playlist => `
        <div class="recommend-item"> 
            <div class="cover-container">
                <img src="${playlist.coverImgUrl}" alt="${playlist.name}" class="cover">
            </div>
            <div class="item-overlay">
                <div class="play-count">
                    <i class="iconfont icon-play"></i>
                    ${formatPlayCount(playlist.playCount)}
                </div>
                <div class="item-info">
                    <p class="title">
                        <a href="#playlist/${playlist.id}" class="playlist-link">${playlist.name}</a>
                    </p>
                    <p class="artist">${playlist.creator.nickname}</p>
                </div>
            </div>
        </div>
    `).join('');

    gridContainer.innerHTML = playlistsHtml;
}

// 根据分类加载歌单
async function loadPlaylistsByCategory(category) {
    const playlists = await fetchHighqualityPlaylists(category, 50);
    renderPlaylists(playlists);
}

// 初始化分类按钮
function initCategoryButtons() {
    const buttons = document.querySelectorAll('.category-btn');
    const categoryMap = {
        '推荐': '全部',
        '华语': '华语',
        '摇滚': '摇滚',
        '民谣': '民谣',
        '电子': '电子',
        '轻音乐': '轻音乐'
    };

    buttons.forEach(button => {
        button.addEventListener('click', () => {
            buttons.forEach(btn => btn.classList.remove('active'));
            button.classList.add('active');
            loadPlaylistsByCategory(categoryMap[button.textContent] || '全部');
        });
    });
}