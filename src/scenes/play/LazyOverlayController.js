function defaultIsVisible(view) {
  const display = view?.el?.style?.display;
  return typeof display === 'string' ? display !== 'none' : false;
}

export class LazyOverlayController {
  constructor({
    loadViewModule,
    resolveViewClass,
    createView,
    showView,
    hideView,
    isVisible = defaultIsVisible,
    onError = null,
  }) {
    this._loadViewModule = loadViewModule;
    this._resolveViewClass = resolveViewClass;
    this._createView = createView;
    this._showView = showView;
    this._hideView = hideView;
    this._isVisible = isVisible;
    this._onError = onError;

    this._view = null;
    this._viewClass = null;
    this._modulePromise = null;
    this._viewPromise = null;
    this._pendingPayload = null;
    this._visible = false;
    this._destroyed = false;
  }

  preload() {
    return this._loadClass().catch(() => null);
  }

  show(payload) {
    this._visible = true;
    this._pendingPayload = payload;

    return this._ensureView()
      .then((view) => {
        if (!view || this._destroyed || !this._visible) return false;
        this._showView(view, this._pendingPayload);
        return true;
      })
      .catch((error) => {
        this._onError?.(error);
        return false;
      });
  }

  hide() {
    this._visible = false;
    this._pendingPayload = null;
    this._hideView?.(this._view);
  }

  isVisible() {
    return this._visible || this._isVisible(this._view);
  }

  destroy() {
    this._destroyed = true;
    this._view?.destroy?.();
    this._view = null;
  }

  _loadClass() {
    if (this._viewClass) return Promise.resolve(this._viewClass);
    if (this._modulePromise) return this._modulePromise;

    this._modulePromise = this._loadViewModule()
      .then((module) => {
        this._viewClass = this._resolveViewClass(module);
        return this._viewClass;
      })
      .catch((error) => {
        this._modulePromise = null;
        throw error;
      });

    return this._modulePromise;
  }

  _ensureView() {
    if (this._view) return Promise.resolve(this._view);
    if (this._viewPromise) return this._viewPromise;

    this._viewPromise = this._loadClass()
      .then((ViewClass) => {
        if (this._destroyed) return null;
        this._view = this._createView(ViewClass);
        return this._view;
      })
      .catch((error) => {
        this._viewPromise = null;
        throw error;
      });

    return this._viewPromise;
  }
}
