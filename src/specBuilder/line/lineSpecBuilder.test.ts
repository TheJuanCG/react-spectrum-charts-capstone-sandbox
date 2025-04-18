/*
 * Copyright 2023 Adobe. All rights reserved.
 * This file is licensed to you under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License. You may obtain a copy
 * of the License at http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software distributed under
 * the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR REPRESENTATIONS
 * OF ANY KIND, either express or implied. See the License for the specific language
 * governing permissions and limitations under the License.
 */
import { createElement } from 'react';

import { ChartTooltip } from '@components/ChartTooltip';
import { MetricRange } from '@components/MetricRange';
import { Trendline } from '@components/Trendline';
import {
	BACKGROUND_COLOR,
	COLOR_SCALE,
	DEFAULT_COLOR,
	DEFAULT_COLOR_SCHEME,
	DEFAULT_METRIC,
	DEFAULT_OPACITY_RULE,
	DEFAULT_TIME_DIMENSION,
	DEFAULT_TRANSFORMED_TIME_DIMENSION,
	FILTERED_TABLE,
	HIGHLIGHTED_ITEM,
	HIGHLIGHTED_SERIES,
	LINEAR_PADDING,
	MARK_ID,
	SERIES_ID,
	TABLE,
	TRENDLINE_VALUE,
} from '@constants';
import { defaultSignals } from '@specBuilder/specTestUtils';
import { Data, Spec } from 'vega';

import { LineSpecProps, MetricRangeElement, MetricRangeProps } from '../../types';
import * as signalSpecBuilder from '../signal/signalSpecBuilder';
import { initializeSpec } from '../specUtils';
import { addData, addLine, addLineMarks, addSignals, setScales } from './lineSpecBuilder';

const defaultLineProps: LineSpecProps = {
	children: [],
	name: 'line0',
	dimension: DEFAULT_TIME_DIMENSION,
	idKey: MARK_ID,
	index: 0,
	markType: 'line',
	metric: DEFAULT_METRIC,
	color: DEFAULT_COLOR,
	scaleType: 'time',
	lineType: { value: 'solid' },
	opacity: { value: 1 },
	colorScheme: DEFAULT_COLOR_SCHEME,
	interactiveMarkName: undefined,
	popoverMarkName: undefined,
};

const getMetricRangeElement = (props?: Partial<MetricRangeProps>): MetricRangeElement =>
	createElement(MetricRange, {
		metricEnd: 'end',
		metricStart: 'start',
		...props,
	});

const startingSpec: Spec = initializeSpec({
	scales: [{ name: COLOR_SCALE, type: 'ordinal' }],
});

const defaultSpec = initializeSpec({
	data: [
		{
			name: TABLE,
			transform: [
				{ as: MARK_ID, type: 'identifier' },
				{
					type: 'formula',
					expr: `toDate(datum[\"${DEFAULT_TIME_DIMENSION}\"])`,
					as: DEFAULT_TIME_DIMENSION,
				},
				{
					as: [DEFAULT_TRANSFORMED_TIME_DIMENSION, `${DEFAULT_TIME_DIMENSION}1`],
					field: DEFAULT_TIME_DIMENSION,
					type: 'timeunit',
					units: ['year', 'month', 'date', 'hours', 'minutes'],
				},
			],
			values: [],
		},
		{
			name: FILTERED_TABLE,
			source: TABLE,
		},
	],
	marks: [
		{
			from: { facet: { data: FILTERED_TABLE, groupby: [DEFAULT_COLOR], name: 'line0_facet' } },
			marks: [
				{
					encode: {
						enter: {
							stroke: { field: DEFAULT_COLOR, scale: COLOR_SCALE },
							strokeDash: { value: [] },
							strokeOpacity: DEFAULT_OPACITY_RULE,
							strokeWidth: undefined,
							y: { field: 'value', scale: 'yLinear' },
						},
						update: {
							x: { field: DEFAULT_TRANSFORMED_TIME_DIMENSION, scale: 'xTime' },
							opacity: [DEFAULT_OPACITY_RULE],
						},
					},
					from: { data: 'line0_facet' },
					name: 'line0',
					description: 'line0',
					type: 'line',
					interactive: false,
				},
			],
			name: 'line0_group',
			type: 'group',
		},
	],
	scales: [
		{ domain: { data: TABLE, fields: [DEFAULT_COLOR] }, name: COLOR_SCALE, type: 'ordinal' },
		{
			domain: { data: FILTERED_TABLE, fields: [DEFAULT_TRANSFORMED_TIME_DIMENSION] },
			name: 'xTime',
			padding: LINEAR_PADDING,
			range: 'width',
			type: 'time',
		},
		{
			domain: { data: FILTERED_TABLE, fields: ['value'] },
			name: 'yLinear',
			nice: true,
			range: 'height',
			type: 'linear',
			zero: true,
		},
	],
	signals: [],
});

