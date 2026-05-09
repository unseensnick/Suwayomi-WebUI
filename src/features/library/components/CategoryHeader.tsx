/*
 * Copyright (C) Contributors to the Suwayomi project
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */

import IconButton from '@mui/material/IconButton';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import { useLingui } from '@lingui/react/macro';
import { memo } from 'react';
import type { GetCategoriesLibraryQuery } from '@/lib/graphql/generated/graphql.ts';

type Category = NonNullable<GetCategoriesLibraryQuery['categories']>['nodes'][number];

interface CategoryHeaderProps {
    category: Category;
    /** Number of manga currently visible after global filters/search. */
    visibleCount: number;
    /** Total number of manga in this category before filters. */
    totalCount: number;
    isCollapsed: boolean;
    onToggle: () => void;
}

/**
 * Presentational sticky header rendered by GroupedVirtuoso's `groupContent`.
 * Shows chevron + name + (visible / total) count. Click anywhere on the row
 * toggles collapse via the parent's callback.
 *
 * Background is opaque-on-paper so it occludes manga cards as it sticks
 * against the viewport top during scroll.
 */
export const CategoryHeader = memo(
    ({ category, visibleCount, totalCount, isCollapsed, onToggle }: CategoryHeaderProps) => {
        const { t } = useLingui();

        return (
            <Stack
                direction="row"
                onClick={onToggle}
                sx={{
                    alignItems: 'center',
                    gap: 1,
                    px: 2,
                    py: 1,
                    cursor: 'pointer',
                    userSelect: 'none',
                    backgroundColor: 'background.default',
                    '&:hover': { backgroundColor: 'action.hover' },
                }}
            >
                <IconButton
                    size="small"
                    sx={{ p: 0.5 }}
                    aria-label={isCollapsed ? t`Expand category` : t`Collapse category`}
                    onClick={(e) => {
                        // Header itself is clickable; prevent the inner button from double-firing.
                        e.stopPropagation();
                        onToggle();
                    }}
                >
                    {isCollapsed ? <ExpandMoreIcon /> : <ExpandLessIcon />}
                </IconButton>
                <Typography variant="h6" component="h2" sx={{ fontWeight: 600 }}>
                    {category.name}
                </Typography>
                <Typography
                    variant="body2"
                    sx={{
                        ml: 1,
                        color: 'text.secondary',
                        fontFamily: (theme) => theme.typography.monospace?.fontFamily ?? 'monospace',
                        fontVariantNumeric: 'tabular-nums',
                    }}
                >
                    {visibleCount === totalCount ? `${totalCount}` : `${visibleCount} / ${totalCount}`}
                </Typography>
            </Stack>
        );
    },
);
CategoryHeader.displayName = 'CategoryHeader';
