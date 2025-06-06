/**
 * @license Copyright 2019 Google Inc. All Rights Reserved.
 * Licensed under the Apache License, Version 2.0 (the "License"); you may not use this file except in compliance with the License. You may obtain a copy of the License at http://www.apache.org/licenses/LICENSE-2.0
 * Unless required by applicable law or agreed to in writing, software distributed under the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the License for the specific language governing permissions and limitations under the License.
 */
'use strict';

/* eslint-env jest, browser */

const fs = require('fs');
const os = require('os');
const path = require('path');
const puppeteer = require('puppeteer');
const {configureToMatchImageSnapshot} = require('jest-image-snapshot');
const {createServer} = require('../src/server.js');
const preactRender = require('preact').render;
const testingLibrary = require('@testing-library/dom');

const CLI_PATH = path.join(__dirname, '../src/cli.js');

/** @typedef {import('../src/server').ServerInstance & {sqlFile?: string}} ServerInstance */

/** @type {Array<ServerInstance>} */
const servers = [];
const renderedComponents = new Set();

/** @param {string} [sqlFile] */
async function createTestServer(sqlFile) {
  if (!sqlFile) {
    sqlFile = `cli-test-${Math.round(Math.random() * 1e9)}.tmp.sql`;
  }

  const options = {
    port: 0,
    logLevel: /** @type {'silent'} */ ('silent'),
    storage: {
      storageMethod: /** @type {'sql'} */ ('sql'),
      sqlDialect: /** @type {'sqlite'} */ ('sqlite'),
      sqlDatabasePath: sqlFile,
    },
  };

  /** @type {ServerInstance} */
  const server = await createServer(options);
  server.sqlFile = sqlFile;
  servers.push(server);
  return server;
}

/**
 * @return {{projects: Array<LHCI.ServerCommand.Project>, builds: Array<LHCI.ServerCommand.Build>, runs: Array<LHCI.ServerCommand.Run>}}
 */
