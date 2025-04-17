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
import { COLOR_SCALE, DEFAULT_COLOR, DEFAULT_COLOR_SCHEME, DEFAULT_METRIC, FILTERED_TABLE, TABLE, SELECTED_GROUP, COMPONENT_NAME } from '@constants';
import { getMarkOpacity, getTooltip, getTooltipProps, hasInteractiveChildren } from '@specBuilder/marks/markUtils';
// Added in these to match bar spec builder
import { addFieldToFacetScaleDomain } from '@specBuilder/scale/scaleSpecBuilder';
import { addHighlightedItemSignalEvents, addHighlightedSeriesSignalEvents } from '@specBuilder/signal/signalSpecBuilder';
import { sanitizeMarkChildren, toCamelCase } from '@utils';
import { produce } from 'immer';
import { Data, FilterTransform, FormulaTransform, Mark, Scale, Signal, Spec } from 'vega';

import { VennProps } from '../../types';
import type { ChartData, ColorScheme, HighlightedItem, VennSpecProps } from '../../types';
import { getInteractiveMarkName, getPopoverMarkName, getVennSolution } from './vennUtils';
import { addPopoverData, getPopovers } from '@specBuilder/chartPopover/chartPopoverUtils';

export const addVenn = produce<
	Spec,
	[
		VennProps & {
			color: string;
			colorScheme?: ColorScheme;
			highlightedItem?: HighlightedItem;
			index?: number;
			idKey: string;
			data: ChartData;
			interactiveMarkName?: string;
			popoverMarkName?: string;
			markType: string;
			dimension: string;
		}
	]
>(
	(
		spec,
		{
			normalize = false,
			orientation = Math.PI,
			name,
			metric = DEFAULT_METRIC,
			children,
			index = 0,
			color = DEFAULT_COLOR,
			colorScheme = DEFAULT_COLOR_SCHEME,
			data,
			idKey = "set",
			markType = "venn",
			dimension = "venn",
			...props
		}
	) => {
		const vennProps: VennSpecProps = {
			children: sanitizeMarkChildren(children),
			name: toCamelCase(name ?? `venn${index}`),
			dimension,
			markType: 'symbol',
			normalize,
			index,
			colorScheme,
			color,
			orientation,
			data: data,
			metric,
			idKey,
			interactiveMarkName: getInteractiveMarkName(sanitizeMarkChildren(children), toCamelCase(name ?? `venn${index}`), props.highlightedItem, props),
			popoverMarkName: getPopoverMarkName(sanitizeMarkChildren(children), toCamelCase(name ?? `venn${index}`)),
			...props,
		};
		spec.data = addData(spec.data ?? [], vennProps);
		spec.signals = addSignals(spec.signals ?? [], vennProps);
		spec.scales = addScales(spec.scales ?? [], vennProps);
		spec.marks = addMarks(spec.marks ?? [], vennProps);

	}
);

export const addData = produce<Data[], [VennSpecProps]>((data, props) => {
	const { circles, intersections } = getVennSolution(props);

	data.push({
		name: 'circles',
		values: circles,
		transform: [
			{ type: 'formula', as: 'rscSeriesId', expr: 'datum.set' },
			{ type: 'identifier', as: 'rscMarkId' },
		],
	});
	data.push({ name: 'intersections', values: intersections });

	const tableIndex = data.findIndex((d) => d.name === TABLE);
	data[tableIndex].transform = data[tableIndex].transform ?? [];
	data[tableIndex].transform?.push(...getVennTransforms());

	// Pass the proper idKey to addPopoverData
	addPopoverData(data, {
		...props,
		idKey: 'set',
	}, true);
});

