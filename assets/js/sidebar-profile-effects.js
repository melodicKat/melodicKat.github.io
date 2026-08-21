(() => {
  const root = document.querySelector('[data-sidebar-profile-effects]');

  if (!root) {
    return;
  }

  const effects = Array.from(root.querySelectorAll('.sidebar-profile-effect'));
  const fadeDuration = 750;
  const fadeLeadDuration = 750;
  const restDuration = 1000;

  const wait = (duration) =>
    new Promise((resolve) => {
      window.setTimeout(resolve, duration);
    });

  const publishEffect = (effect, displayDuration) => {
    const detail = {
      key: effect.dataset.effectKey,
      name: effect.dataset.effectName,
      displayDuration,
      fadeDuration,
      fadeLeadDuration,
      restDuration
    };

    document.documentElement.dataset.sidebarProfileEffect = detail.key;
    document.documentElement.dataset.sidebarProfilePhase = 'active';
    window.dispatchEvent(new CustomEvent('sidebar-profile-effect-change', { detail }));
  };

  const publishEnding = (effect) => {
    const completions = [];
    const detail = {
      key: effect.dataset.effectKey,
      fadeDuration,
      fadeLeadDuration,
      waitUntil(promise) {
        if (promise && typeof promise.then === 'function') {
          completions.push(Promise.resolve(promise));
        }
      }
    };

    document.documentElement.dataset.sidebarProfilePhase = 'ending';
    window.dispatchEvent(new CustomEvent('sidebar-profile-effect-ending', { detail }));
    return completions;
  };

  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    const reducedEffect = effects.find(
      (effect) => effect.dataset.effectKey === root.dataset.reducedEffectKey
    );

    if (reducedEffect) {
      publishEffect(reducedEffect, 0);
    }

    return;
  }

  if (effects.length < 2) {
    return;
  }

  const restartImage = (image, source) => {
    image.removeAttribute('src');
    image.src = source;
  };

  const preloadImage = (source) => {
    const image = new Image();
    image.decoding = 'async';
    image.src = source;
  };

  const finishEffect = async (effect) => {
    effect.classList.remove('is-active');
    await wait(fadeDuration);

    if (effect.classList.contains('is-active')) {
      return;
    }

    effect.querySelectorAll('.sidebar-effect-layer').forEach((image) => {
      image.removeAttribute('src');
      image.classList.remove('is-playing');
    });
  };

  const playEffect = async (index) => {
    const effect = effects[index];
    const intro = effect.querySelector('.sidebar-effect-intro');
    const loop = effect.querySelector('.sidebar-effect-loop');
    const loopStart = Number(effect.dataset.loopStart);
    const displayDuration = Number(effect.dataset.displayDuration);

    restartImage(intro, effect.dataset.introSrc);
    loop.removeAttribute('src');
    loop.classList.remove('is-playing');
    effect.classList.add('is-active');
    publishEffect(effect, displayDuration);

    const nextEffect = effects[(index + 1) % effects.length];
    window.setTimeout(() => {
      preloadImage(effect.dataset.loopSrc);
      preloadImage(nextEffect.dataset.introSrc);
      preloadImage(nextEffect.dataset.loopSrc);
    }, 1000);

    const loopTimer = window.setTimeout(() => {
      restartImage(loop, effect.dataset.loopSrc);
      loop.classList.add('is-playing');
    }, loopStart);

    await wait(Math.max(0, displayDuration - fadeLeadDuration));

    const completions = publishEnding(effect);
    const profileFade = finishEffect(effect);

    await Promise.all([
      wait(fadeLeadDuration),
      profileFade,
      Promise.allSettled(completions)
    ]);

    window.clearTimeout(loopTimer);
    document.documentElement.dataset.sidebarProfilePhase = 'rest';
    await wait(restDuration);
  };

  const run = async () => {
    let index = 0;

    while (document.documentElement.contains(root)) {
      await playEffect(index);
      index = (index + 1) % effects.length;
    }
  };

  void run();
})();
