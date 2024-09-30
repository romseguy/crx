import { ConfigService } from "./ConfigService";
import { messageService, MessageCode } from "./MessageService";
import { notExist, exist, convertTimeStringToSeconds } from "./utils";

class BasePageService {
  config;
  tracks = [];

  constructor() {}

  isServiceUrl(url) {
    return false;
  }

  playPause() {
    this.audioOperator((audio) => {
      if (audio.paused) {
        audio.play();
      } else {
        audio.pause();
      }
    });
  }

  setPlayback(percentage) {
    this.audioOperator((audio) => {
      audio.currentTime = (percentage / 100) * audio.duration;
    });
  }

  movePlayback(forward) {
    this.audioOperator((audio) => {
      let nextPositionInSeconds =
        audio.currentTime +
        (forward ? this.config.playbackStep : -this.config.playbackStep);
      if (nextPositionInSeconds < 0) {
        nextPositionInSeconds = 0;
      } else if (nextPositionInSeconds > audio.duration) {
        nextPositionInSeconds = audio.duration;
      }

      const percentage = (nextPositionInSeconds / audio.duration) * 100;
      this.setPlayback(percentage);
    });
  }

  speedPlayback(code) {
    this.audioOperator((audio) => {
      if (code === PlaybackSpeedAction.Reset) {
        audio.playbackRate = 1;
      } else if (code === PlaybackSpeedAction.Increase) {
        audio.playbackRate += 0.01;
      } else if (code === PlaybackSpeedAction.Decrease) {
        audio.playbackRate -= 0.01;
      }
    });
  }

  switchPreservesPitch(code) {
    this.audioOperator((audio) => {
      audio.preservesPitch =
        code === PlaybackPitchAction.Switch ? !audio.preservesPitch : false;
    });
  }

  getTrackIndex(trackId) {
    return this.tracks.findIndex(({ id }) => id === trackId);
  }

  audioOperator(operator, notFoundHandler) {
    const audio = document.querySelector("audio");
    if (notExist(audio?.src)) {
      return exist(notFoundHandler) ? notFoundHandler() : undefined;
    }

    return operator(audio);
  }
}

class DiscoverPageService extends BasePageService {
  isServiceUrl(url) {
    return url.includes("/discover");
  }

  playPause() {
    const button = document.querySelector(
      ".player-top > button.play-pause-button"
    );
    button?.click();
  }

  playNextTrack(next) {
    const current = document
      .querySelector('[aria-label="Pause"]')
      .parentElement.parentElement.parentElement.getAttribute("data-test");
    if (notExist(current)) {
      return;
    }

    const nowPlayingIndex = this.tracks.findIndex((x) => x.id === current);
    if (nowPlayingIndex === -1 || nowPlayingIndex >= this.tracks.length) {
      return;
    }

    if (nowPlayingIndex === 0 && !next) {
      return;
    }

    const nextTrackPlayButton =
      this.tracks[nowPlayingIndex + (next ? 1 : -1)].element.querySelector(
        ".play-pause-button"
      );
    nextTrackPlayButton.click();

    //if (this.config.autoscroll) {
    nextTrackPlayButton.scrollIntoView({
      block: "center",
      behavior: "smooth"
    });
    //}
  }

  playTrackByIndex(index) {
    if (index >= 0 && index < this.tracks.length) {
      this.tracks[index].element.querySelector(".play-pause-button").click();
    }
  }

  initTracks() {
    const list = document.querySelectorAll(".results-grid-item");
    if (notExist(list) || list.length === this.tracks.length) {
      return;
    }

    this.tracks = Array.from(list).map((x) => ({
      id: x.getAttribute("data-test"),
      element: x
    }));
  }

  tryAutoplay() {
    const progress = this.getPlayingTrackProgress();
    //console.log("🚀 ~ DiscoverPageService ~ tryAutoplay ~ progress :",progress)

    if (exist(progress) && progress >= 99.5) {
      this.playNextTrack(true);
    }
  }

  open() {
    console.log("🚀 ~ DiscoverPageService ~ open");
    const itemUrl = document.querySelector(".buy-button")?.href;
    //this.createNewTab(itemUrl);
    messageService.sendToBackground({
      code: MessageCode.CreateNewTab,
      data: itemUrl
    });
  }

  addToWishlist() {
    document.querySelector(".wishlist-button")?.click();
  }

  switchPreservesPitch(_) {
    return;
  }

  getPlayingTrackProgress() {
    // Retrieve the time strings
    const positionStr = document.querySelector(
      ".playback-time.current"
    )?.textContent;
    const durationStr = document.querySelector(
      ".playback-time.total"
    )?.textContent;

    // Convert time strings to seconds
    const positionInSeconds = convertTimeStringToSeconds(positionStr);
    const durationInSeconds = convertTimeStringToSeconds(durationStr);

    return (positionInSeconds / durationInSeconds) * 100;
  }
}

class PageServiceWorker {
  autoplayDelay = 300;
  initTracksDelay = 700;

  configService = new ConfigService();

  pageServices = [new DiscoverPageService()];

  pageService = null;

  start() {
    console.log("[Start]: Band Play");

    this.startAsync().catch((error) => {
      console.error(error);
    });
  }

