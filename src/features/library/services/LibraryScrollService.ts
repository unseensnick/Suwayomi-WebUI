/*
 * Copyright (C) Contributors to the Suwayomi project
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */

/**
 * Module-scoped handler so the desktop sidebar's CategoryNavList can ask the
 * library page to scroll a specific category into view without a shared
 * React Context (sidebar and library are siblings under different routes).
 *
 * Library.tsx registers a handler on mount; CategoryNavList calls
 * `scrollToCategory(id)` on click. If no library is mounted (user is on
 * another route), `scrollToCategory` is a no-op and the link's default
 * navigation runs instead.
 *
 * Mirrors the `ReactRouter.setNavigateFn` pattern already used in the app.
 */

type ScrollHandler = (categoryId: number) => void;

let handler: ScrollHandler | null = null;

export const LibraryScrollService = {
    setHandler(fn: ScrollHandler | null) {
        handler = fn;
    },
    scrollToCategory(categoryId: number): boolean {
        if (!handler) {return false;}
        handler(categoryId);
        return true;
    },
};
