/*
 * Copyright (C) Contributors to the Suwayomi project
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */

import IconButton from '@mui/material/IconButton';
import RefreshIcon from '@mui/icons-material/Refresh';
import ClearIcon from '@mui/icons-material/Clear';
import CircularProgress from '@mui/material/CircularProgress';
import Stack from '@mui/material/Stack';
import { useLingui } from '@lingui/react/macro';
import { memo, useEffect, useState } from 'react';
import { CustomTooltip } from '@/base/components/CustomTooltip.tsx';
import { MediaQuery } from '@/base/utils/MediaQuery.tsx';
import { makeToast } from '@/base/utils/Toast.ts';
import { defaultPromiseErrorHandler } from '@/lib/DefaultPromiseErrorHandler.ts';
import { getErrorMessage } from '@/lib/HelperFunctions.ts';
import { requestManager } from '@/lib/requests/RequestManager.ts';
import type { CategoryIdInfo } from '@/features/category/Category.types.ts';
import { CategoryJobStatus } from '@/lib/graphql/generated/graphql.ts';

interface CategoryRefreshButtonProps {
    categoryId: CategoryIdInfo['id'];
}

/**
 * Per-category refresh button used inside CategoryHeader.
 *
 * Click → `requestManager.startGlobalUpdate([categoryId])` (the server
 * filters the run to the requested categories). Click while THIS
 * category is updating → `resetGlobalUpdate()`.
 *
 * Active feedback comes from `categoryUpdates`, the per-category job
 * status array on `libraryUpdateStatus`. The button only spins when
 * its own category appears with status UPDATING, so triggering an
 * update on Category A doesn't make every other section's button spin
 * (the previous version checked the global `isRunning` flag and was
 * indistinguishable across sections — the user reported it looked
 * like all categories were refreshing).
 *
 * A short local "pending" state covers the ~250ms gap between the
 * mutation firing and the server-side `categoryUpdates` reflecting
 * it; without this the spinner would only appear after the first
 * subscription tick.
 */
export const CategoryRefreshButton = memo(({ categoryId }: CategoryRefreshButtonProps) => {
    const { t } = useLingui();
    const isTouchDevice = MediaQuery.useIsTouchDevice();

    const [isHovered, setIsHovered] = useState(false);
    const [pending, setPending] = useState(false);

    const { data: updaterData } = requestManager.useGetGlobalUpdateSummary();
    const categoryUpdates = updaterData?.libraryUpdateStatus.categoryUpdates ?? [];
    const isThisCategoryUpdating = categoryUpdates.some(
        (cu) => cu.category.id === categoryId && cu.status === CategoryJobStatus.Updating,
    );
    const showSpinner = pending || isThisCategoryUpdating;

    // Clear the optimistic "pending" flag once the server confirms (the
    // category appears in updates) or the run finishes without picking
    // it up (server skipped it — e.g. nothing to fetch).
    useEffect(() => {
        if (!pending) {return;}
        const isRunning = !!updaterData?.libraryUpdateStatus.jobsInfo.isRunning;
        if (isThisCategoryUpdating || !isRunning) {
            setPending(false);
        }
    }, [pending, isThisCategoryUpdating, updaterData?.libraryUpdateStatus.jobsInfo.isRunning]);

    const handleClick = async () => {
        try {
            if (showSpinner) {
                await requestManager.resetGlobalUpdate();
            } else {
                setPending(true);
                await requestManager.startGlobalUpdate([categoryId]).response;
            }
        } catch (e) {
            setPending(false);
            makeToast(
                showSpinner ? t`Could not stop update` : t`Could not check for updates`,
                'error',
                getErrorMessage(e),
            );
        }
    };

    return (
        <CustomTooltip title={showSpinner ? t`Stop update` : t`Refresh this category`}>
            <IconButton
                size="small"
                sx={{ position: 'relative' }}
                onClick={(e) => {
                    e.stopPropagation();
                    handleClick().catch(defaultPromiseErrorHandler('CategoryRefreshButton::handleClick'));
                }}
                onMouseEnter={() => setIsHovered(true)}
                onMouseLeave={() => setIsHovered(false)}
                color="inherit"
                aria-label={showSpinner ? t`Stop update` : t`Refresh this category`}
            >
                {!showSpinner ? (
                    <RefreshIcon fontSize="small" />
                ) : (
                    <>
                        <ClearIcon fontSize="small" sx={{ opacity: Number(isTouchDevice || isHovered) }} />
                        <Stack sx={{ position: 'absolute' }}>
                            <CircularProgress
                                size={18}
                                color="inherit"
                                sx={{ opacity: Number(!(isTouchDevice || isHovered)) }}
                            />
                        </Stack>
                    </>
                )}
            </IconButton>
        </CustomTooltip>
    );
});
CategoryRefreshButton.displayName = 'CategoryRefreshButton';
