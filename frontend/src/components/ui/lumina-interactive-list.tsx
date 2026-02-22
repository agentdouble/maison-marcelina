import { useEffect, useRef } from "react";

declare const gsap: any;
declare const THREE: any;

type LuminaSlide = {
  title: string;
  description: string;
  media: string;
};

type LuminaInteractiveListProps = {
  slides?: LuminaSlide[];
};

const defaultSlides: LuminaSlide[] = [
  {
    title: "Ethereal Glow",
    description: "A soft, radiant light that illuminates the soul.",
    media: "https://assets.codepen.io/7558/orange-portrait-001.jpg",
  },
  {
    title: "Rose Mirage",
    description: "Lost in a desert of blooming dreams and endless horizons.",
    media: "https://assets.codepen.io/7558/orange-portrait-002.jpg",
  },
  {
    title: "Velvet Mystique",
    description: "Wrapped in the deep, luxurious embrace of the night.",
    media: "https://assets.codepen.io/7558/orange-portrait-003.jpg",
  },
  {
    title: "Golden Hour",
    description: "That fleeting moment when the world is dipped in gold.",
    media: "https://assets.codepen.io/7558/orange-portrait-004.jpg",
  },
  {
    title: "Midnight Dreams",
    description: "Where reality fades and imagination takes flight.",
    media: "https://assets.codepen.io/7558/orange-portrait-005.jpg",
  },
  {
    title: "Silver Light",
    description: "A cool, metallic shimmer reflecting the urban pulse.",
    media: "https://assets.codepen.io/7558/orange-portrait-006.jpg",
  },
];

