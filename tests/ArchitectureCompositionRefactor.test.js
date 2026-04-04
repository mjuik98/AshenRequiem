import assert from 'node:assert/strict';
import { createRunner } from './helpers/testRunner.js';
import { readProjectSource } from './helpers/sourceInspection.js';

console.log('\n[ArchitectureCompositionRefactor]');

const { test, summary } = createRunner('ArchitectureCompositionRefactor');

let playEventRegistrationService = null;
let metaShopViewModelService = null;
let codexRecordsQueryService = null;

try {
  playEventRegistrationService = await import('../src/app/play/playEventRegistrationService.js');
} catch (error) {
  playEventRegistrationService = { error };
}

try {
  metaShopViewModelService = await import('../src/app/meta/metaShopViewModelService.js');
} catch (error) {
  metaShopViewModelService = { error };
}

try {
  codexRecordsQueryService = await import('../src/app/meta/codexRecordsQueryService.js');
} catch (error) {
  codexRecordsQueryService = { error };
}

test('play composition helper는 이벤트 adapter 등록 orchestration을 app 계층으로 올린다', () => {
  assert.ok(
    !playEventRegistrationService?.error,
    playEventRegistrationService?.error?.message ?? 'src/app/play/playEventRegistrationService.js가 아직 없음',
  );
  assert.equal(typeof playEventRegistrationService.registerPlayEventHandlers, 'function');
  assert.equal(Array.isArray(playEventRegistrationService.PLAY_DEFAULT_EVENT_HANDLER_REGISTRATIONS), true);
});

test('bootstrap과 pipeline은 injected runtime composition을 소비한다', () => {
  const bootstrapSource = readProjectSource('../src/app/bootstrap/bootstrapBrowserGame.js');
  const playSceneBootstrapSource = readProjectSource('../src/scenes/play/playSceneBootstrap.js');
  const pipelineBuilderSource = readProjectSource('../src/core/PipelineBuilder.js');
  const playEventRegistrationSource = readProjectSource('../src/app/play/playEventRegistrationService.js');

  assert.equal(
    bootstrapSource.includes("from '../../adapters/browser/playRuntimeServices.js'"),
    true,
    'browser bootstrap이 play runtime browser service adapter를 소유해야 함',
  );
  assert.equal(
    playSceneBootstrapSource.includes("from '../../adapters/browser/playRuntimeServices.js'"),
    false,
    'PlayScene bootstrap이 browser adapter를 직접 import하면 안 됨',
  );
  assert.equal(
    pipelineBuilderSource.includes("from '../systems/event/eventHandlerRegistry.js'"),
    false,
    'PipelineBuilder가 event registry helper에 직접 결합하면 안 됨',
  );
  assert.equal(
    playEventRegistrationSource.includes("from '../../adapters/play/playEventAdapters.js'"),
    true,
    'play event registration service가 adapter group을 조합해야 함',
  );
  assert.equal(
    playEventRegistrationSource.includes("from '../../systems/event/eventHandlerRegistry.js'"),
    true,
    'play event registration service가 공용 register helper를 사용해야 함',
  );
});

test('메타/도감 view-model 계산은 app 계층 query service로 승격된다', () => {
  assert.ok(
    !metaShopViewModelService?.error,
    metaShopViewModelService?.error?.message ?? 'src/app/meta/metaShopViewModelService.js가 아직 없음',
  );
  assert.ok(
    !codexRecordsQueryService?.error,
    codexRecordsQueryService?.error?.message ?? 'src/app/meta/codexRecordsQueryService.js가 아직 없음',
  );
  assert.equal(typeof metaShopViewModelService.buildMetaShopViewModel, 'function');
  assert.equal(typeof codexRecordsQueryService.buildCodexRecordsModel, 'function');

  const metaShopViewSource = readProjectSource('../src/ui/metashop/MetaShopView.js');
  const metaShopModelSource = readProjectSource('../src/ui/metashop/metaShopModel.js');
  const codexRecordsSource = readProjectSource('../src/ui/codex/codexRecords.js');
  const codexRecordsTabSource = readProjectSource('../src/ui/codex/codexRecordsTab.js');

  assert.equal(
    metaShopViewSource.includes("from '../../app/meta/metaShopViewModelService.js'"),
    true,
    'MetaShopView가 app-level view model service를 직접 사용해야 함',
  );
  assert.equal(
    metaShopViewSource.includes("from './metaShopModel.js'"),
    false,
    'MetaShopView가 legacy ui model helper에 직접 묶여 있으면 안 됨',
  );
  assert.equal(
    metaShopModelSource.includes("from '../../app/meta/metaShopViewModelService.js'"),
    true,
    'legacy metaShop model facade가 app service를 재노출해야 함',
  );
  assert.equal(
    codexRecordsSource.includes("from '../../app/meta/codexRecordsQueryService.js'"),
    true,
    'codex records helper가 app query service를 재노출해야 함',
  );
  assert.equal(
    codexRecordsTabSource.includes("from '../../app/meta/codexRecordsQueryService.js'"),
    true,
    'codex records tab가 app query service를 사용해야 함',
  );
});

summary();
