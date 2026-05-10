/*
 * Copyright (C) Contributors to the Suwayomi project
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */

import Box from '@mui/material/Box';
import IconButton from '@mui/material/IconButton';
import Menu from '@mui/material/Menu';
import MenuItem from '@mui/material/MenuItem';
import Paper from '@mui/material/Paper';
import Typography from '@mui/material/Typography';
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import ListIcon from '@mui/icons-material/List';
import { useLingui } from '@lingui/react/macro';
import { memo, useState } from 'react';
import { useNavBarContext } from '@/features/navigation-bar/NavbarContext.tsx';
import type { GetCategoriesLibraryQuery } from '@/lib/graphql/generated/graphql.ts';

type Category = NonNullable<GetCategoriesLibraryQuery['categories']>['nodes'][number];

interface CategoryHopperFabProps {
    categories: Category[];
    activeGroupIndex: number;
    onJump: (groupIndex: number) => void;
}

/**
 * Mobile-only floating section-jump pill. There's no sidebar on mobile, so
 * a 25-category library would otherwise mean scrolling forever to switch
 * sections. The pill lives in the bottom-right (clear of the bottom nav bar
 * via `bottomBarHeight + safe-area-inset`) and gives three actions:
 *
 * - **Prev**: jump to the previous category section.
 * - **Center**: shows the active category name; tap opens a popover listing
 *   every category for direct jumping.
 * - **Next**: jump to the next category section.
 *
 * Hides itself when there are fewer than two categories (nothing to hop
 * between). The Library page hides it during selection mode so the
 * SelectionFAB owns the bottom-right corner.
 */
export const CategoryHopperFab = memo(({ categories, activeGroupIndex, onJump }: CategoryHopperFabProps) => {
    const { t } = useLingui();
    const { bottomBarHeight } = useNavBarContext();
    const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null);

    if (categories.length < 2) {
        return null;
    }

    const activeCategory = categories[activeGroupIndex] ?? categories[0];
    const canPrev = activeGroupIndex > 0;
    const canNext = activeGroupIndex < categories.length - 1;

    return (
        <>
            <Paper
                elevation={8}
                sx={{
                    position: 'fixed',
                    right: 16,
                    bottom: `calc(${bottomBarHeight}px + 16px + env(safe-area-inset-bottom))`,
                    display: 'flex',
                    alignItems: 'center',
                    borderRadius: 999,
                    overflow: 'hidden',
                    zIndex: (theme) => theme.zIndex.fab,
                    backgroundColor: 'background.paper',
                }}
            >
                <IconButton
                    size="small"
                    disabled={!canPrev}
                    onClick={() => onJump(activeGroupIndex - 1)}
                    aria-label={t`Previous category`}
                    sx={{ ml: 0.5 }}
                >
                    <ChevronLeftIcon />
                </IconButton>
                <Box
                    component="button"
                    type="button"
                    onClick={(e) => setAnchorEl(e.currentTarget)}
                    aria-label={t`Jump to category`}
                    aria-haspopup="true"
                    aria-expanded={!!anchorEl}
                    sx={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 0.75,
                        px: 1.5,
                        py: 1,
                        background: 'transparent',
                        border: 'none',
                        cursor: 'pointer',
                        color: 'text.primary',
                        font: 'inherit',
                        maxWidth: 180,
                    }}
                >
                    <ListIcon fontSize="small" sx={{ color: 'primary.main' }} />
                    <Typography
                        variant="body2"
                        sx={{
                            fontWeight: 500,
                            overflow: 'hidden',
                            whiteSpace: 'nowrap',
                            textOverflow: 'ellipsis',
                        }}
                    >
                        {activeCategory.name}
                    </Typography>
                </Box>
                <IconButton
                    size="small"
                    disabled={!canNext}
                    onClick={() => onJump(activeGroupIndex + 1)}
                    aria-label={t`Next category`}
                    sx={{ mr: 0.5 }}
                >
                    <ChevronRightIcon />
                </IconButton>
            </Paper>
            <Menu
                anchorEl={anchorEl}
                open={!!anchorEl}
                onClose={() => setAnchorEl(null)}
                anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
                transformOrigin={{ vertical: 'bottom', horizontal: 'right' }}
                slotProps={{ paper: { sx: { maxHeight: '60vh' } } }}
            >
                {categories.map((c, idx) => (
                    <MenuItem
                        key={c.id}
                        selected={idx === activeGroupIndex}
                        onClick={() => {
                            setAnchorEl(null);
                            onJump(idx);
                        }}
                    >
                        <Typography variant="body2">{c.name}</Typography>
                    </MenuItem>
                ))}
            </Menu>
        </>
    );
});
CategoryHopperFab.displayName = 'CategoryHopperFab';
