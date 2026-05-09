/*
 * Copyright (C) Contributors to the Suwayomi project
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */

import type { CssVarsThemeOptions } from '@mui/material/styles';
import { t } from '@lingui/core/macro';

export type TBaseTheme = {
    isCustom: boolean;
    getName: () => string;
    muiTheme: Omit<CssVarsThemeOptions, 'activeMode'>;
};

export const themes = {
    default: {
        isCustom: false,
        getName: () => t`Default`,
        muiTheme: {
            colorSchemes: {
                light: {
                    palette: {
                        primary: {
                            main: '#5b74ef',
                        },
                        secondary: {
                            main: '#efd65b',
                        },
                    },
                },
                dark: {
                    palette: {
                        primary: {
                            main: '#5b74ef',
                        },
                        secondary: {
                            main: '#efd65b',
                        },
                    },
                },
            },
        },
    },
    lavender: {
        isCustom: false,
        getName: () => t`Lavender`,
        muiTheme: {
            colorSchemes: {
                light: {
                    palette: {
                        primary: {
                            main: '#6D41C8',
                        },
                        secondary: {
                            main: '#9bc841',
                        },
                        background: {
                            paper: '#E4D5F8',
                            default: '#EDE2FF',
                        },
                    },
                },
                dark: {
                    palette: {
                        primary: {
                            main: '#a076fd',
                        },
                        secondary: {
                            main: '#d2fd76',
                        },
                        background: {
                            paper: '#1d193b',
                            default: '#111129',
                        },
                    },
                },
            },
        },
    },
    dune: {
        isCustom: false,
        getName: () => t`Dune`,
        muiTheme: {
            colorSchemes: {
                light: {
                    palette: {
                        primary: {
                            main: '#897869',
                        },
                        secondary: {
                            main: '#697a89',
                        },
                    },
                },
                dark: {
                    palette: {
                        primary: {
                            main: '#897869',
                        },
                        secondary: {
                            main: '#697a89',
                        },
                    },
                },
            },
        },
    },
    rosegold: {
        isCustom: false,
        getName: () => t`Rosegold`,
        muiTheme: {
            colorSchemes: {
                light: {
                    palette: {
                        primary: {
                            main: '#C07F7A',
                        },
                        secondary: {
                            main: '#7ABBC0',
                        },
                        background: {
                            paper: '#EAE1E0',
                            default: '#F3EFEE',
                        },
                    },
                },
                dark: {
                    palette: {
                        primary: {
                            main: '#E9A7A1',
                        },
                        secondary: {
                            main: '#A1E3E9',
                        },
                    },
                },
            },
        },
    },
    'forest dew': {
        isCustom: false,
        getName: () => t`Forest Dew`,
        muiTheme: {
            colorSchemes: {
                light: {
                    palette: {
                        primary: {
                            main: '#53a584',
                        },
                        secondary: {
                            main: '#a55374',
                        },
                    },
                },
                dark: {
                    palette: {
                        primary: {
                            main: '#53a584',
                        },
                        secondary: {
                            main: '#a55374',
                        },
                    },
                },
            },
        },
    },
    'montain sunset': {
        isCustom: false,
        getName: () => t`Mountain Sunset`,
        muiTheme: {
            colorSchemes: {
                light: {
                    palette: {
                        primary: {
                            main: '#974258',
                        },
                        secondary: {
                            main: '#429780',
                        },
                        background: {
                            paper: '#e5d6da',
                            default: '#f7f3f4',
                        },
                    },
                },
                dark: {
                    palette: {
                        primary: {
                            main: '#c55a77',
                        },
                        secondary: {
                            main: '#5ac5a8',
                        },
                    },
                },
            },
        },
    },
    crimson: {
        isCustom: false,
        getName: () => t`Crimson`,
        muiTheme: {
            colorSchemes: {
                light: {
                    palette: {
                        primary: {
                            main: '#DC143C',
                        },
                        secondary: {
                            main: '#14DCB4',
                        },
                    },
                },
                dark: {
                    palette: {
                        primary: {
                            main: '#DC143C',
                        },
                        secondary: {
                            main: '#14DCB4',
                        },
                    },
                },
            },
        },
    },
    'minty miracles': {
        isCustom: false,
        getName: () => t`Minty Miracles`,
        muiTheme: {
            colorSchemes: {
                light: {
                    palette: {
                        primary: {
                            main: '#00c56a',
                        },
                        secondary: {
                            main: '#c5005c',
                        },
                        background: {
                            paper: '#d6eae0',
                            default: '#e9f3ee',
                        },
                    },
                },
                dark: {
                    palette: {
                        primary: {
                            main: '#5CE6A1',
                        },
                        secondary: {
                            main: '#E65CA1',
                        },
                    },
                },
            },
        },
    },
    'orange juice': {
        isCustom: false,
        getName: () => t`Orange Juice`,
        muiTheme: {
            colorSchemes: {
                light: {
                    palette: {
                        primary: {
                            main: '#e74c00',
                        },
                        secondary: {
                            main: '#009ae7',
                        },
                        background: {
                            paper: '#ede3d3',
                            default: '#f5f0e8',
                        },
                    },
                },
                dark: {
                    palette: {
                        primary: {
                            main: '#ffb546',
                        },
                        secondary: {
                            main: '#4690ff',
                        },
                    },
                },
            },
        },
    },
    'bright pink': {
        isCustom: false,
        getName: () => t`Bright Pink`,
        muiTheme: {
            colorSchemes: {
                light: {
                    palette: {
                        primary: {
                            main: '#FF007F',
                        },
                        secondary: {
                            main: '#00FF80',
                        },
                    },
                },
                dark: {
                    palette: {
                        primary: {
                            main: '#FF007F',
                        },
                        secondary: {
                            main: '#00FF80',
                        },
                    },
                },
            },
        },
    },
    veronica: {
        isCustom: false,
        getName: () => t`Veronica`,
        muiTheme: {
            colorSchemes: {
                light: {
                    palette: {
                        primary: {
                            main: '#A020F0',
                        },
                        secondary: {
                            main: '#70F020',
                        },
                    },
                },
                dark: {
                    palette: {
                        primary: {
                            main: '#A020F0',
                        },
                        secondary: {
                            main: '#70F020',
                        },
                    },
                },
            },
        },
    },
    'tree frog green': {
        isCustom: false,
        getName: () => t`Tree Frog Green`,
        muiTheme: {
            colorSchemes: {
                light: {
                    palette: {
                        primary: {
                            main: '#4f9513',
                        },
                        secondary: {
                            main: '#581395',
                        },
                        background: {
                            paper: '#dde6d0',
                            default: '#edf1e6',
                        },
                    },
                },
                dark: {
                    palette: {
                        primary: {
                            main: '#8ace31',
                        },
                        secondary: {
                            main: '#7531CE',
                        },
                    },
                },
            },
        },
    },
    'ying and yang': {
        isCustom: false,
        getName: () => t`Ying & Yang`,
        muiTheme: {
            colorSchemes: {
                light: {
                    palette: {
                        primary: {
                            main: '#000',
                        },
                        secondary: {
                            main: '#fff',
                        },
                        background: {
                            paper: '#efefef',
                            default: '#fff',
                        },
                    },
                },
                dark: {
                    palette: {
                        primary: {
                            main: '#fff',
                        },
                        secondary: {
                            main: '#000',
                        },
                    },
                },
            },
        },
    },
    sage: {
        // Companion theme to the Suwayomi-WebUI redesign — "Plex with personality":
        // sage-green accent on a cool deep-gray base, Geist Sans + Geist Mono throughout,
        // hairline-soft borders, image-forward content. Designed for dark mode; the light
        // scheme is provided for completeness but mirrors the dark palette.
        isCustom: false,
        getName: () => t`Sage`,
        muiTheme: {
            typography: {
                fontFamily: '"Geist", system-ui, -apple-system, sans-serif',
                fontWeightLight: 300,
                fontWeightRegular: 400,
                fontWeightMedium: 500,
                fontWeightBold: 600,
                // Mono family — referenced via theme.typography.monospace.fontFamily
                // in components that show numerals, eyebrow labels, and meta text.
                // ThemeFontLoader extracts this nested fontFamily + weights and pulls
                // Geist Mono from Google Fonts at startup.
                monospace: {
                    fontFamily: '"Geist Mono", ui-monospace, "SF Mono", monospace',
                    fontWeightRegular: 400,
                    fontWeightMedium: 500,
                },
            },
            colorSchemes: {
                light: {
                    palette: {
                        primary: {
                            main: '#5a8a78',
                        },
                        secondary: {
                            main: '#7a7e88',
                        },
                        background: {
                            paper: '#f4f1ea',
                            default: '#faf8f3',
                        },
                    },
                },
                dark: {
                    palette: {
                        primary: {
                            main: '#92c4b5',
                            light: '#a9d4c7',
                            dark: '#6fa193',
                        },
                        secondary: {
                            main: '#7a7e88',
                        },
                        background: {
                            paper: '#14181f',
                            default: '#0d0f13',
                        },
                    },
                },
            },
        },
    },
} as const satisfies Record<string, TBaseTheme>;
