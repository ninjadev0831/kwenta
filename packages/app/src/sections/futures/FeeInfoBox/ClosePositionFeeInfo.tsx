import { ZERO_WEI } from '@kwenta/sdk/constants'
import { memo } from 'react'

import {
	selectClosePositionOrderInputs,
	selectClosePositionPreview,
	selectSmartMarginKeeperDeposit,
	selectEditPositionModalInfo,
} from 'state/futures/selectors'
import { useAppSelector } from 'state/hooks'

import FeesRow from './FeesRow'

const ClosePositionFeeInfo = memo(() => {
	const tradePreview = useAppSelector(selectClosePositionPreview)
	const { market } = useAppSelector(selectEditPositionModalInfo)
	const keeperEthDeposit = useAppSelector(selectSmartMarginKeeperDeposit)
	const { orderType } = useAppSelector(selectClosePositionOrderInputs)

	return (
		<FeesRow
			executionFee={market?.keeperDeposit ?? ZERO_WEI}
			tradeFee={tradePreview?.fee ?? ZERO_WEI}
			orderType={orderType}
			smartMarginKeeperDeposit={keeperEthDeposit}
			rates={{
				maker: market?.feeRates.makerFeeOffchainDelayedOrder ?? ZERO_WEI,
				taker: market?.feeRates.takerFeeOffchainDelayedOrder ?? ZERO_WEI,
			}}
		/>
	)
})

export default ClosePositionFeeInfo
