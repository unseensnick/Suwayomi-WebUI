/*
 * Copyright (C) Contributors to the Suwayomi project
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */

import type { ChipProps } from '@mui/material/Chip';
import Chip from '@mui/material/Chip';
import { styled, useTheme } from '@mui/material/styles';
import { useCallback, useMemo, useState } from 'react';
import { useQueryParam, StringParam } from 'use-query-params';
import Button from '@mui/material/Button';
import { Link } from 'react-router-dom';
import Box from '@mui/material/Box';
import { useLingui } from '@lingui/react/macro';
import { plural } from '@lingui/core/macro';
import { requestManager } from '@/lib/requests/RequestManager.ts';
import { EmptyViewAbsoluteCentered } from '@/base/components/feedback/EmptyViewAbsoluteCentered.tsx';
import { LoadingPlaceholder } from '@/base/components/feedback/LoadingPlaceholder.tsx';
import { LibraryToolbarMenu } from '@/features/library/components/LibraryToolbarMenu.tsx';
import { CategorySection } from '@/features/library/components/CategorySection.tsx';
import { AppbarSearch } from '@/base/components/AppbarSearch.tsx';
import { UpdateChecker } from '@/features/updates/components/UpdateChecker.tsx';
import { useSelectableCollection } from '@/base/collection/hooks/useSelectableCollection.ts';
import { SelectableCollectionSelectMode } from '@/base/collection/components/SelectableCollectionSelectMode.tsx';
import { SelectionFAB } from '@/base/collection/components/SelectionFAB.tsx';
import { MangaActionMenuItems } from '@/features/manga/components/MangaActionMenuItems.tsx';
import { defaultPromiseErrorHandler } from '@/lib/DefaultPromiseErrorHandler.ts';
import type {
    GetCategoriesLibraryQuery,
    GetCategoriesLibraryQueryVariables,
    GetLibraryMangaCountQuery,
    GetLibraryMangaCountQueryVariables,
    MangaChapterStatFieldsFragment,
    MangaType,
} from '@/lib/graphql/generated/graphql.ts';
import { GET_CATEGORIES_LIBRARY } from '@/lib/graphql/category/CategoryQuery.ts';
import { Mangas } from '@/features/manga/services/Mangas.ts';
import { MANGA_CHAPTER_STAT_FIELDS } from '@/lib/graphql/manga/MangaFragments.ts';
import { useMetadataServerSettings } from '@/features/settings/services/ServerSettingsMetadata.ts';
import { GET_LIBRARY_MANGA_COUNT } from '@/lib/graphql/manga/MangaQuery.ts';
import { useAppTitle } from '@/features/navigation-bar/hooks/useAppTitle.ts';
import { useAppAction } from '@/features/navigation-bar/hooks/useAppAction.ts';
import { AppRoutes } from '@/base/AppRoute.constants.ts';
import { SearchParam } from '@/base/Base.types.ts';
import { STABLE_EMPTY_ARRAY } from '@/base/Base.constants.ts';

const TitleWithSizeTag = styled('span')({
    display: 'flex',
    alignItems: 'center',
});

const TitleSizeTag = ({ sx, ...props }: ChipProps) => (
    <Chip {...props} size="small" sx={{ ...sx, marginLeft: '5px' }} />
);

/**
 * Stacked-categories library — renders every category as its own section,
 * top-to-bottom. Replaces the previous tab strip; sidebar's CategoryNavList
 * jumps to a specific section anchor (#cat-<id>) instead of swapping tabs.
 *
 * The toolbar menu (filter / sort) targets the first category as a stable
 * placeholder; per-category sort controls land in a follow-up PR alongside
 * scrollspy that pins the toolbar to the section in view.
 */
