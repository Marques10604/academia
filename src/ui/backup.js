// #/backup screen: save a copy of every store, restore one from a file.
// Text that comes from the chosen file (summary, errors) always goes in through h() as text nodes.
import { h } from './dom.js';
import {
  SCHEMA_VERSION, readStores, replaceStores, setSetting, getSetting, getActive, listSessions, requestPersist,
} from '../data/db.js';
import {
  BACKUP_STORES, buildBackup, parseBackup, backupSummary, prepareRestore, backupFileName, backupStatus,
} from '../domain/backup.js';
import { localDate } from '../domain/dates.js';
import { APP_VERSION } from '../version.js';

const MAX_BYTES = 20 * 1024 * 1024;
const OPEN_WORKOUT = 'Finalize ou descarte o treino em andamento antes de restaurar.';

// "Último backup: hoje / ontem / há N dias" or "Nenhum backup ainda" (status comes from backupStatus).
export function backupAgeText(status) {
  const d = status.daysAgo;
  if (d === null) return 'Nenhum backup ainda';
  if (d === 0) return 'Último backup: hoje';
  if (d === 1) return 'Último backup: ontem';
  return `Último backup: há ${d} dias`;
}

// Reads every store and returns the backup as text, plus the moment it was made.
async function exportText() {
  const now = Date.now();
  const stores = await readStores(Object.keys(BACKUP_STORES));
  const doc = buildBackup({ stores, schemaVersion: SCHEMA_VERSION, appVersion: APP_VERSION, now });
  return { text: JSON.stringify(doc, null, 2), now };
}

export async function renderBackup() {
  const onboarded = (await getSetting('onboardingDone', false)) === true;

  const status = backupStatus({
    lastBackupAt: await getSetting('lastBackupAt', null),
    sessions: await listSessions(),
    today: localDate(Date.now()),
  });
  const lastLine = h('p', { class: 'small', 'data-role': 'backup-last' }, backupAgeText(status));
  const canShareFiles = typeof navigator.canShare === 'function'
    && navigator.canShare({ files: [new File(['x'], 'x.txt', { type: 'text/plain' })] });
  const exportMsg = h('p', { class: 'small', 'data-role': 'export-msg' });
  const importError = h('div', { class: 'banner', 'data-role': 'import-error', hidden: true });
  const importSummary = h('div', { class: 'stack', 'data-role': 'import-summary' });
  const fileInput = h('input', { type: 'file', name: 'backup-file' });

  const showError = (text) => {
    importError.textContent = text;
    importError.hidden = false;
  };
  const clearPreview = () => {
    importError.hidden = true;
    importError.textContent = '';
    importSummary.replaceChildren();
  };

  const saved = async (now) => {
    await setSetting('lastBackupAt', now);
    lastLine.textContent = backupAgeText(backupStatus({ lastBackupAt: now, sessions: [], today: localDate(now) }));
  };

  const onDownload = async () => {
    const { text, now } = await exportText();
    const name = backupFileName(localDate(now), 'json');
    const url = URL.createObjectURL(new Blob([text], { type: 'application/json' }));
    const a = h('a', { href: url, download: name });
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 10000);
    await saved(now);
    exportMsg.textContent = 'Arquivo salvo em Downloads: ' + name;
  };

  // Chrome on Android refuses application/json in the share sheet (NotAllowedError); text/plain is allowed.
  const onShare = async () => {
    const { text, now } = await exportText();
    const file = new File([text], backupFileName(localDate(now), 'txt'), { type: 'text/plain' });
    try {
      await navigator.share({ files: [file], title: 'Backup do app Academia' });
      await saved(now);
      exportMsg.textContent = '';
    } catch (err) {
      if (err && err.name === 'AbortError') return; // the user closed the sheet
      exportMsg.textContent = 'Não deu para compartilhar. Use "Baixar arquivo".';
    }
  };

  const onConfirm = (doc) => async (e) => {
    const button = e.currentTarget;
    button.disabled = true;
    try {
      // the draft is never exported, so a restore over an open workout would silently drop it
      if (await getActive()) {
        button.disabled = false;
        return showError(OPEN_WORKOUT);
      }
      await replaceStores(prepareRestore(doc, Date.now()));
      await requestPersist(); // a restored phone never went through onboarding, where this is normally asked
      location.hash = '#/hoje';
    } catch {
      button.disabled = false;
      showError('Não foi possível restaurar. Seus dados atuais não foram alterados.');
    }
  };

  const onFile = async () => {
    clearPreview();
    const file = fileInput.files && fileInput.files[0];
    if (!file) return;
    if (file.size > MAX_BYTES) return showError('Arquivo grande demais para ser um backup deste app.');
    const parsed = parseBackup(await file.text(), SCHEMA_VERSION);
    if (!parsed.ok) return showError(parsed.error);
    const summaryLine = h('p', { 'data-role': 'summary-line' }, backupSummary(parsed.doc));
    if (await getActive()) {
      importSummary.replaceChildren(summaryLine);
      return showError(OPEN_WORKOUT);
    }
    importSummary.replaceChildren(
      summaryLine,
      h('button', { class: 'btn btn-big btn-primary', 'data-action': 'confirm-import', onclick: onConfirm(parsed.doc) }, 'Restaurar este backup'),
      h('button', {
        class: 'btn', 'data-action': 'cancel-import',
        onclick: () => { fileInput.value = ''; clearPreview(); },
      }, 'Cancelar'));
  };
  fileInput.addEventListener('change', onFile);

  return h('div', { class: 'screen', 'data-screen': 'backup' },
    h('div', { class: 'topbar' }, h('h1', { class: 'title' }, 'Backup')),
    h('div', { class: 'card stack' },
      h('strong', null, 'Salvar uma cópia'),
      h('p', { class: 'muted small' }, 'Seus treinos ficam só neste celular. Guarde uma cópia no Drive ou no WhatsApp: se trocar de celular ou limpar os dados do Chrome, você restaura daqui.'),
      lastLine,
      canShareFiles
        ? h('button', { class: 'btn btn-big btn-primary', 'data-action': 'export-share', onclick: onShare }, 'Enviar (Drive, WhatsApp…)')
        : null,
      h('button', {
        class: canShareFiles ? 'btn' : 'btn btn-big btn-primary', 'data-action': 'export-download', onclick: onDownload,
      }, 'Baixar arquivo'),
      exportMsg,
      h('p', { class: 'muted small' }, 'O arquivo não tem fotos. Guarde no Drive ou mande para você mesmo no WhatsApp.')),
    h('div', { class: 'card stack' },
      h('strong', null, 'Restaurar um backup'),
      h('p', { class: 'muted small' }, 'Restaurar substitui todos os dados deste celular pelos do arquivo.'),
      fileInput,
      importError,
      importSummary),
    h('div', { class: 'bottom-bar' },
      h('button', {
        class: 'btn btn-big', 'data-action': 'home',
        onclick: () => { location.hash = onboarded ? '#/hoje' : '#/inicio'; },
      }, 'Voltar')));
}
