/*
 * Copyright (C) Contributors to the Suwayomi project
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */

import { useCallback, type RefObject } from 'react';
import type { PopupState } from 'material-ui-popup-state/hooks';
import { MediaQuery } from '@/base/utils/MediaQuery.tsx';

/**
 * Wires the desktop right-click → action-menu behavior on manga cards.
 *
 * - Touch devices: only prevents the native context menu — long-press
 *   already opens the same menu via `useLongPress` in MangaCard.
 * - Desktop: prevents the native browser menu and opens the popup
 *   anchored to the card's option button (same anchor as long-press,
 *   for visual consistency).
 *
 * Use the returned handler as `onContextMenu` on the card root.
 */
export const useMangaCardContextMenu = (
    popupState: PopupState,
    optionButtonRef: RefObject<HTMLButtonElement | null>,
) => {
    const isTouchDevice = MediaQuery.useIsTouchDevice();

    return useCallback(
        (e: React.MouseEvent) => {
            e.preventDefault();
            if (isTouchDevice) {
                return;
            }
            popupState.open(optionButtonRef.current);
        },
        [isTouchDevice, popupState, optionButtonRef],
    );
};
