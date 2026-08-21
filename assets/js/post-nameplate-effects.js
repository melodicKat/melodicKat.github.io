(() => {
  const script = document.querySelector('[data-post-nameplate-effects]');
  const postPreviews = Array.from(document.querySelectorAll('#post-list .post-preview'));

  if (!script || postPreviews.length === 0) {
    return;
  }

  const fadeDuration = 750;
  const fadeLeadDuration = 750;
  const cycleRestDuration = 250;
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const effects = new Map([
    [
      'falling-stars',
      {
        key: 'falling-stars',
        label: 'Falling Stars',
        source: script.dataset.fallingStarsSrc,
        duration: 4999
      }
    ],
    [
      'pandoran-seas-ilu',
      {
        key: 'pandoran-seas-ilu',
        label: 'Pandoran Seas (Ilu)',
        source: script.dataset.pandoranSeasIluSrc,
        duration: 4250
      }
    ],
    [
      'pandoran-seas-squid',
      {
        key: 'pandoran-seas-squid',
        label: 'Pandoran Seas (Squid)',
        source: script.dataset.pandoranSeasSquidSrc,
        duration: 4999
      }
    ],
    [
      'nevermore-black',
      {
        key: 'nevermore-black',
        label: 'Nevermore (Black)',
        source: script.dataset.nevermoreBlackSrc,
        duration: 3250
      }
    ],
    [
      'dark-roses-black',
      {
        key: 'dark-roses-black',
        label: 'Dark Roses (Black)',
        source: script.dataset.darkRosesBlackSrc,
        duration: 3250
      }
    ],
    [
      'dark-roses-white',
      {
        key: 'dark-roses-white',
        label: 'Dark Roses (White)',
        source: script.dataset.darkRosesWhiteSrc,
        duration: 3250
      }
    ]
  ]);
  const profileNameplates = new Map([
    ['falling-stars', [{ key: 'falling-stars', weight: 1 }]],
    [
      'first-breath',
      [
        { key: 'pandoran-seas-ilu', weight: 1 },
        { key: 'pandoran-seas-squid', weight: 1 }
      ]
    ],
    [
      'nevermore-midnight',
      [
        { key: 'nevermore-black', weight: 0.6 },
        { key: 'dark-roses-black', weight: 0.2 },
        { key: 'dark-roses-white', weight: 0.2 }
      ]
    ]
  ]);

  if (Array.from(effects.values()).some((effect) => !effect.source)) {
    return;
  }

  const layers = postPreviews.map((preview) => {
    const layer = document.createElement('span');
    const video = document.createElement('video');

    layer.className = 'post-nameplate-effect';
    layer.setAttribute('aria-hidden', 'true');

    video.className = 'post-nameplate-effect__video';
    video.muted = true;
    video.defaultMuted = true;
    video.playsInline = true;
    video.preload = 'auto';
    video.disablePictureInPicture = true;
    video.tabIndex = -1;

    layer.append(video);
    preview.prepend(layer);

    return { layer, preview, video };
  });

  let generation = 0;
  let activeRun = null;

  const wait = (duration) =>
    new Promise((resolve) => {
      window.setTimeout(resolve, duration);
    });

  const waitForPaint = () =>
    new Promise((resolve) => {
      window.requestAnimationFrame(() => window.requestAnimationFrame(resolve));
    });

  const loadVideo = (video, source) =>
    new Promise((resolve) => {
      const absoluteSource = new URL(source, document.baseURI).href;

      if (video.dataset.nameplateSource === absoluteSource && video.readyState >= 2) {
        resolve();
        return;
      }

      let timeout;

      const finish = () => {
        window.clearTimeout(timeout);
        video.removeEventListener('loadeddata', finish);
        video.removeEventListener('error', finish);
        resolve();
      };

      video.addEventListener('loadeddata', finish, { once: true });
      video.addEventListener('error', finish, { once: true });
      video.dataset.nameplateSource = absoluteSource;
      video.src = source;
      video.load();
      timeout = window.setTimeout(finish, 2500);
    });

  const waitForCycle = (video, duration) =>
    new Promise((resolve) => {
      let timeout;

      const finish = () => {
        window.clearTimeout(timeout);
        video.removeEventListener('ended', finish);
        resolve();
      };

      video.addEventListener('ended', finish, { once: true });
      timeout = window.setTimeout(finish, duration + 750);
    });

  const pickEffect = (profileKey) => {
    const candidates = profileNameplates.get(profileKey);

    if (!candidates) {
      return null;
    }

    if (candidates.length === 1) {
      return effects.get(candidates[0].key);
    }

    const totalWeight = candidates.reduce((total, candidate) => total + candidate.weight, 0);
    const roll = Math.random() * totalWeight;
    let boundary = 0;

    for (const candidate of candidates) {
      boundary += candidate.weight;

      if (roll < boundary) {
        return effects.get(candidate.key);
      }
    }

    return effects.get(candidates[candidates.length - 1].key);
  };

  const setEffect = (profileKey, effect) => {
    document.documentElement.dataset.nameplateEffect = effect.key;
    document.documentElement.dataset.nameplateProfileEffect = profileKey;

    layers.forEach(({ layer, preview }) => {
      layer.dataset.nameplate = effect.key;
      layer.dataset.nameplateLabel = effect.label;
      preview.dataset.nameplateEffect = effect.key;
      preview.dataset.profileEffect = profileKey;
    });
  };

  const hideAndPause = () => {
    layers.forEach(({ layer, video }) => {
      layer.classList.remove('is-visible', 'is-static', 'is-profile-start');
      video.pause();
    });
  };

  const prepareEffect = async (profileKey, effect) => {
    setEffect(profileKey, effect);
    await Promise.all(layers.map(({ video }) => loadVideo(video, effect.source)));

    layers.forEach(({ video }) => {
      video.currentTime = 0;
    });
  };

  const createRun = (profileKey, effect) => {
    let resolveCompletion;
    const completion = new Promise((resolve) => {
      resolveCompletion = resolve;
    });

    return {
      generation,
      profileKey,
      effect,
      completion,
      resolveCompletion,
      completed: false,
      stopRequested: false,
      cycleStartedAt: null,
      fadeStartedAt: null,
      fadeTimer: null,
      finishingPromise: null,
      betweenCycles: false,
      firstCycle: true,
      staticFallback: false
    };
  };

  const completeRun = (run) => {
    if (run.completed) {
      return;
    }

    run.completed = true;
    run.resolveCompletion();
  };

  const startFade = (run) => {
    if (run.fadeStartedAt !== null) {
      return;
    }

    window.clearTimeout(run.fadeTimer);
    run.fadeTimer = null;
    run.fadeStartedAt = performance.now();
    layers.forEach(({ layer }) => layer.classList.remove('is-visible'));
  };

  const scheduleCycleFade = (run) => {
    if (run.fadeStartedAt !== null || run.cycleStartedAt === null) {
      return;
    }

    window.clearTimeout(run.fadeTimer);
    const elapsed = Math.max(0, performance.now() - run.cycleStartedAt);
    const remaining = Math.max(0, run.effect.duration - elapsed);
    const delay = Math.max(0, remaining - fadeLeadDuration);

    if (delay === 0) {
      startFade(run);
      return;
    }

    run.fadeTimer = window.setTimeout(() => startFade(run), delay);
  };

  const finishRun = (run) => {
    if (run.finishingPromise) {
      return run.finishingPromise;
    }

    run.finishingPromise = (async () => {
      startFade(run);
      const fadeElapsed = Math.max(0, performance.now() - run.fadeStartedAt);
      await wait(Math.max(0, fadeDuration - fadeElapsed));
      layers.forEach(({ video }) => video.pause());
      completeRun(run);
    })();

    return run.finishingPromise;
  };

  const requestStop = (run) => {
    run.stopRequested = true;

    if (run.staticFallback) {
      void finishRun(run);
    } else if (run.betweenCycles) {
      void finishRun(run);
    } else {
      scheduleCycleFade(run);
    }

    return run.completion;
  };

  const playSyncedEffect = async (run) => {
    await prepareEffect(run.profileKey, run.effect);

    if (run.generation !== generation) {
      completeRun(run);
      return;
    }

    await waitForPaint();

    while (run.generation === generation && document.documentElement.contains(postPreviews[0])) {
      run.betweenCycles = false;
      run.fadeStartedAt = null;
      layers.forEach(({ layer }) => {
        layer.classList.toggle('is-profile-start', run.firstCycle);
        layer.classList.add('is-visible');
      });
      run.firstCycle = false;

      layers.forEach(({ video }) => {
        video.currentTime = 0;
      });

      const cycleComplete = waitForCycle(layers[0].video, run.effect.duration);
      run.cycleStartedAt = performance.now();
      await Promise.allSettled(layers.map(({ video }) => video.play()));
      scheduleCycleFade(run);

      await cycleComplete;
      window.clearTimeout(run.fadeTimer);
      run.fadeTimer = null;

      if (run.generation !== generation) {
        completeRun(run);
        return;
      }

      if (run.stopRequested) {
        await finishRun(run);
        return;
      }

      run.betweenCycles = true;
      await wait(cycleRestDuration);
      run.betweenCycles = false;

      if (run.stopRequested) {
        await finishRun(run);
        return;
      }

      // The next cycle fades back in after a short fully-hidden interval.
    }

    completeRun(run);
  };

  const syncToProfileEffect = (profileKey) => {
    const effect = pickEffect(profileKey);

    if (!effect) {
      return;
    }

    generation += 1;

    if (activeRun && !activeRun.completed) {
      hideAndPause();
      completeRun(activeRun);
    }

    const run = createRun(profileKey, effect);
    activeRun = run;

    if (reducedMotion) {
      setEffect(profileKey, effect);
      run.staticFallback = true;
      layers.forEach(({ layer }) => layer.classList.add('is-static', 'is-visible'));
      return;
    }

    void playSyncedEffect(run).catch(() => {
      if (run.generation !== generation) {
        completeRun(run);
        return;
      }

      setEffect(profileKey, effect);
      run.staticFallback = true;
      layers.forEach(({ layer }) => layer.classList.add('is-static', 'is-visible'));

      if (run.stopRequested) {
        void finishRun(run);
      }
    });
  };

  window.addEventListener('sidebar-profile-effect-change', (event) => {
    syncToProfileEffect(event.detail.key);
  });

  window.addEventListener('sidebar-profile-effect-ending', (event) => {
    if (!activeRun || activeRun.profileKey !== event.detail.key) {
      return;
    }

    event.detail.waitUntil(requestStop(activeRun));
  });

  if (!reducedMotion) {
    effects.forEach((effect) => {
      void fetch(effect.source, { cache: 'force-cache' }).catch(() => {});
    });
  }

  syncToProfileEffect(document.documentElement.dataset.sidebarProfileEffect || 'first-breath');
})();