const defaultLinearScale = {
	domain: { data: FILTERED_TABLE, fields: [DEFAULT_TIME_DIMENSION] },
	name: 'xLinear',
	padding: LINEAR_PADDING,
	range: 'width',
	type: 'linear',
};

const defaultPointScale = {
	domain: { data: FILTERED_TABLE, fields: [DEFAULT_TIME_DIMENSION] },
	name: 'xPoint',
	paddingOuter: 0.5,
	range: 'width',
	type: 'point',
};

const line0_groupMark = {
	name: 'line0_group',
	type: 'group',
	from: {
		facet: {
			name: 'line0_facet',
			data: FILTERED_TABLE,
			groupby: ['series'],
		},
	},
	marks: [
		{
			name: 'line0',
			description: 'line0',
			type: 'line',
			from: {
				data: 'line0_facet',
			},
			interactive: false,
			encode: {
				enter: {
					y: { scale: 'yLinear', field: 'value' },
					stroke: { scale: COLOR_SCALE, field: 'series' },
					strokeDash: { value: [] },
					strokeOpacity: DEFAULT_OPACITY_RULE,
					strokeWidth: undefined,
				},
				update: {
					x: { scale: 'xTime', field: DEFAULT_TRANSFORMED_TIME_DIMENSION },
					opacity: [DEFAULT_OPACITY_RULE],
				},
			},
		},
	],
};

const metricRangeGroupMark = {
	name: 'line0MetricRange0_group',
	type: 'group',
	clip: true,
	from: {
		facet: {
			name: 'line0MetricRange0_facet',
			data: FILTERED_TABLE,
			groupby: ['series'],
		},
	},
	marks: [
		{
			name: 'line0MetricRange0_line',
			description: 'line0MetricRange0_line',
			type: 'line',
			from: {
				data: 'line0MetricRange0_facet',
			},
			interactive: false,
			encode: {
				enter: {
					y: {
						scale: 'yLinear',
						field: 'value',
					},
					stroke: {
						scale: COLOR_SCALE,
						field: 'series',
					},
					strokeDash: {
						value: [7, 4],
					},
					strokeOpacity: DEFAULT_OPACITY_RULE,
					strokeWidth: {
						value: 1.5,
					},
				},
				update: {
					x: {
						scale: 'xTime',
						field: DEFAULT_TRANSFORMED_TIME_DIMENSION,
					},
					opacity: [DEFAULT_OPACITY_RULE],
				},
			},
		},
		{
			name: 'line0MetricRange0_area',
			description: 'line0MetricRange0_area',
			type: 'area',
			from: {
				data: 'line0MetricRange0_facet',
			},
			interactive: false,
			encode: {
				enter: {
					y: {
						field: 'start',
						scale: 'yLinear',
					},
					y2: {
						field: 'end',
						scale: 'yLinear',
					},
					fill: {
						scale: COLOR_SCALE,
						field: 'series',
					},
					tooltip: undefined,
				},
				update: {
					cursor: undefined,
					x: {
						scale: 'xTime',
						field: DEFAULT_TRANSFORMED_TIME_DIMENSION,
					},
					fillOpacity: { value: 0.2 },
					opacity: [DEFAULT_OPACITY_RULE],
				},
			},
		},
	],
};

const metricRangeMarks = [line0_groupMark, metricRangeGroupMark];

const metricRangeWithDisplayPointMarks = [
	line0_groupMark,
	{
		name: 'line0_staticPoints',
		description: 'line0_staticPoints',
		type: 'symbol',
		from: {
			data: 'line0_staticPointData',
		},
		interactive: false,
		encode: {
			enter: {
				y: {
					scale: 'yLinear',
					field: 'value',
				},
				size: {
					value: 125,
				},
				fill: {
					scale: COLOR_SCALE,
					field: 'series',
				},
				stroke: {
					signal: BACKGROUND_COLOR,
				},
			},
			update: {
				x: {
					scale: 'xTime',
					field: DEFAULT_TRANSFORMED_TIME_DIMENSION,
				},
			},
		},
	},
	metricRangeGroupMark,
];

