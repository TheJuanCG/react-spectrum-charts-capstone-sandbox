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
import { COLOR_SCALE, DEFAULT_COLOR, DEFAULT_COLOR_SCHEME, DEFAULT_METRIC, FILTERED_TABLE, TABLE } from '@constants';
import { getTooltip, getTooltipProps, hasInteractiveChildren } from '@specBuilder/marks/markUtils';
// Added in these to match bar spec builder
import { addFieldToFacetScaleDomain } from '@specBuilder/scale/scaleSpecBuilder';
import { addHighlightedItemSignalEvents } from '@specBuilder/signal/signalSpecBuilder';
import { sanitizeMarkChildren, toCamelCase } from '@utils';
import { produce } from 'immer';
import { Data, FilterTransform, FormulaTransform, Mark, Scale, Signal, Spec } from 'vega';

import { VennProps } from '../../types';
import type { ChartData, ColorScheme, HighlightedItem, VennSpecProps } from '../../types';
import { getVennSolution } from './vennUtils';

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
		}
	]
>(
	(
		spec,
		{
			normalize = false,
			orientation = Math.PI,
			name,
			children,
			index = 0,
			color = DEFAULT_COLOR,
			colorScheme = DEFAULT_COLOR_SCHEME,
			data,
			...props
		}
	) => {
		const vennProps: VennSpecProps = {
			children: sanitizeMarkChildren(children),
			name: toCamelCase(name ?? `venn${index}`),
			normalize,
			index,
			colorScheme,
			color,
			orientation,
			data: data,
			...props,
		};
		spec.data = addData(spec.data ?? [], vennProps);
		spec.marks = addMarks(spec.marks ?? [], vennProps);
		spec.scales = addScales(spec.scales ?? [], vennProps);
		spec.signals = addSignals(spec.signals ?? [], vennProps);
	}
);

export const addData = produce<Data[], [VennSpecProps]>((data, props) => {
	const { circles, intersections } = getVennSolution({
		data: props.data,
		orientation: props.orientation,
		normalize: props.normalize,
	});

	data.push({ name: 'circles', values: circles });
	data.push({ name: 'intersections', values: intersections });

	const tableIndex = data.findIndex((d) => d.name === TABLE);
	data[tableIndex].transform = data[tableIndex].transform ?? [];
	data[tableIndex].transform?.push(...getVennTransforms());
});

export const addMarks = produce<Mark[], [VennSpecProps]>((marks, props) => {
	marks.push({
		type: 'symbol',
		name: props.name,
		from: { data: 'circles' },
		encode: {
			enter: {
				x: { field: 'x' },
				y: { field: 'y' },
				tooltip: getTooltip(props.children, props.name),
				size: { field: 'size' },
				shape: { value: 'circle' },
				fillOpacity: { value: 0.3 },
				fill: { scale: COLOR_SCALE, field: 'set' },
			},
			hover: {
				fillOpacity: { value: 0.5 },
			},
			update: {
				fillOpacity: { value: 0.3 },
			},
		},
	});

	marks.push({
		type: 'path',
		from: { data: 'intersections' },
		name: `${props.name}_intersections`,
		encode: {
			enter: {
				path: { field: 'path' },
				fill: { value: 'grey' },
				tooltip: getTooltip(props.children, `${props.name}_intersections`),
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
	if (!hasInteractiveChildren(children)) return;
	addHighlightedItemSignalEvents(signals, name, idKey, 1, getTooltipProps(children)?.excludeDataKeys);
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
