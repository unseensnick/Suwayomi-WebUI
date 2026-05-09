/*
 * Copyright (C) Contributors to the Suwayomi project
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */

import IconButton from '@mui/material/IconButton';
import ListItemIcon from '@mui/material/ListItemIcon';
import ListItemText from '@mui/material/ListItemText';
import Menu from '@mui/material/Menu';
import MenuItem from '@mui/material/MenuItem';
import SortIcon from '@mui/icons-material/Sort';
import ArrowUpwardIcon from '@mui/icons-material/ArrowUpward';
import ArrowDownwardIcon from '@mui/icons-material/ArrowDownward';
import { useLingui } from '@lingui/react/macro';
import { memo, useState } from 'react';
import { CustomTooltip } from '@/base/components/CustomTooltip.tsx';
import { SORT_OPTIONS } from '@/features/library/components/LibraryOptionsPanel.tsx';
import { createUpdateCategoryMetadata, useGetCategoryMetadata } from '@/features/category/services/CategoryMetadata.ts';
import type { CategoryMetadataInfo } from '@/features/category/Category.types.ts';

interface CategorySortMenuProps {
    category: CategoryMetadataInfo;
}

/**
 * Per-category sort selector — opens a popover menu listing all sort modes.
 * Mirrors the toggle logic in LibraryOptionsPanel exactly:
 * clicking a different mode sets `sortBy`; clicking the active mode flips
 * `sortDesc`. Persisted to category metadata via the existing mutation.
 *
 * Lives in CategoryHeader. The header itself is also clickable (toggles
 * collapse), so this component stops click propagation on its surface.
 */
export const CategorySortMenu = memo(({ category }: CategorySortMenuProps) => {
    const { t } = useLingui();
    const { sortBy, sortDesc } = useGetCategoryMetadata(category);
    const updateMeta = createUpdateCategoryMetadata(category);

    const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null);
    const open = Boolean(anchorEl);

    const handleSelect = (mode: (typeof SORT_OPTIONS)[number][0]) => {
        if (mode !== sortBy) {
            updateMeta('sortBy', mode);
        } else {
            updateMeta('sortDesc', !sortDesc);
        }
    };

    return (
        <>
            <CustomTooltip title={t`Sort`}>
                <IconButton
                    size="small"
                    onClick={(e) => {
                        e.stopPropagation();
                        setAnchorEl(e.currentTarget);
                    }}
                    aria-label={t`Sort category`}
                    aria-haspopup="true"
                    aria-expanded={open}
                >
                    <SortIcon fontSize="small" />
                </IconButton>
            </CustomTooltip>
            <Menu
                anchorEl={anchorEl}
                open={open}
                onClose={() => setAnchorEl(null)}
                onClick={(e) => e.stopPropagation()}
                anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
                transformOrigin={{ vertical: 'top', horizontal: 'right' }}
            >
                {SORT_OPTIONS.map(([mode, label]) => {
                    const isActive = mode === sortBy;
                    let directionIcon = null;
                    if (isActive) {
                        directionIcon = sortDesc ? (
                            <ArrowDownwardIcon fontSize="small" />
                        ) : (
                            <ArrowUpwardIcon fontSize="small" />
                        );
                    }
                    return (
                        <MenuItem key={mode} selected={isActive} onClick={() => handleSelect(mode)}>
                            <ListItemIcon sx={{ minWidth: 32 }}>{directionIcon}</ListItemIcon>
                            <ListItemText>{t(label)}</ListItemText>
                        </MenuItem>
                    );
                })}
            </Menu>
        </>
    );
});
CategorySortMenu.displayName = 'CategorySortMenu';
