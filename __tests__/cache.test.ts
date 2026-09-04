jest.mock('localforage', () => {
    const store = new Map<string, unknown>();

    return {
        __store: store,
        config: jest.fn(),
        getItem: jest.fn(async (key: string) =>
            store.has(key) ? store.get(key) : null
        ),
        setItem: jest.fn(async (key: string, value: unknown) => {
            store.set(key, value);
            return value;
        }),
        removeItem: jest.fn(async (key: string) => {
            store.delete(key);
        }),
        keys: jest.fn(async () => [...store.keys()]),
        clear: jest.fn(async () => {
            store.clear();
        }),
    };
});

import localforage from 'localforage';
import { DEFAULT_APPEARANCE } from '../src/appearance';
import {
    apiBootstrapCacheKey,
    appearanceKey,
    clearCache,
    getAppearance,
    getStyle,
    hideDetailsKey,
    statPreferencesKey,
    styleKey,
} from '../src/hooks/Cache';

const store = (
    localforage as typeof localforage & {
        __store: Map<string, unknown>;
    }
).__store;

beforeEach(() => {
    store.clear();
    jest.clearAllMocks();
});

describe('getStyle', () => {
    test('returns each valid stored style unchanged', async () => {
        for (const style of [
            'default',
            'clean',
            'clean-left',
            'clean-default',
        ]) {
            store.set(styleKey, style);
            await expect(getStyle()).resolves.toBe(style);
        }
    });

    test('returns the default style for invalid stored values', async () => {
        for (const value of [null, '', 'bogus', 42, true, {}, []]) {
            store.set(styleKey, value);
            await expect(getStyle()).resolves.toBe('default');
        }
    });
});

describe('getAppearance', () => {
    test('returns defaults when no appearance is stored', async () => {
        await expect(getAppearance()).resolves.toEqual(DEFAULT_APPEARANCE);
    });

    test('normalizes a partially invalid stored appearance', async () => {
        store.set(appearanceKey, {
            barAlpha: 500,
            linkColor: 'unknown',
        });

        await expect(getAppearance()).resolves.toEqual({
            ...DEFAULT_APPEARANCE,
            barAlpha: 100,
            linkColor: 'steam',
        });
    });
});

describe('clearCache', () => {
    test('preserves preference keys and removes cached data', async () => {
        const preferences = new Map<string, unknown>([
            [styleKey, 'clean'],
            [hideDetailsKey, true],
            [statPreferencesKey, { main: false }],
            [appearanceKey, { custom: true }],
        ]);
        for (const [key, value] of preferences) {
            store.set(key, value);
        }
        store.set(apiBootstrapCacheKey, { token: 'cached' });
        store.set('12345', { mainStory: 10 });
        store.set('67890', { mainStory: 20 });

        await clearCache();

        for (const [key, value] of preferences) {
            expect(store.get(key)).toEqual(value);
        }
        expect(store.has(apiBootstrapCacheKey)).toBe(false);
        expect(store.has('12345')).toBe(false);
        expect(store.has('67890')).toBe(false);
        expect(localforage.clear).not.toHaveBeenCalled();
    });

    test('resolves for an empty store without clearing it', async () => {
        await expect(clearCache()).resolves.toBeUndefined();

        expect(localforage.clear).not.toHaveBeenCalled();
    });
});
