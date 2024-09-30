import { notExist, exist, convertTimeStringToSeconds } from "./utils";

export class ConfigService {
  /**
   * Adds a listener for changes to the local storage, specifically designed for tracking changes in configuration settings.
   *
   * @param callback - The callback function to handle the updated configuration.
   */
  addListener(callback) {
    chrome.storage.local.onChanged.addListener((storageChanges) => {
      const currentConfig = Object.keys(storageChanges).reduce(
        (config, key) => ({
          ...config,
          [key]:
            storageChanges[key] === undefined
              ? storageChanges[key].oldValue
              : storageChanges[key].newValue
        }),
        {}
      );

      callback(this.getWithDefaults(currentConfig));
    });
  }

  /**
   * Updates a specific key-value pair in the local storage.
   *
   * @param key - The key of the configuration setting to be updated.
   * @param value - The new value for the specified configuration setting.
   * @returns A promise that resolves when the update operation is complete.
   */
  async update(key, value) {
    await chrome.storage.local.set({ [key]: value });
  }

  /**
   * Retrieves all configuration settings from local storage.
   *
   * @returns A promise that resolves with the complete configuration object.
   */
  async getAll() {
    //console.log("🚀 ~ ConfigService ~ getAll")
    const config = {};
    // const config = (await chrome.storage.local.get([
    // 	'autoplay',
    // 	'autoscroll',
    // 	'keepAwake',
    // 	// 'playFirst',
    // 	// 'playbackStep',
    // 	// 'showGuide',
    // ])) ;
    // console.log("🚀 ~ ConfigService ~ getAll ~ config:", config)

    return this.getWithDefaults(config);
  }

  /**
   * Applies default values and type conversions to the provided configuration object.
   *
   * @param config - The raw configuration object obtained from storage.
   * @returns The processed configuration object with defaults applied.
   * @private
   */
  getWithDefaults(config) {
    config = {
      ...config,
      autoplay: exist(config.autoplay) ? Boolean(config.autoplay) : true,
      autoscroll: exist(config.autoscroll) ? Boolean(config.autoscroll) : true,
      keepAwake: exist(config.keepAwake) ? Boolean(config.keepAwake) : true
      // playFirst(config.playFirst),
      // playbackStep(config.playbackStep)
    };

    if (isNaN(config.playbackStep)) {
      config.playbackStep = 10;
    }

    return config;
  }
}
