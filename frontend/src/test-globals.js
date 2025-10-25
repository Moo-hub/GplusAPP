// Auto-generated test globals loader
// This file imports commonly used components/screens and assigns them to
// globalThis so legacy tests that rely on globals instead of imports still
// work during migration. Keep this list minimal and expand as needed.

import React from 'react';
import { createRequire } from 'module';
import path from 'path';

// Helper to try multiple candidate module paths and return the first that
// resolves. We prefer CommonJS `require` for synchronous resolution in the
// test bootstrap; try multiple strategies (absolute CJS require, local
// require, then dynamic import) so this loader works across worker shapes.
const tryResolve = async (candidates) => {
  if (!Array.isArray(candidates)) return null;
  // create a CJS require bound to the workspace package.json when possible
  let rq = null;
  try {
    rq = createRequire && createRequire(path.resolve(process.cwd(), 'package.json'));
  } catch (e) {
    rq = null;
  }

  for (const p of candidates) {
    // 1) Try multiple absolute CJS resolution prefixes under workspace
    try {
      if (rq) {
        const candidatesAbs = [
          path.resolve(process.cwd(), 'src', p.replace(/^\.\/?/, '')),
          path.resolve(process.cwd(), 'frontend', 'src', p.replace(/^\.\/?/, '')),
          path.resolve(process.cwd(), p.replace(/^\.\/?/, '')),
          path.resolve(process.cwd(), 'frontend', p.replace(/^\.\/?/, '')),
        ];
        for (const abs of candidatesAbs) {
          try {
            const m = rq(abs);
            if (m) return m && m.default ? m.default : m;
          } catch (e) {
            // continue
          }
        }
      }
    } catch (e) {}

    // 2) Try a local require using the provided path (may work in CJS workers)
    try {
      if (typeof require === 'function') {
        try {
          const m2 = require(p);
          if (m2) return m2 && m2.default ? m2.default : m2;
        } catch (e) {}
      }
    } catch (e) {}

    // 3) Finally try dynamic ESM import (async)
    try {
      const mod = await import(p);
      if (mod) return mod && mod.default ? mod.default : mod;
    } catch (e) {
      // ignore and continue
    }
  }
  return null;
};

// Map of globalName -> candidate paths to try (keeps list small but
// sufficient for common repository layouts).
const resolveCandidates = {
  PointsScreen: ['./screens/Points/PointsScreen.jsx', './screens/PointsScreen.jsx', './components/screens/PointsScreen.jsx', './components/PointsScreen.jsx', './components/Points/index.jsx'],
  VehiclesScreen: ['./screens/Vehicles/VehiclesScreen.jsx', './screens/VehiclesScreen.jsx', './components/screens/VehiclesScreen.jsx', './components/VehiclesScreen.jsx'],
  Points: ['./components/Points.jsx', './components/Points/index.jsx'],
  PointsDashboard: ['./components/PointsDashboard.jsx', './components/PointsDashboard/index.jsx'],
  ApiPerformanceCard: ['./components/dashboard/ApiPerformanceCard.jsx', './components/ApiPerformanceCard.jsx'],
  MemoryUsageCard: ['./components/dashboard/MemoryUsageCard.jsx', './components/MemoryUsageCard.jsx'],
  PerformanceDashboard: ['./components/dashboard/PerformanceDashboard.jsx', './components/PerformanceDashboard.jsx'],
  RouteTracker: ['./components/RouteTracker.jsx'],
  ServiceWorkerWrapper: ['./components/ServiceWorkerWrapper.jsx'],
  Button: ['./components/Button.jsx'],
  Notifications: ['./components/Notifications.jsx'],
  Login: ['./components/Login.jsx', './components/auth/Login.jsx', './components/Login/index.jsx', './screens/Auth/Login.jsx'],
  Navigation: ['./components/Navigation.jsx', './components/Nav/Navigation.jsx', './components/navigation/Navigation.jsx'],
  NotFound: ['./components/NotFound.jsx', './components/NotFound/index.jsx', './components/NotFound/NotFound.jsx'],
  Pickup: ['./components/Pickup.jsx', './components/pickup/Pickup.jsx', './components/Pickup/index.jsx'],
  PickupSchedule: ['./components/PickupSchedule.jsx', './components/pickup/PickupSchedule.jsx', './components/PickupSchedule/index.jsx'],
  PaymentScreen: ['./screens/PaymentScreen.jsx', './components/PaymentScreen.jsx', './screens/Payment/index.jsx', './components/screens/PaymentScreen.jsx'],
  RequestPickupScreen: ['./screens/RequestPickupScreen.jsx', './components/RequestPickupScreen.jsx', './screens/Request/index.jsx'],
};

