/*
 * Copyright (C) Contributors to the Suwayomi project
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */

import '@mui/material/styles';

declare module '@mui/material/styles' {
    interface CssThemeVariables {
        enabled: true;
    }

    // Re-exported here because MUI doesn't include PaletteBackgroundChannel in its public API surface.
    // Defined in @mui/material/esm/styles/createThemeFoundation.d.ts
    export interface PaletteBackgroundChannel {
        defaultChannel: string;
        paperChannel: string;
    }

    // Custom monospace typography slot. Themes may set
    // `typography.monospace.fontFamily` (and weight variants) so the
    // ThemeFontLoader picks them up at startup; components consume it
    // via `theme.typography.monospace.fontFamily` in their `sx` props.
    interface MonospaceTypography {
        fontFamily: string;
        fontWeightRegular?: number;
        fontWeightMedium?: number;
    }
    interface TypographyVariantsOptions {
        monospace?: Partial<MonospaceTypography>;
    }
    interface TypographyVariants {
        monospace: MonospaceTypography;
    }
}
