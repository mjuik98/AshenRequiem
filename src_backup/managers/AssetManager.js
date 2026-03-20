/**
 * AssetManager — 에셋 로드 및 접근 관리
 *
 * 역할:
 *   - 이미지 / 오디오 파일 로드 관리
 *   - 로드 완료 전 Scene 진입 방지 (isReady 체크)
 *   - 로드 진행률 제공 (progress)
 *
 * 계약:
 *   - 입력: 에셋 목록 (id → url 매핑)
 *   - 읽기: 에셋 로드 상태, 캐시된 에셋 객체
 *   - 쓰기: 내부 캐시만 수정
 *   - 출력: 없음 (get()으로 에셋 반환)
 *
 * 사용 방법:
 *   const assets = new AssetManager();
 *
 *   // 에셋 등록 (실제 파일이 없어도 등록 가능)
 *   assets.register('player', 'assets/player.png');
 *   assets.register('bgm',    'assets/bgm.ogg');
 *
 *   // 로드 시작 (Game 초기화 시 한 번)
 *   await assets.loadAll();
 *
 *   // 로드 완료 확인 후 Scene 진입
 *   if (assets.isReady()) {
 *     sceneManager.change('play');
 *   }
 *
 *   // 에셋 사용
 *   const img = assets.get('player'); // HTMLImageElement | null
 *
 * MVP 전략:
 *   현재 Canvas 렌더링은 코드로 직접 그리므로 에셋이 없어도 동작한다.
 *   그러나 스프라이트 / 사운드 파일이 추가되는 시점에 AssetManager 없이
 *   로드 순서를 관리하면 Scene 진입 타이밍 버그가 발생한다.
 *   지금 이 인터페이스를 정의해두면 에셋 추가 시 소급 적용 비용이 없다.
 */
export class AssetManager {
  constructor() {
    /** @type {Map<string, string>} id → url */
    this._registry = new Map();

    /** @type {Map<string, HTMLImageElement | AudioBuffer | null>} id → 로드된 에셋 */
    this._cache = new Map();

    this._totalCount  = 0;
    this._loadedCount = 0;
    this._errors      = [];
    this._loaded      = false;
  }

  // ── 등록 ────────────────────────────────────────────────────

  /**
   * 에셋을 로드 목록에 등록한다.
   * loadAll() 호출 전에 등록해야 한다.
   *
   * @param {string} id  - 식별자 (예: 'player', 'hit-sfx')
   * @param {string} url - 파일 경로 (예: 'assets/player.png')
   */
  register(id, url) {
    if (this._loaded) {
      console.warn(`[AssetManager] 이미 로드 완료 후 register 호출: "${id}"`);
    }
    this._registry.set(id, url);
  }

  // ── 로드 ────────────────────────────────────────────────────

  /**
   * 등록된 모든 에셋을 병렬 로드한다.
   * 로드 실패한 에셋은 null로 캐시하고 계속 진행한다 (부분 실패 허용).
   *
   * @returns {Promise<void>}
   */
  async loadAll() {
    if (this._registry.size === 0) {
      this._loaded = true;
      return;
    }

    this._totalCount  = this._registry.size;
    this._loadedCount = 0;
    this._errors      = [];

    const promises = [];

    for (const [id, url] of this._registry) {
      const ext = url.split('.').pop()?.toLowerCase() ?? '';

      if (['png', 'jpg', 'jpeg', 'gif', 'webp', 'svg'].includes(ext)) {
        promises.push(this._loadImage(id, url));
      } else if (['ogg', 'mp3', 'wav', 'aac', 'm4a'].includes(ext)) {
        promises.push(this._loadAudio(id, url));
      } else {
        console.warn(`[AssetManager] 알 수 없는 에셋 타입: "${url}"`);
        this._cache.set(id, null);
        this._loadedCount++;
      }
    }

    await Promise.allSettled(promises);
    this._loaded = true;

    if (this._errors.length > 0) {
      console.warn(`[AssetManager] ${this._errors.length}개 에셋 로드 실패:`, this._errors);
    }
  }

  // ── 상태 확인 ────────────────────────────────────────────────

  /**
   * 모든 에셋 로드가 완료되었는지 확인.
   * Scene 진입 전에 이 값을 확인해야 한다.
   *
   * @returns {boolean}
   */
  isReady() {
    return this._loaded;
  }

  /**
   * 로드 진행률 (0.0 ~ 1.0).
   * 로딩 화면 표시에 사용.
   *
   * @returns {number}
   */
  get progress() {
    if (this._totalCount === 0) return 1;
    return this._loadedCount / this._totalCount;
  }

  /**
   * 로드된 에셋을 반환한다.
   * 미등록 또는 로드 실패한 에셋은 null 반환.
   *
   * @param {string} id
   * @returns {HTMLImageElement | AudioBuffer | null}
   */
  get(id) {
    if (!this._cache.has(id)) {
      console.warn(`[AssetManager] 등록되지 않은 에셋: "${id}"`);
      return null;
    }
    return this._cache.get(id) ?? null;
  }

  /**
   * 에셋이 정상적으로 로드되었는지 확인.
   *
   * @param {string} id
   * @returns {boolean}
   */
  has(id) {
    return this._cache.get(id) != null;
  }

  // ── 내부 로더 ────────────────────────────────────────────────

  /** @private */
  async _loadImage(id, url) {
    return new Promise((resolve) => {
      const img = new Image();
      img.onload = () => {
        this._cache.set(id, img);
        this._loadedCount++;
        resolve();
      };
      img.onerror = () => {
        console.warn(`[AssetManager] 이미지 로드 실패: "${url}"`);
        this._cache.set(id, null);
        this._errors.push(url);
        this._loadedCount++;
        resolve(); // reject 대신 resolve — 부분 실패 허용
      };
      img.src = url;
    });
  }

  /** @private */
  async _loadAudio(id, url) {
    try {
      const response = await fetch(url);
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const arrayBuffer = await response.arrayBuffer();

      // AudioContext는 사용자 인터랙션 후 생성되어야 하므로
      // 여기서는 ArrayBuffer만 보관하고 실제 decode는 SoundSystem에서 처리
      // (MVP에서는 SoundSystem이 Web Audio API로 절차적 사운드를 생성하므로 미사용)
      this._cache.set(id, arrayBuffer);
      this._loadedCount++;
    } catch (e) {
      console.warn(`[AssetManager] 오디오 로드 실패: "${url}"`, e.message);
      this._cache.set(id, null);
      this._errors.push(url);
      this._loadedCount++;
    }
  }

  // ── 해제 ────────────────────────────────────────────────────

  /**
   * 캐시 초기화. Scene 전환 또는 게임 종료 시 호출.
   */
  destroy() {
    this._cache.clear();
    this._registry.clear();
    this._loaded      = false;
    this._totalCount  = 0;
    this._loadedCount = 0;
    this._errors      = [];
  }
}
