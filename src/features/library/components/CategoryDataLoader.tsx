/*
 * Copyright (C) Contributors to the Suwayomi project
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */

import { memo, useEffect } from 'react';
import { useGetVisibleLibraryMangas } from '@/features/library/hooks/useGetVisibleLibraryMangas.ts';
import type { GetCategoriesLibraryQuery } from '@/lib/graphql/generated/graphql.ts';
import { requestManager } from '@/lib/requests/RequestManager.ts';
import { STABLE_EMPTY_ARRAY } from '@/base/Base.constants.ts';

type Category = NonNullable<GetCategoriesLibraryQuery['categories']>['nodes'][number];

type LibraryManga = NonNullable<
    ReturnType<typeof requestManager.useGetCategoryMangas>['data']
>['mangas']['nodes'][number];

interface CategoryDataLoaderProps {
    category: Category;
    onData: (categoryId: number, mangas: LibraryManga[], totalCount: number) => void;
}

/**
 * Per-category data loader. Renders nothing — it exists so each category's
 * Apollo query and per-category filter/sort hook can run in their own
 * component (hooks can't be called in a `.map`).
 *
 * The composed manga list is reported up via `onData` so the parent can
 * assemble all categories' lists into a single flat structure for one
 * `<GroupedVirtuoso>` instance.
 *
 * Skipping per-category fetch when collapsed is intentionally NOT done here
 * — `useGetCategoryMangas` returns from the Apollo cache cheaply on
 * subsequent collapses/expands, and skipping would cause data flicker.
 */
export const CategoryDataLoader = memo(({ category, onData }: CategoryDataLoaderProps) => {
    const { data: categoryMangaResponse } = requestManager.useGetCategoryMangas(category.id);
    const categoryMangas = categoryMangaResponse?.mangas.nodes ?? STABLE_EMPTY_ARRAY;
    const { visibleMangas } = useGetVisibleLibraryMangas(categoryMangas, category);

    useEffect(() => {
        onData(category.id, visibleMangas, categoryMangas.length);
    }, [category.id, visibleMangas, categoryMangas.length, onData]);

    return null;
});
CategoryDataLoader.displayName = 'CategoryDataLoader';
