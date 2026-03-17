/**
 * PipelineProfiler — 시스템별 프레임 타임 프로파일러
 */
export class PipelineProfiler {
  constructor() {
    this._stats    = new Map();
    this._starts   = new Map();
    this._frameTotal = 0;
    this._smoothing = 30;
    this._windows  = new Map();
  }

  begin(name) {
    this._starts.set(name, performance.now());
  }

  end(name) {
    const start = this._starts.get(name);
    if (start === undefined) return;
    const elapsed = performance.now() - start;
    this._starts.delete(name);

    let window = this._windows.get(name);
    if (!window) { window = []; this._windows.set(name, window); }
    window.push(elapsed);
    if (window.length > this._smoothing) window.shift();

    let stat = this._stats.get(name);
    if (!stat) { stat = { total: 0, count: 0 }; this._stats.set(name, stat); }
    stat.total += elapsed;
    stat.count++;
  }

  wrap(pipeline) {
    const profiler  = this;
    const _origRun  = pipeline.run.bind(pipeline);

    pipeline.run = function(context) {
      if (!pipeline._sorted) {
        pipeline._entries.sort((a, b) => a.priority - b.priority);
        pipeline._sorted = true;
      }

      const frameStart = performance.now();

      for (let i = 0; i < pipeline._entries.length; i++) {
        const entry = pipeline._entries[i];
        if (!entry.enabled) continue;

        const name = entry.system?.constructor?.name
          ?? entry.system?.name
          ?? `system_${i}`;

        profiler.begin(name);
        entry.system.update(context);
        profiler.end(name);
      }

      profiler._frameTotal = performance.now() - frameStart;
    };
  }

  getSummary() {
    const results = [];
    let totalMs   = 0;

    for (const [name, window] of this._windows) {
      if (window.length === 0) continue;
      const avg = window.reduce((s, v) => s + v, 0) / window.length;
      results.push({ name, ms: avg });
      totalMs += avg;
    }

    for (const r of results) {
      r.pct = totalMs > 0 ? Math.round((r.ms / totalMs) * 100) : 0;
      r.ms  = parseFloat(r.ms.toFixed(2));
    }

    results.sort((a, b) => b.ms - a.ms);
    return results;
  }

  get frameTotalMs() {
    return parseFloat(this._frameTotal.toFixed(2));
  }

  reset() {
    this._stats.clear();
    this._starts.clear();
    this._windows.clear();
    this._frameTotal = 0;
  }

  toHtml(warnThreshold = 2) {
    const rows    = this.getSummary();
    const totalMs = this.frameTotalMs;

    if (rows.length === 0) {
      return '<p style="color:gray;font-size:11px">프로파일 데이터 없음</p>';
    }

    const rowsHtml = rows.map(r => {
      const color = r.ms >= warnThreshold ? '#ef5350' : '#b0bec5';
      const bar   = Math.round(r.pct);
      return `
        <tr>
          <td style="color:${color};font-family:monospace;font-size:11px;padding:1px 4px">${r.name}</td>
          <td style="color:${color};font-family:monospace;font-size:11px;text-align:right;padding:1px 4px">${r.ms}ms</td>
          <td style="padding:1px 4px;min-width:60px">
            <div style="height:6px;background:#263238;border-radius:3px">
              <div style="height:6px;width:${bar}%;background:${color};border-radius:3px"></div>
            </div>
          </td>
        </tr>`;
    }).join('');

    return `
      <table style="border-collapse:collapse;width:100%">
        <tr>
          <th colspan="3" style="color:#78909c;font-size:10px;text-align:left;padding:2px 4px">
            Pipeline profiler — 총 ${totalMs}ms/frame
          </th>
        </tr>
        ${rowsHtml}
      </table>`;
  }
}