export const addMarks = produce<Mark[], [VennSpecProps]>((marks, props) => {
	const popovers = getPopovers(props);
	const markName = props.name ?? 'venn';

	// Create circle mark
	marks.push({
		type: 'symbol',
		name: markName,
		from: { data: 'circles' },
		interactive: true,
		encode: {
			enter: {
				x: { field: 'x' },
				y: { field: 'y' },
				tooltip: getTooltip(props.children, props.name),
				size: { field: 'size' },
				shape: { value: 'circle' },
				fill: { scale: COLOR_SCALE, field: 'set' },
			},
			// This is how we handle the opacity of the circles for when there are popovers and we select a set
			update: {
				opacity: [
					{
						test: `${SELECTED_GROUP} && ${SELECTED_GROUP} == datum.set`,
						value: 1
					},
					{
						test: `${SELECTED_GROUP} && ${SELECTED_GROUP} !== datum.set`,
						value: 0.3
					},
					{
						value: .7
					}
				],
				// Add cursor pointer when there are popovers
				cursor: popovers.length ? { value: 'pointer' } : undefined,
			},
		}
	});

	marks.push({
		type: 'path',
		from: { data: 'intersections' },
		// This is the name of the mark
		name: `${markName}_intersections`,
		encode: {
			enter: {
				path: { field: 'path' },
				fill: { value: 'grey' },
				// This is the tooltip for the intersections
				tooltip: getTooltip(props.children, `${markName}`),
				fillOpacity: { value: 0 },
			},

			hover: {
				stroke: { value: 'black' },
				strokeWidth: { value: 1 },
				fill: { value: 'grey' },
			},

			update: {
				strokeWidth: { value: 0 },
			},
		},
	});

	// This is how we add text to the circles
	marks.push({
		type: 'text',
		from: { data: 'circles' },
		interactive: false,
		encode: {
			enter: {
				x: { field: 'textX' },
				y: { field: 'textY' },
				text: { field: 'set' },
				fontSize: { value: 20 },
				fill: { value: 'white' },
				fontWeight: { value: 'bold' },
				align: { value: 'center' },
				baseline: { value: 'middle' },
			},
		},
	});

	marks.push({
		type: 'text',
		from: { data: 'intersections' },
		interactive: false,
		encode: {
			enter: {
				x: { field: 'textX' },
				y: { field: 'textY' },
				text: { field: 'text' },
				fontSize: { value: 20 },
				fill: { value: 'white' },
				fontWeight: { value: 'bold' },
				align: { value: 'center' },
				baseline: { value: 'middle' },
			},
		},
	});
});

export const addScales = produce<Scale[], [VennSpecProps]>((scales, _props) => {
	addFieldToFacetScaleDomain(scales, COLOR_SCALE, 'set');
});

export const getVennTransforms = (): (FormulaTransform | FilterTransform)[] => [
	{
		type: 'filter',
		expr: `datum.sets.length <= 1`,
	},
	{
		type: 'formula',
		as: 'set',
		expr: `join(datum.sets, 'n')`,
	},
];

export const addSignals = produce<Signal[], [VennSpecProps]>((signals, props) => {
	const { children, name, idKey } = props;
	const popovers = getPopovers(props);
	
	// Make sure selectedGroup signal exists
	if (!signals.some(signal => signal.name === SELECTED_GROUP)) {
		signals.push({
			name: SELECTED_GROUP,
			value: null,
			on: [
				{
				events: {source: 'view', type: 'click', filter: "!event.item || !datum"},
				update: "null"
				}
			]
		});
	}
	
	// If we have popovers, add a click handler to update selectedGroup
	if (popovers.length) {
		const selectedGroupSignal = signals.find(signal => signal.name === SELECTED_GROUP);
		if (selectedGroupSignal) {
			if (!selectedGroupSignal.on) {
				selectedGroupSignal.on = [];
			}
			selectedGroupSignal.on.push({
				events: `@${name}:click`,
				update: `datum.set`  // This is the set name
			});
		}
	}

	if (!hasInteractiveChildren(children)) return;
	addHighlightedItemSignalEvents(signals, name, idKey, 1, getTooltipProps(children)?.excludeDataKeys);
	addHighlightedSeriesSignalEvents(signals, name, 1);
});

/*
export const transformTable = produce<Data[], [VennProps]>((data, props) => {
  const tableIndex = data.findIndex((d) => d.name === TABLE);
  data[tableIndex].transform = data[tableIndex].transform ?? [];

  // Could be a prop if want to include intersections in the legend
  data[tableIndex].transform.push({
    type: 'filter',
    expr: `datum.sets.length <= 1`,
  });

  data[tableIndex].transform.push({
    type: 'formula',
    as: 'set',
    expr: `join(datum.sets, 'n')`,
  });
});
*/
