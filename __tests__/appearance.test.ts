import {
    Appearance,
    DEFAULT_APPEARANCE,
    normalizeAppearance,
    toStyleVars,
} from '../src/appearance';

describe('toStyleVars', () => {
    test('returns no variables when custom appearance is disabled', () => {
        expect(
            toStyleVars({
                custom: false,
                barAlpha: 0,
                linkColor: 'text',
                textShadow: true,
                textScale: 150,
                border: false,
            })
        ).toEqual({});
    });

    test('returns no variables for enabled default values', () => {
        expect(toStyleVars({ ...DEFAULT_APPEARANCE, custom: true })).toEqual(
            {}
        );
    });

    test('emits non-default bar alpha values', () => {
        expect(
            toStyleVars({
                ...DEFAULT_APPEARANCE,
                custom: true,
                barAlpha: 50,
            })
        ).toEqual({ '--hltb-bar-alpha': '0.5' });
        expect(
            toStyleVars({
                ...DEFAULT_APPEARANCE,
                custom: true,
                barAlpha: 0,
            })
        ).toEqual({ '--hltb-bar-alpha': '0' });
    });

    test('emits the text link color but not the Steam link color', () => {
        expect(
            toStyleVars({
                ...DEFAULT_APPEARANCE,
                custom: true,
                linkColor: 'text',
            })
        ).toEqual({
            '--hltb-link-color': 'currentColor',
        });
        expect(
            toStyleVars({
                ...DEFAULT_APPEARANCE,
                custom: true,
                linkColor: 'steam',
            })
        ).toEqual({});
    });

    test('emits text shadow only when enabled', () => {
        expect(
            toStyleVars({
                ...DEFAULT_APPEARANCE,
                custom: true,
                textShadow: true,
            })
        ).toEqual({
            '--hltb-text-shadow': '0 1px 3px rgba(0, 0, 0, 0.9)',
        });
        expect(
            toStyleVars({
                ...DEFAULT_APPEARANCE,
                custom: true,
                textShadow: false,
            })
        ).toEqual({});
    });

    test('emits a non-default text scale', () => {
        expect(
            toStyleVars({
                ...DEFAULT_APPEARANCE,
                custom: true,
                textScale: 150,
            })
        ).toEqual({ '--hltb-text-scale': '1.5' });
    });

    test('emits zero border width only when the border is disabled', () => {
        expect(
            toStyleVars({
                ...DEFAULT_APPEARANCE,
                custom: true,
                border: false,
            })
        ).toEqual({ '--hltb-border-width': '0' });
        expect(
            toStyleVars({
                ...DEFAULT_APPEARANCE,
                custom: true,
                border: true,
            })
        ).toEqual({});
    });

    test('emits exactly all five non-default properties', () => {
        expect(
            toStyleVars({
                custom: true,
                barAlpha: 0,
                linkColor: 'text',
                textShadow: true,
                textScale: 150,
                border: false,
            })
        ).toEqual({
            '--hltb-bar-alpha': '0',
            '--hltb-link-color': 'currentColor',
            '--hltb-text-shadow': '0 1px 3px rgba(0, 0, 0, 0.9)',
            '--hltb-text-scale': '1.5',
            '--hltb-border-width': '0',
        });
    });
});

describe('normalizeAppearance', () => {
    test('returns defaults for non-record values and arrays', () => {
        for (const value of [undefined, null, 'invalid', 42, []]) {
            expect(normalizeAppearance(value)).toEqual(DEFAULT_APPEARANCE);
        }
    });

    test('preserves a fully valid record', () => {
        const appearance: Appearance = {
            custom: true,
            barAlpha: 50,
            linkColor: 'text',
            textShadow: true,
            textScale: 125,
            border: false,
        };

        expect(normalizeAppearance(appearance)).toEqual(appearance);
    });

    test('uses field defaults for explicit undefined values', () => {
        expect(
            normalizeAppearance({
                custom: undefined,
                barAlpha: undefined,
                linkColor: undefined,
                textShadow: undefined,
                textScale: undefined,
                border: undefined,
            })
        ).toEqual(DEFAULT_APPEARANCE);
    });

    test('uses field defaults for wrong types', () => {
        expect(
            normalizeAppearance({
                custom: 1,
                barAlpha: '50',
                linkColor: true,
            })
        ).toEqual(DEFAULT_APPEARANCE);
    });

    test('uses field defaults for non-finite numbers', () => {
        expect(normalizeAppearance({ barAlpha: NaN }).barAlpha).toBe(
            DEFAULT_APPEARANCE.barAlpha
        );
        expect(normalizeAppearance({ barAlpha: Infinity }).barAlpha).toBe(
            DEFAULT_APPEARANCE.barAlpha
        );
        expect(normalizeAppearance({ textScale: NaN }).textScale).toBe(
            DEFAULT_APPEARANCE.textScale
        );
        expect(normalizeAppearance({ textScale: Infinity }).textScale).toBe(
            DEFAULT_APPEARANCE.textScale
        );
    });

    test('clamps values to their allowed ranges', () => {
        expect(normalizeAppearance({ barAlpha: -20 }).barAlpha).toBe(0);
        expect(normalizeAppearance({ barAlpha: 500 }).barAlpha).toBe(100);
        expect(normalizeAppearance({ textScale: 10 }).textScale).toBe(75);
        expect(normalizeAppearance({ textScale: 999 }).textScale).toBe(150);
    });

    test('snaps numeric values to steps of five', () => {
        expect(normalizeAppearance({ barAlpha: 63 }).barAlpha).toBe(65);
        expect(normalizeAppearance({ barAlpha: 62 }).barAlpha).toBe(60);
        expect(normalizeAppearance({ textScale: 101 }).textScale).toBe(100);
    });

    test('uses the default for an unknown link color', () => {
        expect(normalizeAppearance({ linkColor: 'unknown' }).linkColor).toBe(
            'steam'
        );
    });

    test('ignores unknown keys', () => {
        const appearance = normalizeAppearance({ extra: 'value' });

        expect(appearance).toEqual(DEFAULT_APPEARANCE);
        expect(appearance).not.toHaveProperty('extra');
    });
});