function createActualTestDataset() {
  /** @param {string} variant @return {any} */
  const lhr = variant => {
    const lhr = require(`./fixtures/${variant}`);
    if (lhr.lighthouseVersion === '5.6.0') {
      delete lhr.audits['total-blocking-time'];
      delete lhr.audits['largest-contentful-paint'];
    }

    return JSON.stringify(lhr);
  };
  /** @param {number} delta */
  const runAt = delta =>
    new Date(
      new Date('2025-01-01T11:00:00.000Z').getTime() + delta * 24 * 60 * 60 * 1000
    ).toISOString();
  const url = 'http://lhci.example.com/';
  const baseProject = {externalUrl: '', baseBranch: '', token: '', adminToken: '', slug: ''};
  const baseRun = {projectId: '0', representative: false, url};
  const baseBuild = {
    projectId: '0',
    lifecycle: /** @type {'unsealed'} */ ('unsealed'),
    branch: 'master',
    externalBuildUrl: '',
    author: 'Patrick Hulce <patrick@example.com>',
    avatarUrl: 'https://avatars1.githubusercontent.com/u/2301202?s=460&v=4',
    ancestorHash: '',
  };

  return {
    projects: [{...baseProject, id: '0', name: 'Lighthouse Real-World'}],
    builds: [
      {...baseBuild, id: '0', hash: '1234', commitMessage: 'build 1', runAt: runAt(1)},
      {...baseBuild, id: '1', hash: '1236', commitMessage: 'build 2', runAt: runAt(2)},
      {...baseBuild, id: '2', hash: '1237', commitMessage: 'build 3', runAt: runAt(3)},
      {...baseBuild, id: '3', hash: '1238', commitMessage: 'build 4', runAt: runAt(4)},
      {...baseBuild, id: '4', hash: '1239', commitMessage: 'build 5', runAt: runAt(5)},
      {...baseBuild, id: '5', hash: '1240', commitMessage: 'build 6', runAt: runAt(6)},
      {...baseBuild, id: '6', hash: '1241', commitMessage: 'build 7', runAt: runAt(7)},
      {...baseBuild, id: '7', hash: '1242', commitMessage: 'build 8', runAt: runAt(8)},
      {...baseBuild, id: '8', hash: '1243', commitMessage: 'build 9', runAt: runAt(9)},
      {...baseBuild, id: '9', hash: '1244', commitMessage: 'build 10', runAt: runAt(10)},
      {...baseBuild, id: '10', hash: '1245', commitMessage: 'build 11', runAt: runAt(11)},
      {...baseBuild, id: '11', hash: '1246', commitMessage: 'build 12', runAt: runAt(12)},
      {...baseBuild, id: '12', hash: '1247', commitMessage: 'build 13', runAt: runAt(13)},
      {...baseBuild, id: '13', hash: '1248', commitMessage: 'build 14', runAt: runAt(14)},
      {...baseBuild, id: '14', hash: '1249', commitMessage: 'build 15', runAt: runAt(15)},
      {...baseBuild, id: '15', hash: '1250', commitMessage: 'build 16', runAt: runAt(16)},
      {...baseBuild, id: '16', hash: '1251', commitMessage: 'build 17', runAt: runAt(17)},
      {...baseBuild, id: '17', hash: '1252', commitMessage: 'build 18', runAt: runAt(18)},
      {...baseBuild, id: '18', hash: '1253', commitMessage: 'build 19', runAt: runAt(19)},
      {...baseBuild, id: '19', hash: '1254', commitMessage: 'build 20', runAt: runAt(20)},
      {...baseBuild, id: '20', hash: '1255', commitMessage: 'build 21', runAt: runAt(21)},
      {...baseBuild, id: '21', hash: '1256', commitMessage: 'build 22', runAt: runAt(22)},
    ],
    runs: [
      {...baseRun, id: '0', buildId: '0', url, lhr: lhr('lh-5-6-0-verge-a.json')},
      {...baseRun, id: '1', buildId: '1', url, lhr: lhr('lh-5-6-0-verge-b.json')},
      {...baseRun, id: '2', buildId: '2', url, lhr: lhr('lh-6-0-0-coursehero-a.json')},
      {...baseRun, id: '3', buildId: '3', url, lhr: lhr('lh-6-0-0-coursehero-b.json')},
      {...baseRun, id: '4', buildId: '4', url, lhr: lhr('lh-6-2-0-coursehero-a.json')},
      {...baseRun, id: '5', buildId: '5', url, lhr: lhr('lh-6-2-0-coursehero-b.json')},
      {...baseRun, id: '6', buildId: '6', url, lhr: lhr('lh-6-4-1-coursehero-a.json')},
      {...baseRun, id: '7', buildId: '7', url, lhr: lhr('lh-6-4-1-coursehero-b.json')},
      {...baseRun, id: '8', buildId: '8', url, lhr: lhr('lh-7-0-0-coursehero-a.json')},
      {...baseRun, id: '9', buildId: '9', url, lhr: lhr('lh-7-0-0-coursehero-b.json')},
      {...baseRun, id: '10', buildId: '10', url, lhr: lhr('lh-8-0-0-coursehero-a.json')},
      {...baseRun, id: '11', buildId: '11', url, lhr: lhr('lh-8-0-0-coursehero-b.json')},
      {...baseRun, id: '12', buildId: '12', url, lhr: lhr('lh-9-3-0-coursehero-a.json')},
      {...baseRun, id: '13', buildId: '13', url, lhr: lhr('lh-9-3-0-coursehero-b.json')},
      {...baseRun, id: '14', buildId: '14', url, lhr: lhr('lh-10-1-0-coursehero-a.json')},
      {...baseRun, id: '15', buildId: '15', url, lhr: lhr('lh-10-1-0-coursehero-b.json')},
      {...baseRun, id: '16', buildId: '16', url, lhr: lhr('lh-11-4-0-coursehero-a.json')},
      {...baseRun, id: '17', buildId: '17', url, lhr: lhr('lh-11-4-0-coursehero-b.json')},
      {...baseRun, id: '18', buildId: '18', url, lhr: lhr('lh-12-0-0-coursehero-a.json')},
      {...baseRun, id: '19', buildId: '19', url, lhr: lhr('lh-12-0-0-coursehero-b.json')},
      {...baseRun, id: '20', buildId: '20', url, lhr: lhr('lh-12-6-1-coursehero-a.json')},
      {...baseRun, id: '21', buildId: '21', url, lhr: lhr('lh-12-6-1-coursehero-b.json')},
    ],
  };
}

/**
 *
 * @param {LHCI.PreactNode} preactNodeToRender
 * @param {{container?: HTMLElement}} context
 */
function render(preactNodeToRender, {container} = {}) {
  if (!container) {
    container = document.body.appendChild(document.createElement('div'));
  }

  renderedComponents.add(container);
  preactRender(preactNodeToRender, container);

  return {
    container,
    ...testingLibrary.getQueriesForElement(container),
  };
}

function cleanup() {
  for (const container of renderedComponents) {
    preactRender('', document.body, container);
  }

  if (servers.length > 1) throw new Error('Cannot have multiple servers in same jest context');

  for (const server of servers) {
    if (server.sqlFile && fs.existsSync(server.sqlFile)) fs.unlinkSync(server.sqlFile);
    server.close();
  }
}

