import { SynthBalance, TokenBalances } from '@kwenta/sdk/types'
import Wei from '@synthetixio/wei'

import { FetchStatus } from 'state/types'

export type BalancesState = {
	status: FetchStatus
	error: string | undefined
	synthBalances: SynthBalance<string>[]
	synthBalancesMap: Record<string, SynthBalance<string>>
	totalUSDBalance?: string
	susdWalletBalance?: string
	tokenBalances: TokenBalances<string>
}

export type BalancesActionReturn<T = Wei> = {
	synthBalances: SynthBalance<T>[]
	synthBalancesMap: Record<string, SynthBalance<T>>
	totalUSDBalance: T
	susdWalletBalance: T
	tokenBalances: TokenBalances<string>
}
