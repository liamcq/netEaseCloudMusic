document.addEventListener('click', async (e) => {
  const target = e.target;
  if (target.tagName.toLowerCase() === 'a' && target.getAttribute('href').startsWith('#playlist/')) {
    e.preventDefault();
    const parts = target.getAttribute('href').split('/');
    const playlistId = parts[1]; // 获取歌单 ID

    
    const mainContent = document.getElementById('main-content');
    if (!mainContent) return;
    
    // 从本地文件中获取播放详情页面模板
    try {
      const tplResponse = await fetch('html/playlist-detail.html');
      const tplHtml = await tplResponse.text();
      mainContent.innerHTML = tplHtml; 
    } catch (err) {
      console.error('加载播放详情模板失败：', err);
      return;
    }
    
    // 并发请求歌单详情和完整歌曲列表
    try {
      const [detailRes, tracksRes] = await Promise.all([
        fetch(`http://localhost:3000/playlist/detail?id=${playlistId}`),
        fetch(`http://localhost:3000/playlist/track/all?id=${playlistId}`)
      ]);
      
      const detailData = await detailRes.json();
      const tracksData = await tracksRes.json();
      const playlist = detailData.playlist;
      
      // 更新页面
      const mainContent = document.getElementById('main-content');
      mainContent.innerHTML = `
        <div class="playlist-detail-container">
          <h2 class="page-title">歌单详情</h2>
          <div class="playlist-detail">
            <div class="playlist-cover">
              <img src="${playlist.coverImgUrl}" alt="${playlist.name}">
            </div>
            <div class="playlist-info">
              <h2 class="playlist-title">${playlist.name}</h2>
              <p class="playlist-description">${playlist.description || ''}</p>
              <p class="playlist-author">${playlist.creator.nickname}</p>
            </div>
          </div>
          <div class="playlist-songs"></div>
        </div>
      `;
      
      // 渲染歌曲列表
      renderSongList(tracksData.songs || []);
      
    } catch (err) {
      console.error('获取歌单详情失败：', err);
    }
  }
});

// 格式化时长（毫秒转 mm:ss 格式）
function formatDuration(duration) {
  const minutes = Math.floor(duration / 60000);
  const seconds = Math.floor((duration % 60000) / 1000);
  return `${minutes}:${seconds.toString().padStart(2, '0')}`;
}

function renderSongList(songs) {
    const songsContainer = document.querySelector('.playlist-songs');
    songsContainer.innerHTML = `
        <div class="songs-header">
            <div class="song-play"></div>
            <div class="song-index">#</div>
            <div class="song-title">标题</div>
            <div class="song-artist">歌手</div>
            <div class="song-duration">时长</div>
        </div>
        ${songs.map((song, index) => `
            <div class="playlist-song-item">
                <div class="song-play">
                    <button class="play-button" data-song-id="${song.id}">
                        <img src="/img/playicon.png" alt="播放">
                    </button>
                </div>
                <div class="song-index">${index + 1}</div>
                <div class="song-title">${song.name}</div>
                <div class="song-artist">${song.ar ? song.ar.map(a => a.name).join(', ') : ''}</div>
                <div class="song-duration">${formatDuration(song.dt)}</div>
            </div>
        `).join('')}
    `;

    // 为播放按钮添加点击事件
    document.querySelectorAll('.play-button').forEach(button => {
        button.addEventListener('click', (e) => {
            const songId = e.currentTarget.dataset.songId;
            // 直接调用播放函数
            playSong(songId);
        });
    });
}

//更新UI
function updatePlayerUI(songInfo) {
    const coverElement = document.querySelector('.current-cover');
    const titleElement = document.querySelector('.current-song-title');
    const artistElement = document.querySelector('.current-song-artist');

    // 获取歌曲封面地址
    const coverUrl = songInfo.al && songInfo.al.picUrl ? songInfo.al.picUrl : (songInfo.cover || '');

    if (coverElement) {
        coverElement.src = coverUrl;
    }
    if (titleElement) {
        titleElement.textContent = songInfo.name || '未播放';
    }
    if (artistElement) {
        artistElement.textContent = songInfo.ar ? songInfo.ar.map(artist => artist.name).join(', ') : '未知歌手';
    }
}


// 播放歌曲
async function playSong(songId) {
    try {
        // 获取音乐 URL
        const response = await fetch(`http://localhost:3000/song/url/v1?id=${songId}&level=standard`);
        const data = await response.json();
        
        if (data.data && data.data[0] && data.data[0].url) {
            // 获取歌曲详情
            const detailRes = await fetch(`http://localhost:3000/song/detail?ids=${songId}`);
            const detailData = await detailRes.json();
            const songInfo = detailData.songs[0];

            // 设置音频源并播放
            const audio = document.createElement('audio');
            audio.src = data.data[0].url;
            audio.play();
            
            // 更新播放器底部显示
            updatePlayerUI(songInfo);
        }
    } catch (error) {
        console.error('播放失败:', error);
    }
}