  async startAsync() {
    this.pageService = await this.currentService();

    this.serviceConfiguration();

    this.registerAutoplay();
    this.registerTracksInitialization();
  }

  async currentService() {
    const url = window.location.href;

    const service = this.pageServices.find((x) => x.isServiceUrl(url));
    if (exist(service)) {
      service.tracks = [];
      service.config = await this.configService.getAll();
    }

    return service;
  }

  serviceConfiguration() {
    this.configService.addListener((newConfig) => {
      if (exist(this.pageService)) {
        this.pageService.config = newConfig;
      }
    });
  }

  registerAutoplay() {
    setInterval(() => {
      if (notExist(this.pageService) || !this.pageService.config.autoplay) {
        return;
      }

      try {
        this.pageService.tryAutoplay();
      } catch (error) {
        console.error(error);
      }
    }, this.autoplayDelay);
  }

  registerTracksInitialization() {
    this.pageService?.initTracks();
    setInterval(() => {
      try {
        this.pageService?.initTracks();
      } catch (error) {
        console.error(error);
      }
    }, this.initTracksDelay);
  }
}
export const serviceWorker = new PageServiceWorker();
serviceWorker.start();

messageService.addListener(
  async (message) => {
    console.log("🚀 ~ message:", message);

    if (message.code === MessageCode.UrlChanged) {
      serviceWorker.pageService = await serviceWorker.currentService();
      serviceWorker.pageService?.initTracks();
    } else if (message.code === MessageCode.NextTrack) {
      serviceWorker.pageServices[0].playNextTrack(true);
    }
  },
  (error) => console.error(error)
);

const KeyCode = {
  ArrowDown: "ArrowDown",
  ArrowLeft: "ArrowLeft",
  ArrowRight: "ArrowRight",
  ArrowUp: "ArrowUp",
  Digit: "Digit",
  KeyB: "KeyB",
  KeyL: "KeyL",
  KeyN: "KeyN",
  KeyO: "KeyO",
  KeyP: "KeyP",
  Space: "Space"
};
class UserInputService {
  hotKeyHandlers = {
    [KeyCode.ArrowUp]: (service) =>
      service.speedPlayback(PlaybackSpeedAction.Increase),
    [KeyCode.ArrowDown]: (service) =>
      service.speedPlayback(PlaybackSpeedAction.Decrease),
    [KeyCode.ArrowLeft]: (service) => service.movePlayback(false),
    [KeyCode.ArrowRight]: (service) => service.movePlayback(true),
    [KeyCode.Digit]: (service, event) =>
      service.setPlayback(parseDigitCode(event) * 10),
    [KeyCode.KeyB]: (service) => service.playNextTrack(false),
    [KeyCode.KeyL]: (service) => service.addToWishlist(),
    [KeyCode.KeyN]: (service) => service.playNextTrack(true),
    [KeyCode.KeyO]: (service) => service.open(),
    [KeyCode.KeyP]: (service) =>
      service.switchPreservesPitch(PlaybackPitchAction.Switch),
    [KeyCode.Space]: (service) => service.playPause()
  };

  shiftHotKeyHandlers = {
    [KeyCode.ArrowUp]: (service) =>
      service.speedPlayback(PlaybackSpeedAction.Reset),
    [KeyCode.ArrowDown]: (service) =>
      service.speedPlayback(PlaybackSpeedAction.Reset),
    [KeyCode.Digit]: (service, event) =>
      service.playTrackByIndex(parseDigitCode(event) - 1),
    [KeyCode.KeyP]: (service) =>
      service.switchPreservesPitch(PlaybackPitchAction.Reset)
  };

  constructor() {}

  start(serviceWorkerWorker) {
    this.listenHotkeys(serviceWorker);
    this.listenNavigator(serviceWorker);
  }

  listenHotkeys(serviceWorkerWorker) {
    document.addEventListener(
      "keydown",
      (event) => {
        if (notExist(serviceWorker.pageService)) {
          return true;
        }

        const targetName = event.target?.localName;
        if (
          ["input", "textarea"].includes(targetName) ||
          event.ctrlKey ||
          event.metaKey
        ) {
          return true;
        }

        const key = event.code.startsWith(KeyCode.Digit)
          ? KeyCode.Digit
          : event.code;

        const hotKeyHandled = event.shiftKey
          ? this.shiftHotKeyHandlers[key]
          : this.hotKeyHandlers[key];

        if (exist(hotKeyHandled)) {
          event.preventDefault();
          hotKeyHandled(serviceWorker.pageService, event);
        }

        return true;
      },
      false
    );
  }

  listenNavigator(serviceWorkerWorker) {
    navigator.mediaSession.setActionHandler("play", () => {
      serviceWorker.pageService.playPause();
    });

    navigator.mediaSession.setActionHandler("pause", () => {
      serviceWorker.pageService.playPause();
    });

    navigator.mediaSession.setActionHandler("nexttrack", () => {
      serviceWorker.pageService.playNextTrack(true);
    });

    navigator.mediaSession.setActionHandler("previoustrack", () => {
      serviceWorker.pageService.playNextTrack(false);
    });
  }
}
const userInputService = new UserInputService();
userInputService.start(serviceWorker);

// import depSample from './dependency-sample';
// console.info(' anything here!! It will hot-reload the extension )');
// console.log(depSample());
