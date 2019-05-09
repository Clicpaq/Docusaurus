/**
 * Copyright (c) 2017-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
import {matchRoutes} from 'react-router-config';
import routesChunkNames from '@generated/routesChunkNames';
import routes from '@generated/routes';
import prefetchHelper from './prefetch';
import preloadHelper from './preload';
import flat from './flat';

const fetched = {};

const canPrefetchOrLoad = routePath => {
  // if user is on slow or constrained connection
  if (`connection` in navigator) {
    if ((navigator.connection.effectiveType || ``).includes(`2g`)) {
      return false;
    }
    if (navigator.connection.saveData) {
      return false;
    }
  }
  return !fetched[routePath];
};

const docusaurus = {
  prefetch: routePath => {
    if (!canPrefetchOrLoad(routePath)) {
      return false;
    }

    // Find all webpack chunk names needed
    const matches = matchRoutes(routes, routePath);
    const chunkNamesNeeded = matches.reduce((arr, match) => {
      const chunk = routesChunkNames[match.route.path];
      if (!chunk) {
        return arr;
      }

      const chunkNames = Object.values(flat(chunk));
      return arr.concat(chunkNames);
    }, []);

    // Prefetch all webpack chunk assets file needed
    const chunkAssetsNeeded = chunkNamesNeeded.reduce((arr, chunkName) => {
      const chunkAssets = window.__chunkMapping[chunkName] || [];
      return arr.concat(chunkAssets);
    }, []);
    const dedupedChunkAssets = Array.from(new Set(chunkAssetsNeeded));
    Promise.all(dedupedChunkAssets.map(prefetchHelper)).then(() => {
      fetched[routePath] = true;
    });
    return true;
  },
  preload: routePath => {
    if (!canPrefetchOrLoad(routePath)) {
      return false;
    }
    fetched[routePath] = true;
    preloadHelper(routes, routePath);
    return true;
  },
};

export default docusaurus;
