/*
 * Copyright (C) Contributors to the Suwayomi project
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */

import type { MutableRefObject } from 'react';
import { useEffect, useRef } from 'react';
import { ReaderControls } from '@/features/reader/services/ReaderControls.ts';
import {
    isContinuousReadingMode,
    isContinuousVerticalReadingMode,
} from '@/features/reader/settings/ReaderSettings.utils.tsx';
import type { ReadingMode } from '@/features/reader/Reader.types.ts';

const TRIGGER_THRESHOLD_PX = 100;
const POST_TRIGGER_COOLDOWN_MS = 800;

/**
 * Wheel-event entry point for chapter advance at scroll boundaries.
 *
 * In continuous reading modes (Webtoon / Continuous Vertical / Continuous
 * Horizontal), the existing tap-zone and hotkey paths already call
 * `ReaderControls.openChapter('previous' | 'next')` when the scroll
 * container is at start/end. This hook adds the wheel path: once the user
 * is at a boundary, scrolling further in the same direction accumulates
 * up to a small threshold (~100px); when the threshold is crossed, the
 * next/previous chapter loads.
 *
 * Direction reversal resets the accumulator (so brushing the boundary by
 * accident doesn't queue an advance), and a brief cooldown after firing
 * keeps a single deliberate scroll gesture from advancing two chapters
 * in a row.
 *
 * Bounded by `shouldUseInfiniteScroll` so users who explicitly opt out of
 * cross-chapter scrolling don't get surprised.
 */
export const useReaderWheelOverscrollChapterAdvance = (
    scrollElementRef: MutableRefObject<HTMLDivElement | null>,
    readingMode: ReadingMode,
    shouldUseInfiniteScroll: boolean,
) => {
    const accumulatorRef = useRef(0);
    const lastSignRef = useRef(0);
    const cooldownRef = useRef(false);

    useEffect(() => {
        const el = scrollElementRef.current;
        if (!el) {
            return undefined;
        }
        if (!shouldUseInfiniteScroll || !isContinuousReadingMode(readingMode)) {
            return undefined;
        }

        const isVertical = isContinuousVerticalReadingMode(readingMode);

        const onWheel = (e: WheelEvent) => {
            if (cooldownRef.current) {
                return;
            }

            // Vertical continuous modes consume deltaY exclusively. Horizontal
            // continuous mode commonly receives deltaY from a vertical mouse
            // wheel (browsers translate it to horizontal scroll); fall back to
            // deltaX when present so trackpad horizontal swipes also count.
            const delta = isVertical ? e.deltaY : e.deltaX || e.deltaY;
            const sign = Math.sign(delta);
            if (sign === 0) {
                return;
            }

            if (sign !== lastSignRef.current) {
                accumulatorRef.current = 0;
                lastSignRef.current = sign;
            }

            // `Math.abs(scrollLeft)` mirrors the start/end checks in
            // `ReaderControls.scroll()` and works for both LTR and RTL.
            const isAtStart = isVertical ? Math.abs(el.scrollTop) <= 1 : Math.floor(Math.abs(el.scrollLeft)) === 0;
            const maxScroll = isVertical ? el.scrollHeight - el.clientHeight : el.scrollWidth - el.clientWidth;
            const currentScroll = isVertical ? el.scrollTop : Math.abs(el.scrollLeft);
            const isAtEnd = Math.floor(currentScroll) >= maxScroll - 1;

            const wheelingForward = sign > 0;
            const onForwardBoundary = wheelingForward && isAtEnd;
            const onBackwardBoundary = !wheelingForward && isAtStart;
            if (!onForwardBoundary && !onBackwardBoundary) {
                accumulatorRef.current = 0;
                return;
            }

            accumulatorRef.current += delta;

            if (Math.abs(accumulatorRef.current) >= TRIGGER_THRESHOLD_PX) {
                accumulatorRef.current = 0;
                cooldownRef.current = true;
                ReaderControls.openChapter(wheelingForward ? 'next' : 'previous');
                setTimeout(() => {
                    cooldownRef.current = false;
                }, POST_TRIGGER_COOLDOWN_MS);
            }
        };

        el.addEventListener('wheel', onWheel, { passive: true });
        return () => {
            el.removeEventListener('wheel', onWheel);
            accumulatorRef.current = 0;
            lastSignRef.current = 0;
            cooldownRef.current = false;
        };
    }, [scrollElementRef, readingMode, shouldUseInfiniteScroll]);
};