const displayPointMarks = [
	line0_groupMark,
	{
		name: 'line0_staticPoints',
		description: 'line0_staticPoints',
		type: 'symbol',
		from: {
			data: 'line0_staticPointData',
		},
		interactive: false,
		encode: {
			enter: {
				y: {
					scale: 'yLinear',
					field: 'value',
				},
				size: {
					value: 125,
				},
				fill: {
					scale: COLOR_SCALE,
					field: 'series',
				},
				stroke: {
					signal: BACKGROUND_COLOR,
				},
			},
			update: {
				x: {
					scale: 'xTime',
					field: DEFAULT_TRANSFORMED_TIME_DIMENSION,
				},
			},
		},
	},
];

describe('lineSpecBuilder', () => {
	describe('addLine()', () => {
		test('should add line', () => {
			expect(addLine(startingSpec, { idKey: MARK_ID, color: DEFAULT_COLOR })).toStrictEqual(defaultSpec);
		});
	});

	describe('addData()', () => {
		let baseData: Data[];

		beforeEach(() => {
			baseData = initializeSpec().data ?? [];
		});

		test('basic', () => {
			expect(addData(baseData, defaultLineProps)).toStrictEqual(defaultSpec.data);
		});

		test('scaleTypes "point" and "linear" should return the original data', () => {
			expect(addData(baseData, { ...defaultLineProps, scaleType: 'point' })).toEqual(baseData);
			expect(addData(baseData, { ...defaultLineProps, scaleType: 'linear' })).toEqual(baseData);
		});

		test('should add trendline transform', () => {
			expect(
				addData(baseData, {
					...defaultLineProps,
					children: [createElement(Trendline, { method: 'average' })],
				})[2].transform
			).toStrictEqual([
				{
					as: [TRENDLINE_VALUE, `${DEFAULT_TIME_DIMENSION}Min`, `${DEFAULT_TIME_DIMENSION}Max`],
					fields: [DEFAULT_METRIC, DEFAULT_TIME_DIMENSION, DEFAULT_TIME_DIMENSION],
					groupby: [DEFAULT_COLOR],
					ops: ['mean', 'min', 'max'],
					type: 'aggregate',
				},
				{ as: SERIES_ID, expr: `datum.${DEFAULT_COLOR}`, type: 'formula' },
			]);
		});

		test('should not do anything for movingAverage trendline since it is not supported yet', () => {
			expect(
				addData(baseData, {
					...defaultLineProps,
					children: [createElement(Trendline, { method: 'movingAverage-7' })],
				})[0].transform
			).toHaveLength(3);
		});

		test('adds point data if displayPointMark is not undefined', () => {
			const resultData = addData(baseData ?? [], {
				...defaultLineProps,
				staticPoint: 'staticPoint',
			});
			expect(resultData.find((data) => data.name === 'line0_staticPointData')).toStrictEqual({
				name: 'line0_staticPointData',
				source: FILTERED_TABLE,
				transform: [{ expr: 'datum.staticPoint === true', type: 'filter' }],
			});
		});
	});

	describe('setScales()', () => {
		test('time', () => {
			expect(setScales(startingSpec.scales ?? [], defaultLineProps)).toStrictEqual(defaultSpec.scales);
		});

		test('linear', () => {
			expect(
				setScales(startingSpec.scales ?? [], {
					...defaultLineProps,
					scaleType: 'linear',
				})
			).toStrictEqual([defaultSpec.scales?.[0], defaultLinearScale, defaultSpec.scales?.[2]]);
		});

		test('point', () => {
			expect(
				setScales(startingSpec.scales ?? [], {
					...defaultLineProps,
					scaleType: 'point',
				})
			).toStrictEqual([defaultSpec.scales?.[0], defaultPointScale, defaultSpec.scales?.[2]]);
		});

		test('with metric range fields', () => {
			const [metricStart, metricEnd] = ['metricStart', 'metricEnd'];
			const metricRangeMetricScale = {
				...defaultSpec.scales?.[2],
				domain: {
					...defaultSpec.scales?.[2].domain,
					fields: ['value', metricStart, metricEnd],
				},
			};
			expect(
				setScales(startingSpec.scales ?? [], {
					...defaultLineProps,
					children: [createElement(MetricRange, { scaleAxisToFit: true, metricEnd, metricStart })],
				})
			).toStrictEqual([defaultSpec.scales?.[0], defaultSpec.scales?.[1], metricRangeMetricScale]);
		});
	});

	describe('addLineMarks()', () => {
		test('basic', () => {
			expect(addLineMarks([], defaultLineProps)).toStrictEqual(defaultSpec.marks);
		});

		test('dashed', () => {
			expect(addLineMarks([], { ...defaultLineProps, lineType: { value: [8, 8] } })).toStrictEqual([
				{
					from: { facet: { data: FILTERED_TABLE, groupby: [DEFAULT_COLOR], name: 'line0_facet' } },
					marks: [
						{
							encode: {
								enter: {
									stroke: { field: DEFAULT_COLOR, scale: COLOR_SCALE },
									strokeOpacity: DEFAULT_OPACITY_RULE,
									strokeDash: { value: [8, 8] },
									strokeWidth: undefined,
									y: { field: 'value', scale: 'yLinear' },
								},
								update: {
									x: { field: DEFAULT_TRANSFORMED_TIME_DIMENSION, scale: 'xTime' },
									opacity: [DEFAULT_OPACITY_RULE],
								},
							},
							from: { data: 'line0_facet' },
							name: 'line0',
							description: 'line0',
							type: 'line',
							interactive: false,
						},
					],
					name: 'line0_group',
					type: 'group',
				},
			]);
		});

		test('with metric range', () => {
			expect(addLineMarks([], { ...defaultLineProps, children: [getMetricRangeElement()] })).toStrictEqual(
				metricRangeMarks
			);
		});

		test('with displayPointMark', () => {
			expect(addLineMarks([], { ...defaultLineProps, staticPoint: 'staticPoint' })).toStrictEqual(
				displayPointMarks
			);
		});

		test('with displayPointMark and metric range', () => {
			expect(
				addLineMarks([], {
					...defaultLineProps,
					staticPoint: 'staticPoint',
					children: [getMetricRangeElement()],
				})
			).toStrictEqual(metricRangeWithDisplayPointMarks);
		});

		test('with onClick should add hover marks', () => {
			const marks = addLineMarks([], { ...defaultLineProps, onClick: jest.fn() });

			const voronoiPathMark = marks.at(-1);
			expect(voronoiPathMark?.description).toBe('line0_voronoi');
			expect(voronoiPathMark?.encode?.update?.cursor).toStrictEqual({ value: 'pointer' });

			const voronoiPointsMark = marks.at(-2);
			expect(voronoiPointsMark?.description).toBe('line0_pointsForVoronoi');
		});
	});

	describe('addSignals()', () => {
		test('on children', () => {
			expect(addSignals([], defaultLineProps)).toStrictEqual([]);
		});

		test('does not add selected series if it already exists', () => {
			const hasSignalByNameSpy = jest.spyOn(signalSpecBuilder, 'hasSignalByName');
			expect(
				addSignals(
					[
						{
							name: 'line0_selectedSeries',
							value: null,
						},
					],
					defaultLineProps
				)
			).toStrictEqual([
				{
					name: 'line0_selectedSeries',
					value: null,
				},
			]);

			expect(hasSignalByNameSpy).not.toHaveBeenCalled();
		});

		test('hover signals with metric range', () => {
			const signals = addSignals(defaultSignals, {
				...defaultLineProps,
				children: [getMetricRangeElement({ displayOnHover: true })],
			});
			expect(signals).toHaveLength(defaultSignals.length);
			expect(signals[0]).toHaveProperty('name', HIGHLIGHTED_ITEM);
			expect(signals[0].on).toHaveLength(2);
			expect(signals[2]).toHaveProperty('name', HIGHLIGHTED_SERIES);
			expect(signals[2].on).toHaveLength(2);
		});

		test('adds hover signals when displayPointMark is not undefined', () => {
			expect(addSignals([], { ...defaultLineProps, staticPoint: 'staticPoint' })).toStrictEqual([]);
		});

		test('adds hover signals with metric range when displayPointMark is not undefined', () => {
			const signals = addSignals(defaultSignals, {
				...defaultLineProps,
				staticPoint: 'staticPoint',
				children: [getMetricRangeElement({ displayOnHover: true })],
			});
			expect(signals).toHaveLength(defaultSignals.length);
			expect(signals[0]).toHaveProperty('name', HIGHLIGHTED_ITEM);
			expect(signals[0].on).toHaveLength(2);
			expect(signals[2]).toHaveProperty('name', HIGHLIGHTED_SERIES);
			expect(signals[2].on).toHaveLength(2);
		});

		test('hover signals with interactionMode item', () => {
			const signals = addSignals(defaultSignals, {
				...defaultLineProps,
				interactionMode: 'item',
				children: [createElement(ChartTooltip)],
			});
			expect(signals).toHaveLength(defaultSignals.length);
			expect(signals[0]).toHaveProperty('name', HIGHLIGHTED_ITEM);
			expect(signals[0].on).toHaveLength(8);
			expect(signals[2]).toHaveProperty('name', HIGHLIGHTED_SERIES);
			expect(signals[2].on).toHaveLength(8);
		});
	});
});