const resolved = {};
// Resolve synchronously (top-level await) so setupTests' import of this
// module completes only after globals have been assigned.
for (const [name, paths] of Object.entries(resolveCandidates)) {
  try {
    // await tryResolve so module evaluation waits
    // eslint-disable-next-line no-await-in-loop
    // (we intentionally await each resolution sequentially; it's fast)
    // Note: top-level await is supported in Vite test environment.
    // @ts-ignore
    resolved[name] = await tryResolve(paths);
  } catch (e) {
    resolved[name] = null;
  }
}

// Assign to globals if not already set by setupTests auto-expose
try {
  if (typeof globalThis !== 'undefined') {
    // Overwrite auto-generated stubs (marked with __isAutoStub) so the
    // real imported components replace earlier last-resort stubs when
    // available. Otherwise, only assign when the global is undefined.
    const assignIfReal = (globalName, value) => {
      try {
        const existing = globalThis[globalName];
        const isStub = existing && existing.__isAutoStub;
        // Only overwrite when we actually resolved a real value. If the
        // resolver returned null/undefined, keep the existing stub so
        // tests that rely on it continue to work.
        if (value) {
          if (!existing || isStub) {
            try { globalThis[globalName] = value; } catch (e) { globalThis[globalName] = value; }
            // Create a top-level binding for legacy tests that reference
            // the identifier directly (e.g. `Login` instead of
            // `globalThis.Login`). Using Function to assign into the
            // module/global scope is fragile but effective in Vitest
            // workers where tests expect bare globals.
            try { Function(`${globalName} = globalThis.${globalName}`)(); } catch (e) {}
          }
        }
      } catch (e) {}
    };

  assignIfReal('PointsScreen', resolved.PointsScreen || null);
  assignIfReal('VehiclesScreen', resolved.VehiclesScreen || null);
  assignIfReal('Points', resolved.Points || null);
  assignIfReal('PointsDashboard', resolved.PointsDashboard || null);
  assignIfReal('ApiPerformanceCard', resolved.ApiPerformanceCard || null);
  assignIfReal('MemoryUsageCard', resolved.MemoryUsageCard || null);
  assignIfReal('PerformanceDashboard', resolved.PerformanceDashboard || null);
  assignIfReal('RouteTracker', resolved.RouteTracker || null);
  assignIfReal('ServiceWorkerWrapper', resolved.ServiceWorkerWrapper || null);
  assignIfReal('Button', resolved.Button || null);
  assignIfReal('Notifications', resolved.Notifications || null);
  assignIfReal('Login', resolved.Login || null);
  assignIfReal('Navigation', resolved.Navigation || null);
  assignIfReal('NotFound', resolved.NotFound || null);
  assignIfReal('PaymentScreen', resolved.PaymentScreen || null);
  assignIfReal('RequestPickupScreen', resolved.RequestPickupScreen || null);
  assignIfReal('Pickup', resolved.Pickup || null);
  assignIfReal('PickupSchedule', resolved.PickupSchedule || null);
  }
} catch (e) {
  // best-effort; don't crash tests if some imports fail
}