export function Component({ slides = defaultSlides }: LuminaInteractiveListProps) {
  const containerRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container || slides.length === 0) {
      return undefined;
    }

    const loadScript = (src: string, globalName: string) =>
      new Promise<void>((resolve, reject) => {
        if ((window as any)[globalName]) {
          resolve();
          return;
        }

        const existing = document.querySelector(`script[src="${src}"]`) as HTMLScriptElement | null;
        const onLoad = () => resolve();
        const onError = () => reject(new Error(`Failed to load ${src}`));

        if (existing) {
          existing.addEventListener("load", onLoad, { once: true });
          existing.addEventListener("error", onError, { once: true });
          return;
        }

        const script = document.createElement("script");
        script.src = src;
        script.async = true;
        script.addEventListener("load", onLoad, { once: true });
        script.addEventListener("error", onError, { once: true });
        document.head.appendChild(script);
      });

    const SLIDER_CONFIG: any = {
      settings: {
        transitionDuration: 2.5,
        autoSlideSpeed: 5000,
        currentEffect: "glass",
        currentEffectPreset: "Default",
        globalIntensity: 1.0,
        speedMultiplier: 1.0,
        distortionStrength: 1.0,
        colorEnhancement: 1.0,
        glassRefractionStrength: 1.0,
        glassChromaticAberration: 1.0,
        glassBubbleClarity: 1.0,
        glassEdgeGlow: 1.0,
        glassLiquidFlow: 1.0,
        frostIntensity: 1.5,
        frostCrystalSize: 1.0,
        frostIceCoverage: 1.0,
        frostTemperature: 1.0,
        frostTexture: 1.0,
        rippleFrequency: 25.0,
        rippleAmplitude: 0.08,
        rippleWaveSpeed: 1.0,
        rippleRippleCount: 1.0,
        rippleDecay: 1.0,
        plasmaIntensity: 1.2,
        plasmaSpeed: 0.8,
        plasmaEnergyIntensity: 0.4,
        plasmaContrastBoost: 0.3,
        plasmaTurbulence: 1.0,
        timeshiftDistortion: 1.6,
        timeshiftBlur: 1.5,
        timeshiftFlow: 1.4,
        timeshiftChromatic: 1.5,
        timeshiftTurbulence: 1.4,
      },
      effectPresets: {
        glass: {
          Subtle: {
            glassRefractionStrength: 0.6,
            glassChromaticAberration: 0.5,
            glassBubbleClarity: 1.3,
            glassEdgeGlow: 0.7,
            glassLiquidFlow: 0.8,
          },
          Default: {
            glassRefractionStrength: 1.0,
            glassChromaticAberration: 1.0,
            glassBubbleClarity: 1.0,
            glassEdgeGlow: 1.0,
            glassLiquidFlow: 1.0,
          },
          Crystal: {
            glassRefractionStrength: 1.5,
            glassChromaticAberration: 1.8,
            glassBubbleClarity: 0.7,
            glassEdgeGlow: 1.4,
            glassLiquidFlow: 0.5,
          },
          Liquid: {
            glassRefractionStrength: 0.8,
            glassChromaticAberration: 0.4,
            glassBubbleClarity: 1.2,
            glassEdgeGlow: 0.8,
            glassLiquidFlow: 1.8,
          },
        },
        frost: {
          Light: {
            frostIntensity: 0.8,
            frostCrystalSize: 1.3,
            frostIceCoverage: 0.6,
            frostTemperature: 0.7,
            frostTexture: 0.8,
          },
          Default: {
            frostIntensity: 1.5,
            frostCrystalSize: 1.0,
            frostIceCoverage: 1.0,
            frostTemperature: 1.0,
            frostTexture: 1.0,
          },
          Heavy: {
            frostIntensity: 2.2,
            frostCrystalSize: 0.7,
            frostIceCoverage: 1.4,
            frostTemperature: 1.5,
            frostTexture: 1.3,
          },
          Arctic: {
            frostIntensity: 2.8,
            frostCrystalSize: 0.5,
            frostIceCoverage: 1.8,
            frostTemperature: 2.0,
            frostTexture: 1.6,
          },
        },
        ripple: {
          Gentle: {
            rippleFrequency: 15.0,
            rippleAmplitude: 0.05,
            rippleWaveSpeed: 0.7,
            rippleRippleCount: 0.8,
            rippleDecay: 1.2,
          },
          Default: {
            rippleFrequency: 25.0,
            rippleAmplitude: 0.08,
            rippleWaveSpeed: 1.0,
            rippleRippleCount: 1.0,
            rippleDecay: 1.0,
          },
          Strong: {
            rippleFrequency: 35.0,
            rippleAmplitude: 0.12,
            rippleWaveSpeed: 1.4,
            rippleRippleCount: 1.3,
            rippleDecay: 0.8,
          },
          Tsunami: {
            rippleFrequency: 45.0,
            rippleAmplitude: 0.18,
            rippleWaveSpeed: 1.8,
            rippleRippleCount: 1.6,
            rippleDecay: 0.6,
          },
        },
        plasma: {
          Calm: {
            plasmaIntensity: 0.8,
            plasmaSpeed: 0.5,
            plasmaEnergyIntensity: 0.2,
            plasmaContrastBoost: 0.1,
            plasmaTurbulence: 0.6,
          },
          Default: {
            plasmaIntensity: 1.2,
            plasmaSpeed: 0.8,
            plasmaEnergyIntensity: 0.4,
            plasmaContrastBoost: 0.3,
            plasmaTurbulence: 1.0,
          },
          Storm: {
            plasmaIntensity: 1.8,
            plasmaSpeed: 1.3,
            plasmaEnergyIntensity: 0.7,
            plasmaContrastBoost: 0.5,
            plasmaTurbulence: 1.5,
          },
          Nuclear: {
            plasmaIntensity: 2.5,
            plasmaSpeed: 1.8,
            plasmaEnergyIntensity: 1.0,
            plasmaContrastBoost: 0.8,
            plasmaTurbulence: 2.0,
          },
        },
        timeshift: {
          Subtle: {
            timeshiftDistortion: 0.5,
            timeshiftBlur: 0.6,
            timeshiftFlow: 0.5,
            timeshiftChromatic: 0.4,
            timeshiftTurbulence: 0.6,
          },
          Default: {
            timeshiftDistortion: 1.6,
            timeshiftBlur: 1.5,
            timeshiftFlow: 1.4,
            timeshiftChromatic: 1.5,
            timeshiftTurbulence: 1.4,
          },
          Intense: {
            timeshiftDistortion: 2.2,
            timeshiftBlur: 2.0,
            timeshiftFlow: 2.0,
            timeshiftChromatic: 2.2,
            timeshiftTurbulence: 2.0,
          },
          Dreamlike: {
            timeshiftDistortion: 2.8,
            timeshiftBlur: 2.5,
            timeshiftFlow: 2.5,
            timeshiftChromatic: 2.6,
            timeshiftTurbulence: 2.5,
          },
        },
      },
    };

    let currentSlideIndex = 0;
    let isTransitioning = false;
    let shaderMaterial: any;
    let renderer: any;
    let scene: any;
    let camera: any;
    const slideTextures: any[] = [];
    let texturesLoaded = false;
    let autoSlideTimer: number | null = null;
    let progressAnimation: number | null = null;
    let sliderEnabled = false;
    let rafId: number | null = null;
    let mounted = true;

    const SLIDE_DURATION = () => SLIDER_CONFIG.settings.autoSlideSpeed;
    const PROGRESS_UPDATE_INTERVAL = 50;
    const TRANSITION_DURATION = () => SLIDER_CONFIG.settings.transitionDuration;

    const vertexShader =
      "varying vec2 vUv; void main() { vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }";
    const fragmentShader = `
      uniform sampler2D uTexture1, uTexture2;
      uniform float uProgress;
      uniform vec2 uResolution, uTexture1Size, uTexture2Size;
      uniform int uEffectType;
      uniform float uGlobalIntensity, uSpeedMultiplier, uDistortionStrength, uColorEnhancement;
      uniform float uGlassRefractionStrength, uGlassChromaticAberration, uGlassBubbleClarity, uGlassEdgeGlow, uGlassLiquidFlow;
      uniform float uFrostIntensity, uFrostCrystalSize, uFrostIceCoverage, uFrostTemperature, uFrostTexture;
      uniform float uRippleFrequency, uRippleAmplitude, uRippleWaveSpeed, uRippleRippleCount, uRippleDecay;
      uniform float uPlasmaIntensity, uPlasmaSpeed, uPlasmaEnergyIntensity, uPlasmaContrastBoost, uPlasmaTurbulence;
      uniform float uTimeshiftDistortion, uTimeshiftBlur, uTimeshiftFlow, uTimeshiftChromatic, uTimeshiftTurbulence;
      varying vec2 vUv;

      vec2 getCoverUV(vec2 uv, vec2 textureSize) {
          vec2 s = uResolution / textureSize;
          float scale = max(s.x, s.y);
          vec2 scaledSize = textureSize * scale;
          vec2 offset = (uResolution - scaledSize) * 0.5;
          return (uv * uResolution - offset) / scaledSize;
      }

      vec4 glassEffect(vec2 uv, float progress) {
          float time = progress * 5.0 * uSpeedMultiplier;
          vec2 uv1 = getCoverUV(uv, uTexture1Size); vec2 uv2 = getCoverUV(uv, uTexture2Size);
          float maxR = length(uResolution) * 0.85; float br = progress * maxR;
          vec2 p = uv * uResolution; vec2 c = uResolution * 0.5;
          float d = length(p - c); float nd = d / max(br, 0.001);
          float param = smoothstep(br + 3.0, br - 3.0, d);
          vec4 img;
          if (param > 0.0) {
               float ro = 0.08 * uGlassRefractionStrength * uDistortionStrength * uGlobalIntensity * pow(smoothstep(0.3 * uGlassBubbleClarity, 1.0, nd), 1.5);
               vec2 dir = (d > 0.0) ? (p - c) / d : vec2(0.0);
               vec2 distUV = uv2 - dir * ro;
               distUV += vec2(sin(time + nd * 10.0), cos(time * 0.8 + nd * 8.0)) * 0.015 * uGlassLiquidFlow * uSpeedMultiplier * nd * param;
               float ca = 0.02 * uGlassChromaticAberration * uGlobalIntensity * pow(smoothstep(0.3, 1.0, nd), 1.2);
               img = vec4(texture2D(uTexture2, distUV + dir * ca * 1.2).r, texture2D(uTexture2, distUV + dir * ca * 0.2).g, texture2D(uTexture2, distUV - dir * ca * 0.8).b, 1.0);
               if (uGlassEdgeGlow > 0.0) {
                  float rim = smoothstep(0.95, 1.0, nd) * (1.0 - smoothstep(1.0, 1.01, nd));
                  img.rgb += rim * 0.08 * uGlassEdgeGlow * uGlobalIntensity;
               }
          } else { img = texture2D(uTexture2, uv2); }
          vec4 oldImg = texture2D(uTexture1, uv1);
          if (progress > 0.95) img = mix(img, texture2D(uTexture2, uv2), (progress - 0.95) / 0.05);
          return mix(oldImg, img, param);
      }
      vec4 frostEffect(vec2 uv, float progress) { return mix(texture2D(uTexture1, getCoverUV(uv, uTexture1Size)), texture2D(uTexture2, getCoverUV(uv, uTexture2Size)), progress); }
      vec4 rippleEffect(vec2 uv, float progress) { return mix(texture2D(uTexture1, getCoverUV(uv, uTexture1Size)), texture2D(uTexture2, getCoverUV(uv, uTexture2Size)), progress); }
      vec4 plasmaEffect(vec2 uv, float progress) { return mix(texture2D(uTexture1, getCoverUV(uv, uTexture1Size)), texture2D(uTexture2, getCoverUV(uv, uTexture2Size)), progress); }
      vec4 timeshiftEffect(vec2 uv, float progress) { return mix(texture2D(uTexture1, getCoverUV(uv, uTexture1Size)), texture2D(uTexture2, getCoverUV(uv, uTexture2Size)), progress); }

      void main() {
          if (uEffectType == 0) gl_FragColor = glassEffect(vUv, uProgress);
          else if (uEffectType == 1) gl_FragColor = frostEffect(vUv, uProgress);
          else if (uEffectType == 2) gl_FragColor = rippleEffect(vUv, uProgress);
          else if (uEffectType == 3) gl_FragColor = plasmaEffect(vUv, uProgress);
          else gl_FragColor = timeshiftEffect(vUv, uProgress);
      }
    `;

    const getEffectIndex = (name: string) =>
      ({ glass: 0, frost: 1, ripple: 2, plasma: 3, timeshift: 4 } as any)[name] ?? 0;

    const updateShaderUniforms = () => {
      if (!shaderMaterial) {
        return;
      }

      const settings = SLIDER_CONFIG.settings;
      const uniforms = shaderMaterial.uniforms;
      Object.keys(settings).forEach((key) => {
        const uniformName = `u${key.charAt(0).toUpperCase()}${key.slice(1)}`;
        if (uniforms[uniformName]) {
          uniforms[uniformName].value = settings[key];
        }
      });
      uniforms.uEffectType.value = getEffectIndex(settings.currentEffect);
    };

    const splitText = (text: string) =>
      text
        .trim()
        .split(/\s+/)
        .map(
          (word) =>
            `<span class="word-fragment" style="display:inline-block;opacity:0;white-space:nowrap;margin-right:0.24em;">${word}</span>`
        )
        .join("");

    const scopeQueryAll = (selector: string) =>
      Array.from(container.querySelectorAll(selector)) as HTMLElement[];

    const updateNavigationState = (idx: number) => {
      scopeQueryAll(".slide-nav-item").forEach((element, i) => {
        element.classList.toggle("active", i === idx);
        element.setAttribute("aria-pressed", i === idx ? "true" : "false");
      });
    };

    const updateSlideProgress = (idx: number, progress: number) => {
      const item = scopeQueryAll(".slide-nav-item")[idx];
      const fill = item?.querySelector(".slide-progress-fill") as HTMLElement | null;
      if (!fill) {
        return;
      }
      fill.style.width = `${progress}%`;
      fill.style.opacity = "1";
    };

    const fadeSlideProgress = (idx: number) => {
      const item = scopeQueryAll(".slide-nav-item")[idx];
      const fill = item?.querySelector(".slide-progress-fill") as HTMLElement | null;
      if (!fill) {
        return;
      }
      fill.style.opacity = "0";
      window.setTimeout(() => {
        fill.style.width = "0%";
      }, 220);
    };

    const quickResetProgress = (idx: number) => {
      const item = scopeQueryAll(".slide-nav-item")[idx];
      const fill = item?.querySelector(".slide-progress-fill") as HTMLElement | null;
      if (!fill) {
        return;
      }
      fill.style.transition = "width 0.22s ease-out";
      fill.style.width = "0%";
      window.setTimeout(() => {
        fill.style.transition = "width 0.12s ease, opacity 0.26s ease";
      }, 220);
    };

    const stopAutoSlideTimer = () => {
      if (progressAnimation !== null) {
        window.clearInterval(progressAnimation);
      }
      if (autoSlideTimer !== null) {
        window.clearTimeout(autoSlideTimer);
      }
      progressAnimation = null;
      autoSlideTimer = null;
    };

    const safeStartTimer = (delay = 0) => {
      stopAutoSlideTimer();
      if (!sliderEnabled || !texturesLoaded) {
        return;
      }

      const startAutoSlideTimer = () => {
        let progress = 0;
        const increment = (100 / SLIDE_DURATION()) * PROGRESS_UPDATE_INTERVAL;
        progressAnimation = window.setInterval(() => {
          if (!sliderEnabled || !mounted) {
            stopAutoSlideTimer();
            return;
          }
          progress += increment;
          updateSlideProgress(currentSlideIndex, progress);
          if (progress >= 100) {
            stopAutoSlideTimer();
            fadeSlideProgress(currentSlideIndex);
            if (!isTransitioning) {
              navigateToSlide((currentSlideIndex + 1) % slides.length);
            }
          }
        }, PROGRESS_UPDATE_INTERVAL);
      };

      if (delay > 0) {
        autoSlideTimer = window.setTimeout(startAutoSlideTimer, delay);
      } else {
        startAutoSlideTimer();
      }
    };

    const updateContent = (idx: number) => {
      const titleElement = container.querySelector("#mainTitle") as HTMLElement | null;
      const descriptionElement = container.querySelector("#mainDesc") as HTMLElement | null;
      if (!titleElement || !descriptionElement) {
        return;
      }

      if (typeof gsap === "undefined") {
        titleElement.textContent = slides[idx].title;
        descriptionElement.textContent = slides[idx].description;
        return;
      }

      gsap.to(titleElement.children, {
        y: -20,
        opacity: 0,
        duration: 0.5,
        stagger: 0.02,
        ease: "power2.in",
      });
      gsap.to(descriptionElement, {
        y: -10,
        opacity: 0,
        duration: 0.4,
        ease: "power2.in",
      });

      window.setTimeout(() => {
        if (!mounted) {
          return;
        }

        titleElement.innerHTML = splitText(slides[idx].title);
        descriptionElement.textContent = slides[idx].description;

        gsap.set(titleElement.children, { opacity: 0, y: 20 });
        gsap.set(descriptionElement, { y: 20, opacity: 0 });
        gsap.to(titleElement.children, {
          y: 0,
          opacity: 1,
          duration: 0.8,
          stagger: 0.03,
          ease: "power3.out",
        });
        gsap.to(descriptionElement, {
          y: 0,
          opacity: 1,
          duration: 0.8,
          delay: 0.2,
          ease: "power3.out",
        });
      }, 480);
    };

    const navigateToSlide = (targetIndex: number) => {
      if (isTransitioning || targetIndex === currentSlideIndex) {
        return;
      }

      stopAutoSlideTimer();
      quickResetProgress(currentSlideIndex);

      const currentTexture = slideTextures[currentSlideIndex];
      const targetTexture = slideTextures[targetIndex];
      if (!currentTexture || !targetTexture || !shaderMaterial) {
        return;
      }

      isTransitioning = true;
      shaderMaterial.uniforms.uTexture1.value = currentTexture;
      shaderMaterial.uniforms.uTexture2.value = targetTexture;
      shaderMaterial.uniforms.uTexture1Size.value = currentTexture.userData.size;
      shaderMaterial.uniforms.uTexture2Size.value = targetTexture.userData.size;

      updateContent(targetIndex);
      currentSlideIndex = targetIndex;
      updateNavigationState(currentSlideIndex);

      const completeTransition = () => {
        shaderMaterial.uniforms.uProgress.value = 0;
        shaderMaterial.uniforms.uTexture1.value = targetTexture;
        shaderMaterial.uniforms.uTexture1Size.value = targetTexture.userData.size;
        isTransitioning = false;
        safeStartTimer(120);
      };

      if (typeof gsap === "undefined") {
        completeTransition();
        return;
      }

      gsap.fromTo(
        shaderMaterial.uniforms.uProgress,
        { value: 0 },
        {
          value: 1,
          duration: TRANSITION_DURATION(),
          ease: "power2.inOut",
          onComplete: completeTransition,
        }
      );
    };

    const createSlidesNavigation = () => {
      const nav = container.querySelector("#slidesNav") as HTMLElement | null;
      if (!nav) {
        return;
      }

      nav.innerHTML = "";
      slides.forEach((slide, index) => {
        const item = document.createElement("button");
        item.type = "button";
        item.className = `slide-nav-item${index === 0 ? " active" : ""}`;
        item.dataset.slideIndex = String(index);
        item.setAttribute("aria-label", slide.title);
        item.setAttribute("aria-pressed", index === 0 ? "true" : "false");
        item.innerHTML =
          `<div class="slide-nav-title">${slide.title}</div>` +
          '<div class="slide-progress-line"><div class="slide-progress-fill"></div></div>';
        item.addEventListener("click", () => {
          if (index !== currentSlideIndex) {
            navigateToSlide(index);
          }
        });
        nav.appendChild(item);
      });
    };

    const loadImageTexture = (src: string) =>
      new Promise<any>((resolve, reject) => {
        const textureLoader = new THREE.TextureLoader();
        textureLoader.load(
          src,
          (texture: any) => {
            texture.minFilter = THREE.LinearFilter;
            texture.magFilter = THREE.LinearFilter;
            texture.userData = {
              size: new THREE.Vector2(texture.image.width, texture.image.height),
            };
            resolve(texture);
          },
          undefined,
          reject
        );
      });

    const initRenderer = async () => {
      const canvas = container.querySelector(".webgl-canvas") as HTMLCanvasElement | null;
      if (!canvas || !mounted) {
        return;
      }

      scene = new THREE.Scene();
      camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
      renderer = new THREE.WebGLRenderer({
        canvas,
        antialias: false,
        alpha: false,
      });
      renderer.setSize(window.innerWidth, window.innerHeight);
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

      shaderMaterial = new THREE.ShaderMaterial({
        uniforms: {
          uTexture1: { value: null },
          uTexture2: { value: null },
          uProgress: { value: 0 },
          uResolution: { value: new THREE.Vector2(window.innerWidth, window.innerHeight) },
          uTexture1Size: { value: new THREE.Vector2(1, 1) },
          uTexture2Size: { value: new THREE.Vector2(1, 1) },
          uEffectType: { value: 0 },
          uGlobalIntensity: { value: 1.0 },
          uSpeedMultiplier: { value: 1.0 },
          uDistortionStrength: { value: 1.0 },
          uColorEnhancement: { value: 1.0 },
          uGlassRefractionStrength: { value: 1.0 },
          uGlassChromaticAberration: { value: 1.0 },
          uGlassBubbleClarity: { value: 1.0 },
          uGlassEdgeGlow: { value: 1.0 },
          uGlassLiquidFlow: { value: 1.0 },
          uFrostIntensity: { value: 1.0 },
          uFrostCrystalSize: { value: 1.0 },
          uFrostIceCoverage: { value: 1.0 },
          uFrostTemperature: { value: 1.0 },
          uFrostTexture: { value: 1.0 },
          uRippleFrequency: { value: 25.0 },
          uRippleAmplitude: { value: 0.08 },
          uRippleWaveSpeed: { value: 1.0 },
          uRippleRippleCount: { value: 1.0 },
          uRippleDecay: { value: 1.0 },
          uPlasmaIntensity: { value: 1.2 },
          uPlasmaSpeed: { value: 0.8 },
          uPlasmaEnergyIntensity: { value: 0.4 },
          uPlasmaContrastBoost: { value: 0.3 },
          uPlasmaTurbulence: { value: 1.0 },
          uTimeshiftDistortion: { value: 1.6 },
          uTimeshiftBlur: { value: 1.5 },
          uTimeshiftFlow: { value: 1.4 },
          uTimeshiftChromatic: { value: 1.5 },
          uTimeshiftTurbulence: { value: 1.4 },
        },
        vertexShader,
        fragmentShader,
      });
      scene.add(new THREE.Mesh(new THREE.PlaneGeometry(2, 2), shaderMaterial));

      for (const slide of slides) {
        try {
          const texture = await loadImageTexture(slide.media);
          if (mounted) {
            slideTextures.push(texture);
          }
        } catch {
          // Keep rendering available textures only.
        }
      }

      if (!mounted || slideTextures.length < 2) {
        return;
      }

      shaderMaterial.uniforms.uTexture1.value = slideTextures[0];
      shaderMaterial.uniforms.uTexture2.value = slideTextures[1];
      shaderMaterial.uniforms.uTexture1Size.value = slideTextures[0].userData.size;
      shaderMaterial.uniforms.uTexture2Size.value = slideTextures[1].userData.size;
      texturesLoaded = true;
      sliderEnabled = true;
      updateShaderUniforms();
      safeStartTimer(500);

      const render = () => {
        if (!mounted) {
          return;
        }
        rafId = window.requestAnimationFrame(render);
        renderer.render(scene, camera);
      };
      render();
    };

    const init = async () => {
      try {
        await loadScript(
          "https://cdnjs.cloudflare.com/ajax/libs/gsap/3.12.2/gsap.min.js",
          "gsap"
        );
        await loadScript("https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js", "THREE");
      } catch {
        return;
      }

      if (!mounted || typeof THREE === "undefined") {
        return;
      }

      createSlidesNavigation();
      updateNavigationState(0);

      const titleElement = container.querySelector("#mainTitle") as HTMLElement | null;
      const descriptionElement = container.querySelector("#mainDesc") as HTMLElement | null;
      if (titleElement && descriptionElement) {
        titleElement.innerHTML = splitText(slides[0].title);
        descriptionElement.textContent = slides[0].description;
        if (typeof gsap !== "undefined") {
          gsap.fromTo(
            titleElement.children,
            { y: 20, opacity: 0 },
            {
              y: 0,
              opacity: 1,
              duration: 1,
              stagger: 0.03,
              ease: "power3.out",
              delay: 0.4,
            }
          );
          gsap.fromTo(
            descriptionElement,
            { y: 20, opacity: 0 },
            { y: 0, opacity: 1, duration: 1, ease: "power3.out", delay: 0.7 }
          );
        }
      }

      await initRenderer();

      const onVisibility = () => {
        if (document.hidden) {
          stopAutoSlideTimer();
        } else if (!isTransitioning) {
          safeStartTimer();
        }
      };
      const onResize = () => {
        if (!renderer || !shaderMaterial) {
          return;
        }
        renderer.setSize(window.innerWidth, window.innerHeight);
        shaderMaterial.uniforms.uResolution.value.set(window.innerWidth, window.innerHeight);
      };

      document.addEventListener("visibilitychange", onVisibility);
      window.addEventListener("resize", onResize);

      return () => {
        document.removeEventListener("visibilitychange", onVisibility);
        window.removeEventListener("resize", onResize);
      };
    };

    let detachListeners: (() => void) | undefined;
    init().then((cleanup) => {
      detachListeners = cleanup;
    });

    return () => {
      mounted = false;
      stopAutoSlideTimer();
      if (rafId !== null) {
        window.cancelAnimationFrame(rafId);
      }
      if (detachListeners) {
        detachListeners();
      }
      slideTextures.forEach((texture) => texture?.dispose?.());
      shaderMaterial?.dispose?.();
      renderer?.dispose?.();
    };
  }, [slides]);

  if (slides.length === 0) {
    return null;
  }

  return (
    <main className="slider-wrapper" ref={containerRef}>
      <canvas className="webgl-canvas" />

      <div className="slide-content">
        <h1 className="slide-title" id="mainTitle" />
        <p className="slide-description" id="mainDesc" />
      </div>

      <nav className="slides-navigation" id="slidesNav" />
    </main>
  );
}

export function LuminaInteractiveList(props: LuminaInteractiveListProps) {
  return <Component {...props} />;
}
