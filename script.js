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
    musicIcon: document.getElementById('music-icon')
  };

  const songs = [
    { id: 'vLd0icBPnfU', title: 'SENTINO x TRUEMAN - SCAM', start: 10 },
    { id: 'zqJb5YZ_fuY', title: 'Sentino - LOEWE', start: 10 },
    { id: 'MzWibQ1MP40', title: 'olszakumpel - BENZ ft. arbuzkumpel, ZetHa (prod. adimajer&ohPaul)', start: 11 },
    { id: 'B0B_mQZfeiY', title: 'Sentino - Casablanca (prod. Crackhouse)', start: 9 },
    { id: 'jTtrwPzEm7g', title: 'Bajorson, Dawid Obserwator, DJ Killer, David Tango - Bailando', start: 22 },
    { id: 'sUatJmyK8U0', title: 'Gryzzly - JAK NIKT', start: 11 },
    { id: 'q_NE6N2H6P4', title: 'Piwko nie mozna', start: 17 },
    { id: 'HyPEhaWVYis', title: 'Peja - Frajerhejt 9.12/DTKJ (Dlaczego Tede Kurwą Jest)', start: 191 }
  ];

  let currentSongIndex = 0;
  let youtubePlayer;
  let isPlaying = false;
  let volumeControlVisible = false;
  let isMuted = false;
  let lastVolume = 1;

  function startApp() {
    if (elements.welcome) {
      elements.welcome.style.opacity = '0';
      setTimeout(() => {
        elements.welcome.style.display = 'none';
      }, 500);
    }
    
    elements.profile.style.display = 'block';
    elements.footer.style.display = 'block';
    
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
          'onStateChange': onPlayerStateChange
        }
      });
    };
  }

  function onPlayerReady(event) {
    loadSong(currentSongIndex);
    event.target.playVideo().catch(error => {
      console.log("Autoplay prevented, showing interaction button");
      showPlayButton();
    });
    event.target.setVolume(100);
    updateVolumeIcon(1);
  }

  function onPlayerStateChange(event) {
    if (event.data === YT.PlayerState.PLAYING) {
      isPlaying = true;
    } else if (event.data === YT.PlayerState.ENDED) {
      event.target.seekTo(songs[currentSongIndex].start);
      event.target.playVideo();
    }
  }

  function initVolumeControl() {
    if (isMobile || !elements.volume.container) return;
    
    // Ukryj suwak na początku
    elements.volume.container.style.display = 'none';
    
    // Kliknięcie ikony głośności - mute/unmute
    elements.volume.wrapper.addEventListener('click', function(e) {
      e.stopPropagation();
      toggleMute();
    });
    
    // Kliknięcie avatara - pokaż/ukryj kontrolki
    elements.avatar.addEventListener('click', function() {
      toggleVolumeControl();
    });
    
    // Obsługa suwaka głośności
    elements.volume.slider.addEventListener('input', function() {
      const vol = parseFloat(this.value);
      if (youtubePlayer) {
        youtubePlayer.setVolume(vol * 100);
        lastVolume = vol;
        if (isMuted) {
          toggleMute(false); // Automatycznie wyłącz mute przy regulacji
        }
      }
      updateVolumeIcon(vol);
    });

    // Kliknięcie ikony zmiany utworu
    elements.musicIcon.addEventListener('click', function(e) {
      e.stopPropagation();
      changeSong();
      this.style.transform = 'scale(0.9)';
      setTimeout(() => {
        this.style.transform = 'scale(1)';
      }, 200);
    });
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
    if (!isPlaying && youtubePlayer) {
      youtubePlayer.playVideo();
      isPlaying = true;
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
      youtubePlayer.playVideo();
      playButton.remove();
    });
  }

  function init() {
    if (isMobile) {
      if (elements.welcome) elements.welcome.style.display = 'none';
      elements.profile.style.display = 'block';
      elements.footer.style.display = 'block';
    } else {
      if (elements.welcome) elements.welcome.style.display = 'flex';
      document.addEventListener('keydown', function(e) {
        if (e.key === 'Enter') startApp();
      });
    }
  }

  init();
});