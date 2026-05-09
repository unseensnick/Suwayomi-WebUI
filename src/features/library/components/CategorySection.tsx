/*
 * Copyright (C) Contributors to the Suwayomi project
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */

import Box from '@mui/material/Box';
import Collapse from '@mui/material/Collapse';
import IconButton from '@mui/material/IconButton';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import { useLingui } from '@lingui/react/macro';
import { useEffect, useMemo, useState } from 'react';
import { LibraryMangaGrid } from '@/features/library/components/LibraryMangaGrid.tsx';
import { useGetVisibleLibraryMangas } from '@/features/library/hooks/useGetVisibleLibraryMangas.ts';
import type { GetCategoriesLibraryQuery, MangaType } from '@/lib/graphql/generated/graphql.ts';
import { requestManager } from '@/lib/requests/RequestManager.ts';
import { STABLE_EMPTY_ARRAY } from '@/base/Base.constants.ts';
import { defaultPromiseErrorHandler } from '@/lib/DefaultPromiseErrorHandler.ts';

type Category = NonNullable<GetCategoriesLibraryQuery['categories']>['nodes'][number];

interface CategorySectionProps {
    category: Category;
    isSelectModeActive: boolean;
    selectedMangaIds: MangaType['id'][];
    handleSelection: (id: MangaType['id'], selected: boolean, selectOptions?: { selectRange?: boolean }) => void;
    onMangasChange?: (categoryId: number, mangaIds: MangaType['id'][]) => void;
}

/**
 * One section of the stacked-library layout. Header (collapsible) + the
 * existing `LibraryMangaGrid` for that category's manga.
 *
 * Uses the same per-category data hooks the tab model used to use:
 *   useGetCategoryMangas(catId) → useGetVisibleLibraryMangas(mangas, category)
 *
 * Empty categories collapse by default; the user can toggle.
 */
export const CategorySection = ({
    category,
    isSelectModeActive,
    selectedMangaIds,
    handleSelection,
    onMangasChange,
}: CategorySectionProps) => {
    const { t } = useLingui();

    const {
        data: categoryMangaResponse,
        error: mangaError,
        loading: mangaLoading,
        refetch: refetchCategoryMangas,
    } = requestManager.useGetCategoryMangas(category.id);
    const categoryMangas = categoryMangaResponse?.mangas.nodes ?? STABLE_EMPTY_ARRAY;
    const {
        visibleMangas: mangas,
        showFilteredOutMessage,
        filterKey,
    } = useGetVisibleLibraryMangas(categoryMangas, category);

    const isEmpty = !mangaLoading && categoryMangas.length === 0;
    const [collapsedOverride, setCollapsedOverride] = useState<boolean | null>(null);
    const isCollapsed = collapsedOverride ?? isEmpty;

    const mangaIds = useMemo(() => mangas.map((m) => m.id), [mangas]);

    useEffect(() => {
        onMangasChange?.(category.id, mangaIds);
    }, [category.id, mangaIds, onMangasChange]);

    const retry = useMemo(
        () => () => refetchCategoryMangas().catch(defaultPromiseErrorHandler('CategorySection::refetch')),
        [refetchCategoryMangas],
    );

    return (
        <Box id={`cat-${category.id}`} sx={{ scrollMarginTop: '64px' }}>
            <Stack
                direction="row"
                onClick={() => setCollapsedOverride(!isCollapsed)}
                sx={{
                    alignItems: 'center',
                    gap: 1,
                    px: 2,
                    py: 1,
                    cursor: 'pointer',
                    userSelect: 'none',
                    '&:hover': { backgroundColor: 'action.hover' },
                }}
            >
                <IconButton
                    size="small"
                    sx={{ p: 0.5 }}
                    aria-label={isCollapsed ? t`Expand category` : t`Collapse category`}
                    onClick={(e) => {
                        // Header itself is also clickable — let the inner button stop propagation
                        // so we don't double-toggle.
                        e.stopPropagation();
                        setCollapsedOverride(!isCollapsed);
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
                    {mangas.length === categoryMangas.length
                        ? `${categoryMangas.length}`
                        : `${mangas.length} / ${categoryMangas.length}`}
                </Typography>
            </Stack>

            <Collapse in={!isCollapsed} timeout={200}>
                {isEmpty ? (
                    <Box sx={{ px: 2, py: 1.5, color: 'text.secondary' }}>
                        <Typography variant="body2">{t`Category is empty`}</Typography>
                    </Box>
                ) : (
                    <LibraryMangaGrid
                        // Force re-render of the virtuoso grid when the filter
                        // changes (https://github.com/petyosi/react-virtuoso/issues/1242)
                        key={filterKey}
                        mangas={mangas}
                        message={mangaError ? t`Could not load manga` : t`The category is empty`}
                        messageExtra={mangaError?.message}
                        isLoading={mangaLoading}
                        selectedMangaIds={selectedMangaIds}
                        isSelectModeActive={isSelectModeActive}
                        handleSelection={handleSelection}
                        showFilteredOutMessage={!mangaError && showFilteredOutMessage}
                        retry={mangaError && retry}
                    />
                )}
            </Collapse>
        </Box>
    );
};
