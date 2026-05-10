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
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { NumberParam, StringParam, useQueryParam } from 'use-query-params';
import Button from '@mui/material/Button';
import { Link, useLocation } from 'react-router-dom';
import Box from '@mui/material/Box';
import { useLingui } from '@lingui/react/macro';
import { plural } from '@lingui/core/macro';
import type { GroupedVirtuosoHandle } from 'react-virtuoso';
import { GroupedVirtuosoPersisted } from '@/lib/virtuoso/Component/GroupedVirtuosoPersisted.tsx';
import { requestManager } from '@/lib/requests/RequestManager.ts';
import { EmptyViewAbsoluteCentered } from '@/base/components/feedback/EmptyViewAbsoluteCentered.tsx';
import { LoadingPlaceholder } from '@/base/components/feedback/LoadingPlaceholder.tsx';
import { LibraryToolbarMenu } from '@/features/library/components/LibraryToolbarMenu.tsx';
import { CategoryDataLoader } from '@/features/library/components/CategoryDataLoader.tsx';
import { CategoryHeader } from '@/features/library/components/CategoryHeader.tsx';
import { CategoryHopperFab } from '@/features/library/components/CategoryHopperFab.tsx';
import { AppbarSearch } from '@/base/components/AppbarSearch.tsx';
import { UpdateChecker } from '@/features/updates/components/UpdateChecker.tsx';
import { useSelectableCollection } from '@/base/collection/hooks/useSelectableCollection.ts';
import { SelectableCollectionSelectMode } from '@/base/collection/components/SelectableCollectionSelectMode.tsx';
import { SelectionFAB } from '@/base/collection/components/SelectionFAB.tsx';
import { MangaActionMenuItems } from '@/features/manga/components/MangaActionMenuItems.tsx';
import { MangaCard } from '@/features/manga/components/cards/MangaCard.tsx';
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
import { GridLayout, SearchParam } from '@/base/Base.types.ts';
import { useNavBarContext } from '@/features/navigation-bar/NavbarContext.tsx';
import { useResizeObserver } from '@/base/hooks/useResizeObserver.tsx';
import { LibraryScrollService } from '@/features/library/services/LibraryScrollService.ts';
import { MediaQuery } from '@/base/utils/MediaQuery.tsx';

const TitleWithSizeTag = styled('span')({
    display: 'flex',
    alignItems: 'center',
});

const TitleSizeTag = ({ sx, ...props }: ChipProps) => (
    <Chip {...props} size="small" sx={{ ...sx, marginLeft: '5px' }} />
);

type LibraryManga = NonNullable<
    ReturnType<typeof requestManager.useGetCategoryMangas>['data']
>['mangas']['nodes'][number];

const chunk = <T,>(arr: T[], size: number): T[][] => {
    if (size <= 1) {
        return arr.map((x) => [x]);
    }
    const out: T[][] = [];
    for (let i = 0; i < arr.length; i += size) {
        out.push(arr.slice(i, i + size));
    }
    return out;
};

/**
 * Library page (v2 — GroupedVirtuoso architecture).
 *
 * Renders all categories stacked, virtualized by a single `GroupedVirtuoso`.
 * One scroll container, one ViewHolder pool — same shape as Yokai's
 * single-RecyclerView library, the cure for the per-category Virtuoso
 * collisions in the previous incarnation.
 *
 * Data composition:
 * - One `<CategoryDataLoader />` per category fires its Apollo query in
 *   parallel; each reports its filtered/sorted manga list back via callback.
 * - This component aggregates `mangasByCategory` and chunks each list into
 *   rows that fit the current grid density (1/row in List mode, N/row in
 *   Grid modes derived from container width).
 *
 * Rendering:
 * - `groupCounts` = visible row count per category (0 for collapsed → header
 *   still renders, no items below).
 * - `groupContent` → <CategoryHeader>, the sticky pinning row.
 * - `itemContent` → flex-row of <MangaCard>s for that row.
 *
 * Sidebar integration:
 * - `LibraryScrollService` exposes a scrollToCategory handler that
 *   `CategoryNavList` calls; the handler computes the flat index of the
 *   group's header and calls `scrollToIndex` on the Virtuoso ref.
 *
 * Selection state:
 * - One `useSelectableCollection` keyed `'library'`; covers all visible
 *   manga across all sections (Yokai's global ActionMode pattern).
 *
 * Toolbar (filter/sort/refresh):
 * - Tracks the in-view category via DOM-based scrollspy: each rendered
 *   `[data-cat-id]` header's `getBoundingClientRect().top` is checked
 *   against `appBarHeight`; the last header below the bar's bottom edge
 *   is "active". (Virtuoso's `rangeChanged` ignores the AppBar and would
 *   report whatever's hidden behind it, one group too early.) The
 *   toolbar's filter/sort modal and update checker target whichever
 *   section the user is currently looking at; per-section sort buttons in
 *   headers cover the per-category-without-leaving-the-section case.
 *
 * Scroll restoration:
 * - `GroupedVirtuosoPersisted` snapshots scroll state per `location.key` in
 *   sessionStorage; clicking a manga then hitting back lands the user at the
 *   same row instead of the top of the library. Persistence keys off the
 *   single `'library-stack'` snapshot — possible because there's now only
 *   one Virtuoso on the page.
 *
 * Mobile section navigation:
 * - There's no sidebar on mobile. `CategoryHopperFab` floats above the
 *   bottom bar with prev/list/next controls so power users with many
 *   categories can jump between sections without long scrolling.
 */
