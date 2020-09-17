import { useTranslation, Trans } from 'react-i18next';
import { useContext, FC, useState } from 'react';
import { LineChart, XAxis, YAxis, Line, Tooltip } from 'recharts';
import isNumber from 'lodash/isNumber';
import get from 'lodash/get';
import styled, { css, ThemeContext } from 'styled-components';
import format from 'date-fns/format';

import SnowflakeIcon from 'assets/svg/app/snowflake.svg';
import LoaderIcon from 'assets/svg/app/loader.svg';

import { Synth } from 'lib/synthetix';

import RechartsResponsiveContainer from 'components/RechartsResponsiveContainer';

import { CurrencyKey, SYNTHS_MAP } from 'constants/currency';
import { PeriodLabel, PERIOD_LABELS_MAP, PERIOD_LABELS, PERIOD_IN_HOURS } from 'constants/period';

import ChangePercent from 'components/ChangePercent';

import {
	GridDivCenteredCol,
	GridDivCenteredRow,
	TextButton,
	FlexDivRowCentered,
	NoTextTransform,
	AbsoluteCenteredDiv,
} from 'styles/common';

import { formatCurrency } from 'utils/formatters/number';

import useHistoricalRatesQuery from 'queries/rates/useHistoricalRatesQuery';
import media from 'styles/media';

type ChartCardProps = {
	currencyKey: CurrencyKey | null;
	priceRate: number | null;
	selectedPriceCurrency: Synth;
	selectPriceCurrencyRate: number | null;
	isSynthFrozen: boolean;
	className?: string;
};

const ChartCard: FC<ChartCardProps> = ({
	currencyKey,
	priceRate,
	selectedPriceCurrency,
	selectPriceCurrencyRate,
	isSynthFrozen,
	...rest
}) => {
	const [selectedPeriod, setSelectedPeriod] = useState<PeriodLabel>(PERIOD_LABELS_MAP.ONE_DAY);
	const theme = useContext(ThemeContext);
	const [currentPrice, setCurrentPrice] = useState<number | null>(null);

	const historicalRates = useHistoricalRatesQuery(currencyKey, selectedPeriod.period);

	const isSUSD = currencyKey === SYNTHS_MAP.sUSD;

	const change = historicalRates.data?.change ?? null;
	const rates = historicalRates.data?.rates ?? [];

	const isChangePositive = change != null && change >= 0;
	const chartColor = isChangePositive || isSUSD ? theme.colors.green : theme.colors.red;

	const price = currentPrice || priceRate;

	const showOverlayMessage = isSynthFrozen;
	const showLoader = historicalRates.isLoading;
	const disabledInteraction = showLoader || showOverlayMessage;
	const noData = historicalRates.isSuccess && historicalRates.data.rates.length === 0;

	const fontStyle = {
		fontSize: '12px',
		fill: theme.colors.white,
		fontFamily: theme.fonts.mono,
	};

	const { t } = useTranslation();

	const CustomTooltip = ({
		active,
		label,
		payload,
	}: {
		active: boolean;
		payload: [
			{
				value: number;
			}
		];
		label: Date;
	}) =>
		active && payload && payload[0] ? (
			<TooltipContentStyle>
				<LabelStyle>{format(label, 'do MMM yy | HH:mm')}</LabelStyle>
			</TooltipContentStyle>
		) : null;

	return (
		<Container {...rest}>
			<ChartHeader>
				<FlexDivRowCentered>
					{currencyKey != null ? (
						<>
							<CurrencyLabel>
								<Trans
									i18nKey="common.currency.currency-price"
									values={{ currencyKey }}
									components={[<NoTextTransform />]}
								/>
							</CurrencyLabel>
							{price != null && (
								<CurrencyPrice>
									{formatCurrency(selectedPriceCurrency.name, price, {
										sign: selectedPriceCurrency.sign,
									})}
								</CurrencyPrice>
							)}
							{change != null && <ChangePercent value={change} />}
						</>
					) : (
						<CurrencyLabel>{t('common.price')}</CurrencyLabel>
					)}
				</FlexDivRowCentered>
				<Actions>
					{PERIOD_LABELS.map((period) => (
						<StyledTextButton
							key={period.value}
							isActive={period.value === selectedPeriod.value}
							onClick={() => setSelectedPeriod(period)}
						>
							{t(period.i18nLabel)}
						</StyledTextButton>
					))}
				</Actions>
			</ChartHeader>
			<ChartBody>
				<ChartData
					disabledInteraction={disabledInteraction}
					semiTransparent={showLoader || showOverlayMessage}
				>
					<RechartsResponsiveContainer width="100%" height="100%">
						<LineChart
							data={rates.map((rateData) => ({
								...rateData,
								rate:
									selectPriceCurrencyRate != null
										? rateData.rate / selectPriceCurrencyRate
										: rateData.rate,
							}))}
							margin={{ right: 0, bottom: 0, left: 0, top: 0 }}
							onMouseMove={(e: any) => {
								const currentRate = get(e, 'activePayload[0].payload.rate', null);
								if (currentRate) {
									setCurrentPrice(currentRate);
								} else {
									setCurrentPrice(null);
								}
							}}
							onMouseLeave={(e: any) => {
								setCurrentPrice(null);
							}}
						>
							<XAxis
								// @ts-ignore
								dy={10}
								minTickGap={20}
								dataKey="timestamp"
								allowDataOverflow={true}
								tick={fontStyle}
								axisLine={false}
								tickLine={false}
								tickFormatter={(val) => {
									if (!isNumber(val)) {
										return '';
									}
									const periodOverOneDay =
										selectedPeriod != null && selectedPeriod.value > PERIOD_IN_HOURS.ONE_DAY;

									return format(val, periodOverOneDay ? 'dd MMM' : 'h:mma');
								}}
							/>
							<YAxis
								// TODO: might need to adjust the width to make sure we do not trim the values...
								type="number"
								allowDataOverflow={true}
								domain={isSUSD ? ['dataMax', 'dataMax'] : ['auto', 'auto']}
								tick={fontStyle}
								orientation="right"
								axisLine={false}
								tickLine={false}
								tickFormatter={(val) =>
									formatCurrency(selectedPriceCurrency.name, val, {
										sign: selectedPriceCurrency.sign,
									})
								}
							/>
							<Line
								dataKey="rate"
								stroke={chartColor}
								dot={false}
								strokeWidth={1.5}
								isAnimationActive={false}
							/>
							{currencyKey != null && !noData && (
								<Tooltip
									isAnimationActive={false}
									position={{
										y: 0,
									}}
									content={
										// @ts-ignore
										<CustomTooltip />
									}
								/>
							)}
						</LineChart>
					</RechartsResponsiveContainer>
				</ChartData>
				<AbsoluteCenteredDiv>
					{showOverlayMessage ? (
						<OverlayMessage>
							{isSynthFrozen && (
								<>
									<FrozenMessage>
										<SnowflakeIcon />
										<FrozenMessageTitle>
											{t('exchange.price-chart-card.overlay-messages.frozen-synth.title')}
										</FrozenMessageTitle>
										<FrozenMessageSubtitle>
											{t('exchange.price-chart-card.overlay-messages.frozen-synth.subtitle')}
										</FrozenMessageSubtitle>
									</FrozenMessage>
								</>
							)}
						</OverlayMessage>
					) : showLoader ? (
						<LoaderIcon />
					) : noData ? (
						<NoData>{t('exchange.price-chart-card.no-data')}</NoData>
					) : undefined}
				</AbsoluteCenteredDiv>
			</ChartBody>
		</Container>
	);
};

