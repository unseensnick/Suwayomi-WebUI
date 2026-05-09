/*
 * Copyright (C) Contributors to the Suwayomi project
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */

import Box from '@mui/material/Box';
import InputAdornment from '@mui/material/InputAdornment';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import ListItemText from '@mui/material/ListItemText';
import SearchIcon from '@mui/icons-material/Search';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import { useLingui } from '@lingui/react/macro';
import { useMemo, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { NumberParam, useQueryParam } from 'use-query-params';
import { CustomTooltip } from '@/base/components/CustomTooltip.tsx';
import { ListItemLink } from '@/base/components/lists/ListItemLink.tsx';
import { TypographyMaxLines } from '@/base/components/texts/TypographyMaxLines.tsx';
import { AppRoutes } from '@/base/AppRoute.constants.ts';
import { SearchParam } from '@/base/Base.types.ts';
import { GET_CATEGORIES_LIBRARY } from '@/lib/graphql/category/CategoryQuery.ts';
import type { GetCategoriesLibraryQuery, GetCategoriesLibraryQueryVariables } from '@/lib/graphql/generated/graphql.ts';
import { requestManager } from '@/lib/requests/RequestManager.ts';
import { useNavBarContext } from '@/features/navigation-bar/NavbarContext.tsx';

/**
 * Library categories rendered as a vertical list inside the desktop sidebar.
 *
 * - Pulls `GET_CATEGORIES_LIBRARY` (same source the Library page uses); hides
 *   id=0 when empty, mirroring `Library.tsx`'s tab-list filter.
 * - Click behavior depends on the current route:
 *   - On `/library`: scrolls the page to the section anchor (`#cat-<id>`)
 *     without changing the URL — the library renders all categories stacked.
 *   - Anywhere else: navigates to `/library?tab=<id>` so the URL still carries
 *     the chosen category through the route change. Once on the library, the
 *     tab param is unused but harmless; it lets the active marker stay lit.
 * - Active marker lights up when on `/library` AND the URL's `?tab=` matches.
 *   Last-clicked category stays "active" until the user clicks another.
 * - Filter input narrows visible items by name (case-insensitive).
 * - Collapsed rail: shows a single-letter mark instead of the full name.
 */
export const CategoryNavList = () => {
    const { t } = useLingui();
    const location = useLocation();
    const { isCollapsed } = useNavBarContext();
    const [tabSearchParam] = useQueryParam(SearchParam.TAB, NumberParam);
    const [filter, setFilter] = useState('');

    const { data: categoriesResponse } = requestManager.useGetCategories<
        GetCategoriesLibraryQuery,
        GetCategoriesLibraryQueryVariables
    >(GET_CATEGORIES_LIBRARY);

    // Same filter as Library.tsx: hide the implicit "Default" (id=0) when empty.
    const categories = useMemo(
        () =>
            categoriesResponse?.categories.nodes.filter(
                (category) => category.id !== 0 || (category.id === 0 && category.mangas.totalCount),
            ) ?? [],
        [categoriesResponse],
    );

    const isOnLibrary = location.pathname === '/library' || location.pathname === '/library/';

    const normalizedFilter = filter.trim().toLowerCase();
    const visibleCategories = useMemo(
        () =>
            normalizedFilter ? categories.filter((c) => c.name.toLowerCase().includes(normalizedFilter)) : categories,
        [categories, normalizedFilter],
    );

    if (!categories.length) {
        return null;
    }

    return (
        <Box
            sx={{
                display: 'flex',
                flexDirection: 'column',
                minHeight: 0,
                flex: 1,
            }}
        >
            <Typography
                variant="overline"
                sx={{
                    px: 2,
                    pt: 1,
                    pb: 0.5,
                    color: 'text.secondary',
                    letterSpacing: '0.18em',
                    fontSize: '0.65rem',
                    lineHeight: 1.2,
                    display: isCollapsed ? 'none' : 'block',
                }}
            >
                {t`Library`}
            </Typography>

            {/* Filter input — hidden when collapsed; shows again on expand */}
            {!isCollapsed && (
                <Box sx={{ px: 2, pb: 0.5 }}>
                    <TextField
                        value={filter}
                        onChange={(e) => setFilter(e.target.value)}
                        placeholder={t`Filter categories…`}
                        size="small"
                        fullWidth
                        slotProps={{
                            input: {
                                startAdornment: (
                                    <InputAdornment position="start">
                                        <SearchIcon fontSize="small" />
                                    </InputAdornment>
                                ),
                            },
                        }}
                    />
                </Box>
            )}

            {/* Scrollable category list — own scroll region within the rail */}
            <List
                sx={{
                    flex: 1,
                    minHeight: 0,
                    overflowY: 'auto',
                    px: 1,
                    py: 0.5,
                }}
                dense={isCollapsed}
            >
                {visibleCategories.map((category) => {
                    const isActive = isOnLibrary && tabSearchParam === category.id;
                    const mark = (category.name.trim()[0] ?? '?').toUpperCase();
                    const handleClick = (e: React.MouseEvent) => {
                        if (isOnLibrary) {
                            const target = document.getElementById(`cat-${category.id}`);
                            if (target) {
                                e.preventDefault();
                                target.scrollIntoView({ behavior: 'smooth', block: 'start' });
                            }
                        }
                    };
                    return (
                        <ListItem key={category.id} disablePadding>
                            <CustomTooltip title={category.name} placement="right">
                                <ListItemLink
                                    to={AppRoutes.library.path(String(category.id))}
                                    onClick={handleClick}
                                    selected={isActive}
                                    sx={{
                                        borderRadius: 1,
                                        position: 'relative',
                                        // Active marker: small accent bar on the leading edge
                                        ...(isActive && {
                                            '&::before': {
                                                content: '""',
                                                position: 'absolute',
                                                insetInlineStart: 0,
                                                top: 8,
                                                bottom: 8,
                                                width: 2,
                                                borderRadius: 1,
                                                backgroundColor: 'primary.main',
                                            },
                                        }),
                                        ...(isCollapsed && {
                                            justifyContent: 'center',
                                            px: 0,
                                        }),
                                    }}
                                >
                                    {isCollapsed ? (
                                        <Typography
                                            variant="caption"
                                            sx={{
                                                fontFamily: (theme) =>
                                                    theme.typography.monospace?.fontFamily ?? 'monospace',
                                                fontWeight: 500,
                                                letterSpacing: '0.04em',
                                                color: isActive ? 'primary.main' : 'text.secondary',
                                                lineHeight: 1,
                                            }}
                                        >
                                            {mark}
                                        </Typography>
                                    ) : (
                                        <ListItemText
                                            primary={
                                                <TypographyMaxLines
                                                    lines={1}
                                                    sx={{
                                                        color: isActive ? 'primary.main' : 'text.primary',
                                                        fontSize: '0.875rem',
                                                    }}
                                                >
                                                    {category.name}
                                                </TypographyMaxLines>
                                            }
                                            secondary={
                                                <Typography
                                                    component="span"
                                                    sx={{
                                                        fontFamily: (theme) =>
                                                            theme.typography.monospace?.fontFamily ?? 'monospace',
                                                        fontSize: '0.7rem',
                                                        color: 'text.secondary',
                                                        ml: 1,
                                                    }}
                                                >
                                                    {category.mangas.totalCount}
                                                </Typography>
                                            }
                                            slotProps={{
                                                primary: { component: 'div' },
                                                secondary: { component: 'div' },
                                            }}
                                            sx={{
                                                m: 0,
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'space-between',
                                                gap: 1,
                                            }}
                                        />
                                    )}
                                </ListItemLink>
                            </CustomTooltip>
                        </ListItem>
                    );
                })}
                {visibleCategories.length === 0 && !isCollapsed && (
                    <ListItem sx={{ justifyContent: 'center', py: 1 }}>
                        <Typography variant="caption" color="text.secondary">
                            {t`No categories match`}
                        </Typography>
                    </ListItem>
                )}
            </List>
        </Box>
    );
};
