/*
 * Copyright (C) Contributors to the Suwayomi project
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */

import { styled } from '@mui/material/styles';
import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';
import { useLingui } from '@lingui/react/macro';
import type { MangaCardMode } from '@/features/manga/Manga.types.ts';
import { MediaQuery } from '@/base/utils/MediaQuery.tsx';
import { useMetadataServerSettings } from '@/features/settings/services/ServerSettingsMetadata.ts';
import { MUIUtil } from '@/lib/mui/MUI.util.ts';

const BadgeContainer = styled('div')(({ theme }) => ({
    display: 'flex',
    height: 'fit-content',
    gap: theme.spacing(0.5),
}));

// Mono-numeral pill. Smaller, tabular-nums, rounded — designed to read like
// a status chip (matches the Sage redesign mockup) without changing the
// component's API. Themes that don't define `typography.monospace` fall back
// to the platform monospace stack.
const Badge = styled(Typography, { shouldForwardProp: (prop) => prop !== 'badgeColor' })<{
    badgeColor?: 'primary' | 'secondary';
}>(({ theme, badgeColor = 'primary' }) => ({
    fontFamily: theme.typography.monospace?.fontFamily ?? 'monospace',
    fontVariantNumeric: 'tabular-nums',
    fontSize: '0.8rem',
    fontWeight: 500,
    lineHeight: 1,
    paddingInline: theme.spacing(1),
    paddingBlock: theme.spacing(0.6),
    minWidth: theme.spacing(2.75),
    textAlign: 'center',
    borderRadius: 999,
    color: theme.palette[badgeColor].contrastText,
    backgroundColor: theme.palette[badgeColor].main,
}));

export const MangaBadges = ({
    inLibraryIndicator,
    updateLibraryState,
    isInLibrary,
    unread,
    downloadCount,
    mode,
}: {
    inLibraryIndicator?: boolean;
    updateLibraryState: () => void;
    isInLibrary: boolean;
    unread?: number;
    downloadCount?: number;
    mode: MangaCardMode;
}) => {
    const { t } = useLingui();

    const isTouchDevice = MediaQuery.useIsTouchDevice();

    const {
        settings: { showUnreadBadge, showDownloadBadge },
    } = useMetadataServerSettings();

    return (
        <BadgeContainer>
            {!isTouchDevice && inLibraryIndicator && mode === 'source' && (
                <Button
                    className="source-manga-library-state-button"
                    component="div"
                    variant="contained"
                    size="small"
                    {...MUIUtil.preventRippleProp()}
                    onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        updateLibraryState();
                    }}
                    sx={{
                        display: 'none',
                    }}
                    color={isInLibrary ? 'error' : 'primary'}
                >
                    {isInLibrary ? t`Remove from the library` : t`Add To Library`}
                </Button>
            )}
            {inLibraryIndicator && isInLibrary && (
                <Typography
                    className="source-manga-library-state-indicator"
                    sx={{ backgroundColor: 'primary.dark', color: 'primary.contrastText', p: 0.3 }}
                >
                    {t`In Library`}
                </Typography>
            )}
            {((showUnreadBadge && mode === 'default') || mode === 'duplicate') && (unread ?? 0) > 0 && (
                <Badge badgeColor="primary">{unread}</Badge>
            )}
            {((showDownloadBadge && mode === 'default') || mode === 'duplicate') && (downloadCount ?? 0) > 0 && (
                <Badge badgeColor="secondary">{downloadCount}</Badge>
            )}
        </BadgeContainer>
    );
};