const Container = styled.div`
	width: 100%;
	position: relative;
`;

const ChartData = styled.div<{ disabledInteraction: boolean; semiTransparent: boolean }>`
	width: 100%;
	height: 100%;
	position: relative;
	${(props) =>
		props.disabledInteraction &&
		css`
			pointer-events: none;
		`};

	${(props) =>
		props.semiTransparent &&
		css`
			opacity: 0.5;
			filter: blur(3px);
		`}
`;

const ChartHeader = styled(FlexDivRowCentered)`
	border-bottom: 1px solid #171a1d;
	padding-bottom: 5px;
`;

const CurrencyLabel = styled.span`
	padding-right: 20px;
	font-size: 14px;
	text-transform: capitalize;
	color: ${(props) => props.theme.colors.white};
	font-family: ${(props) => props.theme.fonts.bold};
`;

const CurrencyPrice = styled.span`
	font-family: ${(props) => props.theme.fonts.mono};
	color: ${(props) => props.theme.colors.white};
	padding-right: 20px;
`;

const Actions = styled(GridDivCenteredCol)`
	grid-gap: 8px;
	${media.lessThan('sm')`
		overflow: auto;
		width: 100px;
	`}
`;

const ChartBody = styled.div`
	padding-top: 10px;
	height: 350px;
`;

const StyledTextButton = styled(TextButton)<{ isActive: boolean }>`
	color: ${(props) => (props.isActive ? props.theme.colors.white : props.theme.colors.blueberry)};
	border-bottom: 2px solid
		${(props) => (props.isActive ? props.theme.colors.purple : 'transparent')};
`;

const TooltipContentStyle = styled.div`
	padding: 5px;
	border-radius: 4px;
	background-color: ${(props) => props.theme.colors.elderberry};
	text-align: center;
`;

const ItemStyle = styled.div`
	color: ${(props) => props.theme.colors.white};
	padding: 3px 5px;
`;

const LabelStyle = styled(ItemStyle)`
	text-transform: capitalize;
`;

const OverlayMessage = styled.div`
	font-size: 14px;
`;

const FrozenMessage = styled(GridDivCenteredRow)`
	justify-items: center;
`;

const FrozenMessageTitle = styled.div`
	color: ${(props) => props.theme.colors.white};
	padding-top: 10px;
	padding-bottom: 5px;
`;

const FrozenMessageSubtitle = styled.div`
	color: ${(props) => props.theme.colors.white};
`;

const NoData = styled.div`
	font-size: 14px;
	color: ${(props) => props.theme.colors.white};
`;

export default ChartCard;