export function Library() {
    const { t } = useLingui();
    const theme = useTheme();
    const { navBarWidth, appBarHeight } = useNavBarContext();
    const isMobileWidth = MediaQuery.useIsMobileWidth();

    const {
        settings: { showTabSize, gridLayout, mangaGridItemWidth },
    } = useMetadataServerSettings();

    const {
        data: categoriesResponse,
        error: tabsError,
        loading: areCategoriesLoading,
        refetch: refetchCategories,
    } = requestManager.useGetCategories<GetCategoriesLibraryQuery, GetCategoriesLibraryQueryVariables>(
        GET_CATEGORIES_LIBRARY,
    );
    // Same filter as the tab model: hide id=0 ("Default") when empty.
    const categories = useMemo(
        () =>
            categoriesResponse?.categories.nodes.filter(
                (category) => category.id !== 0 || (category.id === 0 && category.mangas.totalCount),
            ) ?? [],
        [categoriesResponse],
    );

    const librarySizeResponse = requestManager.useGetMangas<
        GetLibraryMangaCountQuery,
        GetLibraryMangaCountQueryVariables
    >(GET_LIBRARY_MANGA_COUNT, {});
    const librarySize = librarySizeResponse.data?.mangas.totalCount ?? 0;

    const [query] = useQueryParam(SearchParam.QUERY, StringParam);

    // Per-category data — populated by the per-category data-loader children.
    const [mangasByCategory, setMangasByCategory] = useState<Record<number, LibraryManga[]>>({});
    const [totalByCategory, setTotalByCategory] = useState<Record<number, number>>({});
    const handleCategoryData = useCallback((categoryId: number, mangas: LibraryManga[], totalCount: number) => {
        setMangasByCategory((prev) => {
            const existing = prev[categoryId];
            if (existing && existing.length === mangas.length && existing.every((m, i) => m.id === mangas[i].id)) {
                return prev;
            }
            return { ...prev, [categoryId]: mangas };
        });
        setTotalByCategory((prev) => (prev[categoryId] === totalCount ? prev : { ...prev, [categoryId]: totalCount }));
    }, []);

    // Per-category collapse state. Default: empty categories collapsed.
    const [collapsedCategoryIds, setCollapsedCategoryIds] = useState<Set<number>>(new Set());
    useEffect(() => {
        // Auto-collapse newly seen empty categories on first observation.
        setCollapsedCategoryIds((prev) => {
            let next = prev;
            for (const c of categories) {
                if (c.mangas.totalCount === 0 && !prev.has(c.id)) {
                    if (next === prev) {
                        next = new Set(prev);
                    }
                    next.add(c.id);
                }
            }
            return next;
        });
    }, [categories]);

    const toggleCollapse = useCallback((categoryId: number) => {
        setCollapsedCategoryIds((prev) => {
            const next = new Set(prev);
            if (next.has(categoryId)) {
                next.delete(categoryId);
            } else {
                next.add(categoryId);
            }
            return next;
        });
    }, []);

    // Container-width-driven row chunking.
    const containerRef = useRef<HTMLDivElement>(null);
    const [containerWidth, setContainerWidth] = useState<number>(document.documentElement.offsetWidth - navBarWidth);
    useResizeObserver(
        containerRef,
        useCallback(() => {
            const w = containerRef.current?.offsetWidth;
            if (w) {
                setContainerWidth(w);
            }
        }, []),
    );
    const itemsPerRow = useMemo(() => {
        if (gridLayout === GridLayout.List) {
            return 1;
        }
        return Math.max(1, Math.floor(containerWidth / Math.max(80, mangaGridItemWidth)));
    }, [containerWidth, gridLayout, mangaGridItemWidth]);

    // Build visible rows per category (empty array when collapsed).
    const rowsByCategory = useMemo(() => {
        const out: Record<number, LibraryManga[][]> = {};
        for (const c of categories) {
            if (collapsedCategoryIds.has(c.id)) {
                out[c.id] = [];
            } else {
                out[c.id] = chunk(mangasByCategory[c.id] ?? [], itemsPerRow);
            }
        }
        return out;
    }, [categories, collapsedCategoryIds, mangasByCategory, itemsPerRow]);

    const groupCounts = useMemo(
        () => categories.map((c) => rowsByCategory[c.id]?.length ?? 0),
        [categories, rowsByCategory],
    );

    // GroupedVirtuoso's `itemContent(index, groupIndex)` passes a GLOBAL ITEM
    // index (across all items in all groups, headers excluded). To map back
    // to a row inside a category we precompute the cumulative offset per
    // group: groupItemOffsets[i] = sum(groupCounts[0..i-1]).
    const groupItemOffsets = useMemo(() => {
        const offsets: number[] = [];
        let acc = 0;
        for (let i = 0; i < groupCounts.length; i++) {
            offsets.push(acc);
            acc += groupCounts[i];
        }
        return offsets;
    }, [groupCounts]);

    // Aggregate all currently-visible manga ids for selection.
    const allMangaIds = useMemo(() => {
        const set = new Set<MangaType['id']>();
        for (const c of categories) {
            for (const m of mangasByCategory[c.id] ?? []) {
                set.add(m.id);
            }
        }
        return Array.from(set);
    }, [categories, mangasByCategory]);

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

    // Scrollspy: track which category is currently topmost VISUALLY (i.e.,
    // just below the AppBar), so the toolbar and the mobile hopper agree
    // with what the user actually sees.
    //
    // Why DOM-based instead of `rangeChanged`: with `useWindowScroll`,
    // Virtuoso reports the topmost item at `scrollY = 0`, but that area is
    // covered by the fixed AppBar. The user is visually looking one group
    // further down. We probe each rendered `[data-cat-id]` header's
    // `getBoundingClientRect().top` against `appBarHeight` and pick the
    // last header that has scrolled into or past the bar.
    const [activeGroupIndex, setActiveGroupIndex] = useState(0);
    useEffect(() => {
        setActiveGroupIndex((prev) => (prev >= categories.length ? 0 : prev));
    }, [categories.length]);

    const updateActiveGroupFromDom = useCallback(() => {
        const headers = document.querySelectorAll<HTMLElement>('[data-cat-id]');
        if (headers.length === 0) {
            return;
        }
        // Boundary: just below the AppBar. A small epsilon makes the switch
        // happen as the next header touches the bar rather than after it
        // crosses fully.
        const boundary = appBarHeight + 1;
        let activeId: number | null = null;
        for (let i = 0; i < headers.length; i++) {
            const el = headers[i];
            if (el.getBoundingClientRect().top <= boundary) {
                activeId = Number(el.dataset.catId);
            } else {
                break;
            }
        }
        if (activeId == null) {
            return;
        }
        const idx = categories.findIndex((c) => c.id === activeId);
        if (idx < 0) {
            return;
        }
        setActiveGroupIndex((prev) => (prev === idx ? prev : idx));
    }, [appBarHeight, categories]);

    useEffect(() => {
        const onScroll = () => updateActiveGroupFromDom();
        window.addEventListener('scroll', onScroll, { passive: true });
        // Run once after mount to sync with restored snapshot or initial top.
        const raf = requestAnimationFrame(updateActiveGroupFromDom);
        return () => {
            window.removeEventListener('scroll', onScroll);
            cancelAnimationFrame(raf);
        };
    }, [updateActiveGroupFromDom]);

    const toolbarCategory = categories[activeGroupIndex] ?? categories[0];

    // Virtuoso ref. `scrollToIndex` with `offset: -appBarHeight` lands the
    // target group's header just below the bar instead of behind it.
    const virtuosoRef = useRef<GroupedVirtuosoHandle>(null);
    const scrollToGroup = useCallback(
        (groupIndex: number, behavior: 'auto' | 'smooth' = 'smooth') => {
            virtuosoRef.current?.scrollToIndex({
                groupIndex,
                align: 'start',
                offset: -appBarHeight,
                behavior,
            });
        },
        [appBarHeight],
    );

    useEffect(() => {
        LibraryScrollService.setHandler((categoryId) => {
            const groupIndex = categories.findIndex((c) => c.id === categoryId);
            if (groupIndex < 0) {
                return;
            }
            scrollToGroup(groupIndex);
        });
        return () => LibraryScrollService.setHandler(null);
    }, [categories, scrollToGroup]);

    // Cross-route entry: clicking a sidebar category from outside `/library`
    // navigates to `/library?tab=<id>`. On mount, scroll to that section
    // (handled here for the initial-mount case; same-page clicks go through
    // `LibraryScrollService` and short-circuit the URL change).
    //
    // Skipped when a sessionStorage snapshot exists for this `location.key` —
    // back-navigation from the manga detail page restores the prior scroll
    // position via `GroupedVirtuosoPersisted`, and we don't want a tab-scroll
    // to overwrite it.
    const [tabParam] = useQueryParam(SearchParam.TAB, NumberParam);
    const location = useLocation();
    const didInitialTabScrollRef = useRef(false);
    useEffect(() => {
        if (didInitialTabScrollRef.current) {
            return;
        }
        if (tabParam == null || categories.length === 0) {
            return;
        }

        didInitialTabScrollRef.current = true;

        const snapshotKey = `virtuoso-snapshot-library-stack-${location.key}`;
        if (sessionStorage.getItem(snapshotKey)) {
            return;
        }

        const idx = categories.findIndex((c) => c.id === tabParam);
        if (idx < 0) {
            return;
        }

        // Defer one frame so the GroupedVirtuoso has measured group sizes.
        requestAnimationFrame(() => scrollToGroup(idx, 'auto'));
    }, [tabParam, categories, location.key, scrollToGroup]);

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
            {/* Per-category data loaders run their Apollo queries in parallel; they render nothing. */}
            {categories.map((category) => (
                <CategoryDataLoader key={category.id} category={category} onData={handleCategoryData} />
            ))}

            {triggerGlobalSearchButton}

            <Box ref={containerRef}>
                <GroupedVirtuosoPersisted
                    persistKey="library-stack"
                    ref={virtuosoRef}
                    useWindowScroll
                    increaseViewportBy={Math.max(400, window.innerHeight * 0.5)}
                    groupCounts={groupCounts}
                    groupContent={(groupIndex) => {
                        const category = categories[groupIndex];
                        const visibleCount = mangasByCategory[category.id]?.length ?? 0;
                        const totalCount = totalByCategory[category.id] ?? category.mangas.totalCount ?? 0;
                        return (
                            <CategoryHeader
                                category={category}
                                visibleCount={visibleCount}
                                totalCount={totalCount}
                                isCollapsed={collapsedCategoryIds.has(category.id)}
                                onToggle={() => toggleCollapse(category.id)}
                            />
                        );
                    }}
                    itemContent={(globalItemIndex, groupIndex) => {
                        const category = categories[groupIndex];
                        const rows = rowsByCategory[category.id] ?? [];
                        // GroupedVirtuoso passes a global ITEM index (excluding headers);
                        // subtract the cumulative offset for prior groups to get the
                        // row's local position inside this category.
                        const localRowIndex = globalItemIndex - groupItemOffsets[groupIndex];
                        const row = rows[localRowIndex] ?? [];
                        return (
                            <Box
                                sx={{
                                    display: 'grid',
                                    gridTemplateColumns: `repeat(${itemsPerRow}, minmax(0, 1fr))`,
                                    gap: 1,
                                    px: 1,
                                    pb: 1,
                                }}
                            >
                                {row.map((manga) => (
                                    <MangaCard
                                        key={manga.id}
                                        manga={manga}
                                        gridLayout={gridLayout}
                                        inLibraryIndicator={false}
                                        selected={isSelectModeActive ? selectedItemIds.includes(manga.id) : null}
                                        handleSelection={handleSelect}
                                        mode="default"
                                    />
                                ))}
                            </Box>
                        );
                    }}
                />
            </Box>

            {selectionFab}

            {/*
             * Mobile-only: section-jump pill. The desktop sidebar already
             * gives jump-nav, and the SelectionFAB owns the bottom-right
             * during selection mode.
             */}
            {isMobileWidth && !isSelectModeActive && (
                <CategoryHopperFab
                    categories={categories}
                    activeGroupIndex={activeGroupIndex}
                    onJump={(idx) => scrollToGroup(idx)}
                />
            )}
        </>
    );
}
