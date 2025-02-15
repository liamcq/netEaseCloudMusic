document.addEventListener('DOMContentLoaded', function () {
    const searchInput = document.getElementById('search-input');
    // 获取搜索容器，作为放置 overlay 的父容器
    const searchContainer = searchInput.parentElement;
    let overlay = document.getElementById('search-overlay');

    // 如果不存在 overlay，则创建一个
    if (!overlay) {
        overlay = document.createElement('div');
        overlay.id = 'search-overlay';
        overlay.className = 'search-overlay';
        searchContainer.appendChild(overlay);
    }
    
    // 点击搜索框时展开 overlay 并加载热搜数据
    searchInput.addEventListener('click', function (e) {
        e.stopPropagation(); 

        if (overlay.style.display === 'none' || overlay.style.display === '') {
            overlay.style.display = 'block';
            fetchHotSearch()
                .then(data => {
                    overlay.innerHTML = renderHotSearch(data);
                })
                .catch(error => {
                    console.error('获取热门推荐失败:', error);
                    overlay.innerHTML = '<p>获取热搜失败，请稍后重试。</p>';
                });
        }
    });

    // 监听输入框的输入事件：有内容时加载搜索建议，空时加载热搜
    searchInput.addEventListener('input', function (e) {
        const keywords = e.target.value.trim();
        if (keywords) {
            fetchSearchSuggest(keywords)
                .then(data => {
                    overlay.style.display = 'block';
                    overlay.innerHTML = renderSearchResults(data);
                })
                .catch(error => {
                    console.error('搜索失败:', error);
                    overlay.innerHTML = '<p>搜索失败，请稍后重试。</p>';
                });
        } else {
            fetchHotSearch()
                .then(data => {
                    overlay.style.display = 'block';
                    overlay.innerHTML = renderHotSearch(data);
                })
                .catch(error => {
                    console.error('获取热搜失败:', error);
                    overlay.innerHTML = '<p>获取热搜失败，请稍后重试。</p>';
                });
        }
    });

    // 点击其他区域时隐藏 overlay
    document.addEventListener('click', function () {
        if (overlay.style.display === 'block') {
            overlay.style.display = 'none';
        }
    });
});

//热搜列表
function fetchHotSearch() {
    return fetch('http://localhost:3000/search/hot')
        .then(response => response.json());
}

//搜索建议
function fetchSearchSuggest(keywords) {
    return fetch(`http://localhost:3000/search/suggest?keywords=${encodeURIComponent(keywords)}`)
        .then(response => response.json());
}

// 渲染热搜列表
function renderHotSearch(data) {
    if (!data || !data.result || !data.result.hots) {
        return '<p>暂无热搜数据。</p>';
    }
    const hots = data.result.hots;
    return `
        <div class="hot-search">
            <p class="hot-header">热搜榜</p>
            <ul>
                ${hots.map((item, index) => `
                    <li>
                        <span class="rank ${index < 3 ? 'top' : ''}">${index + 1}</span>
                        <span class="hot-text">${item.first}</span>
                    </li>
                `).join('')}
            </ul>
        </div>
    `;
}

// 渲染搜索建议结果
function renderSearchResults(data) {
    if (!data || !data.result) {
        return '<p>暂无搜索结果。</p>';
    }
    const { songs, artists, playlists } = data.result;
    return `
        <div class="search-results">
            ${songs ? `<p>单曲</p><ul>${songs.map(song => `<li>${song.name} - ${song.artists[0].name}</li>`).join('')}</ul>` : ''}
            ${artists ? `<p>歌手</p><ul>${artists.map(artist => `<li>${artist.name}</li>`).join('')}</ul>` : ''}
            ${playlists ? `<p>歌单</p><ul>${playlists.map(playlist => `<li>${playlist.name}</li>`).join('')}</ul>` : ''}
        </div>
    `;
}