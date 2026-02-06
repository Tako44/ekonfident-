document.addEventListener('DOMContentLoaded', function() {
  const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);

  const elements = {
    welcome: document.getElementById('welcome-screen'),
    avatar: document.getElementById('avatar-click'),
    profile: document.querySelector('.profile'),
    footer: document.querySelector('footer'),
    volume: {
      container: document.getElementById('volume-control'),
      slider: document.getElementById('volume-slider'),
      icon: document.getElementById('volume-icon'),
      wrapper: document.getElementById('volume-icon-wrapper')
    },
    musicIcon: document.getElementById('music-icon'),
    musicPlayerBar: document.querySelector('.music-player-bar'),
    songTitle: document.getElementById('song-title'),
    songTime: document.getElementById('song-time'),
    progressBar: document.getElementById('progress-bar'),
    progressSlider: document.getElementById('progress-slider')
  };

  const songs = [
    { id: 'lCKhHduVWI0', title: 'Skumaj - Polski SWAG', start: 11 },
    { id: 'efL_tjWS3bk', title: 'skid - 26 JERK FREESTYLE', start: 9 }, 
    { id: 'ZfUSoqxsR6Y', title: 'SHEDER - DALEKO DOM', start: 25 }
  ];

  let currentSongIndex = 0;
  let youtubePlayer;
  let isPlaying = false;
  let volumeControlVisible = false;
  let isMuted = false;
  let lastVolume = 1;
  let progressInterval;
  let isSeeking = false;

  function startApp() {
    if (elements.welcome) {
      elements.welcome.style.opacity = '0';
      setTimeout(() => {
        elements.welcome.style.display = 'none';
      }, 500);
    }
    
    elements.profile.style.display = 'block';
    elements.footer.style.display = 'block';
    if (elements.musicPlayerBar) {
      elements.musicPlayerBar.style.display = 'block';
    }
    
    if (!isMobile) {
      initYouTubePlayer();
      initVolumeControl();
    }
  }

  function initYouTubePlayer() {
    const tag = document.createElement('script');
    tag.src = "https://www.youtube.com/iframe_api";
    const firstScriptTag = document.getElementsByTagName('script')[0];
    firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);

    window.onYouTubeIframeAPIReady = function() {
      youtubePlayer = new YT.Player('youtube-background', {
        height: '100%',
        width: '100%',
        playerVars: {
          'autoplay': 1,
          'controls': 0,
          'disablekb': 1,
          'fs': 0,
          'loop': 1,
          'modestbranding': 1,
          'playsinline': 1,
          'rel': 0,
          'iv_load_policy': 3
        },
        events: {
          'onReady': onPlayerReady,
          'onStateChange': onPlayerStateChange,
          'onError': onPlayerError
        }
      });
    };
  }

  function onPlayerReady(event) {
    loadSong(currentSongIndex);
    updateSongInfo();
    
    event.target.playVideo().catch(error => {
      console.log("Autoplay prevented, showing interaction button");
      showPlayButton();
    });
    
    event.target.setVolume(100);
    updateVolumeIcon(1);
    
    setTimeout(() => {
      updateProgress();
      if (isPlaying) {
        startProgressUpdate();
      }
    }, 1000);
  }

  function onPlayerStateChange(event) {
    console.log("Player state changed:", event.data);
    
    if (event.data === YT.PlayerState.PLAYING) {
      isPlaying = true;
      startProgressUpdate();
    } else if (event.data === YT.PlayerState.PAUSED) {
      isPlaying = false;
      stopProgressUpdate();
    } else if (event.data === YT.PlayerState.ENDED) {
      isPlaying = false;
      stopProgressUpdate();
      setTimeout(() => {
        event.target.seekTo(songs[currentSongIndex].start);
        event.target.playVideo();
      }, 500);
    } else if (event.data === YT.PlayerState.BUFFERING) {
      console.log("Buffering...");
    } else if (event.data === YT.PlayerState.CUED) {
      console.log("Video cued");
    }
  }

  function onPlayerError(event) {
    console.log("Player error:", event.data);
  }

  function initVolumeControl() {
    if (isMobile || !elements.volume.container) return;
    
    elements.volume.container.style.display = 'flex';
    elements.volume.container.classList.add('visible');
    volumeControlVisible = true;
    
    elements.volume.wrapper.addEventListener('click', function(e) {
      e.stopPropagation();
      toggleMute();
    });
    
    elements.volume.slider.addEventListener('input', function() {
      const vol = parseFloat(this.value);
      if (youtubePlayer) {
        youtubePlayer.setVolume(vol * 100);
        lastVolume = vol;
        if (isMuted) {
          toggleMute(false);
        }
      }
      updateVolumeIcon(vol);
    });

    elements.musicIcon.addEventListener('click', function(e) {
      e.stopPropagation();
      changeSong();
      this.style.transform = 'scale(0.9)';
      setTimeout(() => {
        this.style.transform = 'scale(1)';
      }, 200);
    });
    
    if (elements.progressSlider) {
      elements.progressSlider.addEventListener('input', function() {
        isSeeking = true;
        if (youtubePlayer) {
          const duration = youtubePlayer.getDuration();
          if (duration && duration > 0) {
            const seekTo = (this.value / 100) * duration;
            const progressPercent = (seekTo / duration) * 100;
            elements.progressBar.style.width = progressPercent + '%';
            
            const currentTimeFormatted = formatTime(seekTo);
            const durationFormatted = formatTime(duration);
            elements.songTime.textContent = currentTimeFormatted + ' / ' + durationFormatted;
          }
        }
      });
      
      elements.progressSlider.addEventListener('change', function() {
        if (youtubePlayer) {
          const duration = youtubePlayer.getDuration();
          if (duration && duration > 0) {
            const seekTo = (this.value / 100) * duration;
            youtubePlayer.seekTo(seekTo, true);
          }
        }
        setTimeout(() => {
          isSeeking = false;
        }, 100);
      });
    }
  }

  function startProgressUpdate() {
    stopProgressUpdate();
    progressInterval = setInterval(updateProgress, 100);
  }

  function stopProgressUpdate() {
    if (progressInterval) {
      clearInterval(progressInterval);
      progressInterval = null;
    }
  }

  function updateProgress() {
    if (!youtubePlayer || !elements.progressBar || !elements.progressSlider || !elements.songTime || isSeeking) return;
    
    try {
      const currentTime = youtubePlayer.getCurrentTime();
      const duration = youtubePlayer.getDuration();
      
      if (duration && duration > 0 && !isNaN(currentTime)) {
        const progressPercent = (currentTime / duration) * 100;
        elements.progressBar.style.width = progressPercent + '%';
        elements.progressSlider.value = progressPercent;
        
        const currentTimeFormatted = formatTime(currentTime);
        const durationFormatted = formatTime(duration);
        elements.songTime.textContent = currentTimeFormatted + ' / ' + durationFormatted;
      }
    } catch (e) {
      console.log("Progress update error, retrying...");
    }
  }

  function formatTime(seconds) {
    if (isNaN(seconds) || seconds === Infinity) return "0:00";
    
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return mins + ':' + (secs < 10 ? '0' : '') + secs;
  }

  function updateSongInfo() {
    if (elements.songTitle && songs[currentSongIndex]) {
      elements.songTitle.textContent = songs[currentSongIndex].title;
    }
    
    if (elements.songTime) {
      elements.songTime.textContent = "0:00 / 0:00";
    }
    
    if (elements.progressBar) {
      elements.progressBar.style.width = '0%';
    }
    
    if (elements.progressSlider) {
      elements.progressSlider.value = 0;
    }
  }

  function toggleVolumeControl() {
    if (volumeControlVisible) {
      elements.volume.container.classList.remove('visible');
      setTimeout(() => {
        elements.volume.container.style.display = 'none';
      }, 400);
    } else {
      elements.volume.container.style.display = 'flex';
      setTimeout(() => {
        elements.volume.container.classList.add('visible');
      }, 10);
    }
    volumeControlVisible = !volumeControlVisible;
  }

  function toggleMute(updateIcon = true) {
    if (youtubePlayer) {
      if (isMuted) {
        youtubePlayer.unMute();
        youtubePlayer.setVolume(lastVolume * 100);
      } else {
        youtubePlayer.mute();
      }
      isMuted = !isMuted;
      
      if (updateIcon) {
        updateVolumeIcon(isMuted ? 0 : lastVolume);
      }
    }
  }

  function updateVolumeIcon(volume) {
    if (!elements.volume.icon) return;
    
    if (isMuted) {
      elements.volume.icon.src = 'icons/5.png';
    } else if (volume == 0) {
      elements.volume.icon.src = 'icons/4.png';
    } else if (volume < 0.33) {
      elements.volume.icon.src = 'icons/3.png';
    } else if (volume < 0.66) {
      elements.volume.icon.src = 'icons/2.png';
    } else {
      elements.volume.icon.src = 'icons/1.png';
    }
  }

  function changeSong() {
    currentSongIndex = (currentSongIndex + 1) % songs.length;
    loadSong(currentSongIndex);
    updateSongInfo();
    
    if (youtubePlayer) {
      setTimeout(() => {
        youtubePlayer.playVideo();
        isPlaying = true;
        startProgressUpdate();
      }, 500);
    }
  }

  function loadSong(index) {
    const song = songs[index];
    if (youtubePlayer && youtubePlayer.loadVideoById) {
      youtubePlayer.loadVideoById({
        videoId: song.id,
        startSeconds: song.start
      });
    }
  }

  function showPlayButton() {
    const playButton = document.createElement('div');
    playButton.id = 'play-button-overlay';
    playButton.innerHTML = '<button id="play-button">Kliknij aby odtworzyć</button>';
    document.body.appendChild(playButton);
    
    document.getElementById('play-button').addEventListener('click', function() {
      if (youtubePlayer) {
        youtubePlayer.playVideo();
        isPlaying = true;
        startProgressUpdate();
      }
      playButton.remove();
    });
  }

  function init() {
    if (isMobile) {
      if (elements.welcome) elements.welcome.style.display = 'none';
      elements.profile.style.display = 'block';
      elements.footer.style.display = 'block';
      if (elements.musicPlayerBar) {
        elements.musicPlayerBar.style.display = 'block';
      }
    } else {
      if (elements.welcome) elements.welcome.style.display = 'flex';
      document.addEventListener('keydown', function(e) {
        if (e.key === 'Enter') startApp();
      });
    }
  }

  init();
});