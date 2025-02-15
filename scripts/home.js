const bannerModule = (() => {
  let currentIndex = 0;
  let intervalId = null;
  const intervalDuration = 2000; 
  let banners = [];
  const sourceElement = null; 

  // 获取 banner 数据
  const fetchBannerData = async () => {
    try {
      const res = await fetch('http://localhost:3000/banner');
      return await res.json();
    } catch (error) {
      console.error('Banner fetch failed:', error);
      return { banners: [] };
    }
  };

  // 创建 banner 项
  const createBannerItem = (banner, index) => {
    const item = document.createElement('div');
    item.className = `banner-item ${index === 0 ? 'active' : ''}`;
    item.innerHTML = `<img src="${banner.imageUrl}" alt="${banner.typeTitle}">`;
    return item;
  };

  // 创建指示器
  const createIndicators = (count) => {
    const container = document.createElement('div');
    container.className = 'banner-indicators';
    container.innerHTML = Array.from({ length: count }, (_, i) => 
      `<div class="banner-indicator ${i === 0 ? 'active' : ''}" data-index="${i}"></div>`
    ).join('');
    return container;
  };

  // 渲染 banner
  const render = (bannersData) => {
    banners = bannersData;
    const container = document.querySelector('.banner-container');
    if (!container || !banners.length) return;

    container.innerHTML = '';
    banners.forEach((banner, index) => {
      container.appendChild(createBannerItem(banner, index));
    });

    // 添加控制按钮
    const prevBtn = document.createElement('button');
    prevBtn.className = 'banner-control prev';
    prevBtn.textContent = '❮';
    prevBtn.addEventListener('click', () => {
      prev();
      resetAutoPlay();
    });

    const nextBtn = document.createElement('button');
    nextBtn.className = 'banner-control next';
    nextBtn.textContent = '❯';
    nextBtn.addEventListener('click', () => {
      next();
      resetAutoPlay();
    });

    container.appendChild(prevBtn);
    container.appendChild(nextBtn);

    const indicators = createIndicators(banners.length);
    indicators.querySelectorAll('.banner-indicator').forEach((indicator, i) => {
      indicator.addEventListener('click', () => {
        switchTo(i);
        resetAutoPlay();
      });
    });
    container.appendChild(indicators);

    
    switchTo(0);
  };

  // 切换到指定索引
  const switchTo = (index) => {
    currentIndex = (index + banners.length) % banners.length;
    const items = document.querySelectorAll('.banner-item');
    const indicators = document.querySelectorAll('.banner-indicator');
    items.forEach((item, i) => item.classList.toggle('active', i === currentIndex));
    indicators.forEach((ind, i) => ind.classList.toggle('active', i === currentIndex));
  };

  // 切换到下一张
  const next = () => switchTo(currentIndex + 1);

  // 切换到上一张
  const prev = () => switchTo(currentIndex - 1);

  // 启动自动播放
  const startAutoPlay = () => {
    if (intervalId) clearInterval(intervalId);
    intervalId = setInterval(next, intervalDuration);
  };

  // 停止自动播放
  const stopAutoPlay = () => {
    if (intervalId) {
      clearInterval(intervalId);
      intervalId = null;
    }
  };

  // 重置自动播放
  const resetAutoPlay = () => {
    stopAutoPlay();
    startAutoPlay();
  };

  // 初始化
  const init = async () => {
    const { banners } = await fetchBannerData();
    if (!banners.length) return;

    render(banners);
    const container = document.querySelector('.banner-container');
    if (container) {
      container.addEventListener('mouseenter', stopAutoPlay);
      container.addEventListener('mouseleave', startAutoPlay);
    }
    startAutoPlay();
  };

  return {
    init,
    destroy: stopAutoPlay,
  };
})();

// 推荐歌单模块
const playlistModule = (() => {
  const formatCount = (count) => 
    count > 10000 ? `${(count / 10000).toFixed(1)}万` : count;

  const fetchPlaylists = async (limit = 10) => {
    try {
      const res = await fetch(`http://localhost:3000/top/playlist/highquality?limit=${limit}`);
      const data = await res.json();
      return data.playlists || [];
    } catch (error) {
      console.error('Playlist fetch failed:', error);
      return [];
    }
  };

  const createPlaylistCard = (playlist) => {
    const card = document.createElement('div');
    card.className = 'recommend-item';
    card.innerHTML = `
      <div class="cover-container">
        <img src="${playlist.coverImgUrl}" alt="${playlist.name}">
      </div>
      <div class="play-count">${formatCount(playlist.playCount)}</div>
      <div class="info-wrapper">
        <p class="item-title">
          <a href="#playlist/${playlist.id}" class="playlist-link">${playlist.name}</a>
        </p>
        <p class="item-artist">${playlist.creator.nickname}</p>
      </div>
    `;
    return card;
  };

  const render = (playlists) => {
    const grid = document.querySelector('.recommend-grid');
    if (!grid) return;
    grid.innerHTML = '';
    playlists.forEach(playlist => grid.appendChild(createPlaylistCard(playlist)));
  };

  return {
    async init(limit = 10) {
      const playlists = await fetchPlaylists(limit);
      render(playlists);
    }
  };
})();

// 页面控制器
const pageController = (() => {
  const recommendPageHTML = `
    <div class="banner-section">
      <div class="banner-wrapper">
        <div class="banner-container"></div>
      </div>
    </div>
    <div class="recommend-section">
      <p class="section-title">精选推荐</p>
      <div class="recommend-grid"></div>
    </div>
  `;

  return {
    loadRecommendPage() {
      const mainContent = document.getElementById('main-content');
      if (!mainContent) return;

      // 清理旧内容
      bannerModule.destroy();
      mainContent.innerHTML = recommendPageHTML;

      // 初始化新内容
      bannerModule.init();
      playlistModule.init();
    }
  };
})();

// 事件绑定
document.addEventListener('DOMContentLoaded', () => {
  pageController.loadRecommendPage();
});

document.addEventListener('click', (e) => {
  if (e.target.closest('#recommend-link')) {
    e.preventDefault();
    pageController.loadRecommendPage();
  }
});