/** @param {LHCI.E2EState} state */
async function cleanupE2E(state) {
  if (state.browser) {
    await state.browser.close();
  }

  if (state.server) {
    await state.server.close();
  }
}

/**
 * @param {import('puppeteer').Page} page
 * @return {Promise<void>}
 */
function waitForNetworkIdle0(page) {
  /** @type {NodeJS.Timeout} */
  let idleTimeout;
  let inflight = 0;

  return new Promise((resolve, reject) => {
    const timeoutTimeout = setTimeout(() => {
      reject(new Error('Timed out'));
      cleanup();
    }, 30000);

    const requestListener = () => {
      clearTimeout(idleTimeout);
      inflight++;
    };

    const responseListener = () => {
      inflight--;
      if (inflight !== 0) return;
      idleTimeout = setTimeout(() => {
        resolve();
        cleanup();
      }, 500);
    };

    const cleanup = () => {
      page.removeListener('request', requestListener);
      page.removeListener('response', responseListener);
      clearTimeout(timeoutTimeout);
    };

    page.on('request', requestListener);
    page.on('response', responseListener);
  });
}

/** @param {import('puppeteer').Page} page */
async function waitForAllImages(page) {
  await page.evaluate(async () => {
    const selectors = Array.from(document.querySelectorAll('img'));
    await Promise.all(
      selectors.map(img => {
        if (img.complete) return;
        return new Promise((resolve, reject) => {
          img.addEventListener('load', resolve);
          img.addEventListener('error', reject);
        });
      })
    );
  });
}

/**
 * @type {any}
 * @param {Document | Element | Window} element
 * @param {Event} evt
 */
const dispatchEvent = (element, evt) => testingLibrary.fireEvent(element, evt);

Object.keys(testingLibrary.fireEvent).forEach(key => {
  /**  @param {Document | Element | Window} element  @param {Event} evt */
  dispatchEvent[key] = (element, evt) => {
    testingLibrary.fireEvent(element, evt);
    return new Promise(resolve => process.nextTick(resolve));
  };
});

const wait = testingLibrary.wait;

const prettyDOM = testingLibrary.prettyDOM;

/** PrettyDOM but without the color control characters. */
/** @param {HTMLElement} el @param {number} maxLength */
const snapshotDOM = (el, maxLength) => {
  const prettified = prettyDOM(el, maxLength);
  if (!prettified) return prettified;
  return prettified.replace(/\[\d{1,2}m/g, '');
};

/** @param {'5.6.0'|'7.0.0'} version_ @param {'verge'|'coursehero'|'coursehero-perf'} site @param {'a'|'b'} variant  */
function getTestLHRPath(version_, site, variant) {
  const version = version_.replace(/\./g, '-');
  return path.join(__dirname, 'fixtures', `lh-${version}-${site}-${variant}.json`);
}

module.exports = {
  CLI_PATH,
  createTestServer,
  render,
  cleanup,
  cleanupE2E,
  wait,
  dispatchEvent,
  prettyDOM,
  snapshotDOM,
  waitForNetworkIdle0,
  waitForAllImages,
  // Utils for E2E tests
  getTestLHRPath,
  createActualTestDataset,
  shouldRunE2E: () => Boolean(!process.env.CI || os.platform() === 'darwin'),
  emptyTest: () => it.skip('not enabled', () => {}),
  setupImageSnapshots: () => {
    const toMatchImageSnapshot = configureToMatchImageSnapshot({
      // TODO: Why does CI have slightly different sizes?
      // @ts-expect-error: need to update jest, @types/jest
      allowSizeMismatch: true,
      // TODO: upgrading from chrome 77->98 resulted in tons of color deltas in CI.
      failureThreshold: process.env.CI ? 0.05 : 0.001,
      // FIXME: we're more forgiving in CI where font rendering creates small changes.,
      // failureThreshold: process.env.CI ? 0.005 : 0.001,
      failureThresholdType: 'percent',
      // On -u dont update files that are already fine. This should match the default but...
      // we've seen behavior which seemingly conflicts.
      updatePassedSnapshot: false,
    });

    expect.extend({toMatchImageSnapshot});
  },
  /** @param {LHCI.E2EState} state */
  launchBrowser: async state => {
    state.browser = await puppeteer.launch({
      headless: state.debug ? false : 'new',
      slowMo: state.debug ? 250 : undefined,
      devtools: state.debug,
      env: {...process.env, TZ: 'America/Chicago'},
    });
    state.page = await state.browser.newPage();
    await state.page.setViewport({width: 1440, height: 900});
  },
};