export function Library() {
    const { t } = useLingui();
    const theme = useTheme();

    const {
        settings: { showTabSize },
    } = useMetadataServerSettings();

    const {
        data: categoriesResponse,
        error: tabsError,
        loading: areCategoriesLoading,
        refetch: refetchCategories,
    } = requestManager.useGetCategories<GetCategoriesLibraryQuery, GetCategoriesLibraryQueryVariables>(
        GET_CATEGORIES_LIBRARY,
    );
    // Same filter the tab model used: hide id=0 ("Default") when empty.
    const categories = useMemo(
        () =>
            categoriesResponse?.categories.nodes.filter(
                (category) => category.id !== 0 || (category.id === 0 && category.mangas.totalCount),
            ) ?? STABLE_EMPTY_ARRAY,
        [categoriesResponse],
    );

    const librarySizeResponse = requestManager.useGetMangas<
        GetLibraryMangaCountQuery,
        GetLibraryMangaCountQueryVariables
    >(GET_LIBRARY_MANGA_COUNT, {});

    const librarySize = librarySizeResponse.data?.mangas.totalCount ?? 0;

    const [query] = useQueryParam(SearchParam.QUERY, StringParam);

    // Each section reports its visible mangaIds so we can compose a single
    // selection state across the whole stack (Yokai pattern: bulk selection
    // is global, not per-section).
    const [mangaIdsByCategory, setMangaIdsByCategory] = useState<Record<number, MangaType['id'][]>>({});
    const handleMangasChange = useCallback((categoryId: number, mangaIds: MangaType['id'][]) => {
        setMangaIdsByCategory((prev) => {
            const existing = prev[categoryId];
            if (existing && existing.length === mangaIds.length && existing.every((v, i) => v === mangaIds[i])) {
                return prev;
            }
            return { ...prev, [categoryId]: mangaIds };
        });
    }, []);

    const allMangaIds = useMemo(() => [...new Set(Object.values(mangaIdsByCategory).flat())], [mangaIdsByCategory]);

    const [isSelectModeActive, setIsSelectModeActive] = useState(false);
    const SELECTION_KEY = 'library';
    const {
        areNoItemsForKeySelected: areNoItemsSelected,
        areAllItemsForKeySelected: areAllItemsSelected,
        selectedItemIds,
        handleSelectAll,
        handleSelection,
        clearSelection,
    } = useSelectableCollection<MangaType['id'], string>(allMangaIds.length, {
        itemIds: allMangaIds,
        currentKey: SELECTION_KEY,
        initialState: undefined,
    });

    const handleSelect: typeof handleSelection = useCallback(
        (id, selected, selectOptions) => {
            setIsSelectModeActive(!!(selectedItemIds.length + (selected ? 1 : -1)));
            handleSelection(id, selected, selectOptions);
        },
        [setIsSelectModeActive, handleSelection, selectedItemIds.length],
    );

    const selectedMangas = useMemo(
        () =>
            selectedItemIds
                .map((id) =>
                    Mangas.getFromCache<MangaChapterStatFieldsFragment>(
                        id,
                        MANGA_CHAPTER_STAT_FIELDS,
                        'MANGA_CHAPTER_STAT_FIELDS',
                    ),
                )
                .filter((manga) => !!manga),
        [selectedItemIds],
    );

    const selectionFab = useMemo(() => {
        if (!isSelectModeActive) {
            return null;
        }

        return (
            <SelectionFAB title={plural(selectedItemIds.length, { one: '# manga', other: '# manga' })}>
                {(handleClose, setHideMenu) => (
                    <MangaActionMenuItems
                        selectedMangas={selectedMangas}
                        onClose={() => {
                            handleClose();
                            setIsSelectModeActive(false);
                            clearSelection();
                        }}
                        setHideMenu={setHideMenu}
                    />
                )}
            </SelectionFAB>
        );
    }, [isSelectModeActive, selectedMangas, selectedItemIds.length, clearSelection]);

    const triggerGlobalSearchButton = useMemo(
        () =>
            !!query && (
                <Box sx={{ p: 2 }}>
                    <Button
                        size="large"
                        component={Link}
                        to={AppRoutes.sources.childRoutes.searchAll.path(query)}
                        sx={{ textTransform: 'none', width: '100%' }}
                    >
                        {t`Search for "${query}" globally`}
                    </Button>
                </Box>
            ),
        [query, t],
    );

    // Toolbar-menu target: first category as a placeholder until per-section
    // scrollspy lands. The toolbar still works — it just always edits the
    // first category's filter/sort metadata. Per-category settings remain
    // editable from Settings → Categories.
    const [toolbarCategory] = categories;

    useAppTitle(
        <TitleWithSizeTag>
            {t`Library`}
            {showTabSize && (
                <TitleSizeTag
                    sx={{ ...theme.applyStyles('light', { backgroundColor: 'background.paper' }) }}
                    label={librarySize}
                />
            )}
        </TitleWithSizeTag>,
        t`Library`,
        [t, showTabSize, librarySize],
    );
    useAppAction(
        <>
            {!isSelectModeActive && toolbarCategory && (
                <>
                    <AppbarSearch />
                    <LibraryToolbarMenu category={toolbarCategory} />
                    <UpdateChecker categoryId={toolbarCategory.id} />
                </>
            )}
            {!!allMangaIds.length && (
                <SelectableCollectionSelectMode
                    isActive={isSelectModeActive}
                    areAllItemsSelected={areAllItemsSelected}
                    areNoItemsSelected={areNoItemsSelected}
                    onSelectAll={(selectAll) => handleSelectAll(selectAll, allMangaIds)}
                    onModeChange={(checked) => {
                        setIsSelectModeActive(checked);

                        if (checked) {
                            handleSelectAll(true, allMangaIds);
                        } else {
                            handleSelectAll(false, []);
                        }
                    }}
                />
            )}
        </>,
        [isSelectModeActive, areNoItemsSelected, areAllItemsSelected, toolbarCategory, allMangaIds, handleSelectAll],
    );

    if (tabsError != null || librarySizeResponse.error) {
        return (
            <EmptyViewAbsoluteCentered
                message={t`Unable to load data`}
                messageExtra={tabsError?.message ?? librarySizeResponse.error?.message}
                retry={() => {
                    if (tabsError) {
                        refetchCategories().catch(defaultPromiseErrorHandler('Library::refetchCategories'));
                    }

                    if (librarySizeResponse.error) {
                        librarySizeResponse.refetch().catch(defaultPromiseErrorHandler('Library::refetchLibrarySize'));
                    }
                }}
            />
        );
    }

    if (areCategoriesLoading || librarySizeResponse.loading) {
        return <LoadingPlaceholder />;
    }

    if (categories.length === 0) {
        return <EmptyViewAbsoluteCentered message={t`Your library is empty`} />;
    }

    return (
        <>
            {triggerGlobalSearchButton}
            {categories.map((category) => (
                <CategorySection
                    key={category.id}
                    category={category}
                    isSelectModeActive={isSelectModeActive}
                    selectedMangaIds={selectedItemIds}
                    handleSelection={handleSelect}
                    onMangasChange={handleMangasChange}
                />
            ))}
            {selectionFab}
        </>
    );
}
