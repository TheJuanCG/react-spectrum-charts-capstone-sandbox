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
import { VennProps } from '../../types';
import { produce } from 'immer';
import { Data, FormulaTransform, Mark, PieTransform, Scale, Signal, Spec } from 'vega';
import {
	type CircleRecord,
	type TextCenterRecord,
	computeTextCentres,
	intersectionAreaPath,
	normalizeSolution,
	scaleSolution,
	venn,
} from 'venn-helper';

// Added in these to match bar spec builder
import { addFieldToFacetScaleDomain } from '@specBuilder/scale/scaleSpecBuilder';
import { COLOR_SCALE, DEFAULT_COLOR, DEFAULT_COLOR_SCHEME, DEFAULT_METRIC, FILTERED_TABLE, TABLE } from '@constants';
import { getScaleIndexByName } from '@specBuilder/scale/scaleSpecBuilder';

import type { ColorScheme, HighlightedItem } from '../../types';

export const addVenn = produce<
	Spec,
	[
		VennProps & {
			color: string;
			colorScheme?: ColorScheme;
			highlightedItem?: HighlightedItem;
			index?: number;
			idKey: string;
			data: any;
		}
	]
>((
	spec,
	{
		normalize,
		orientation, 
		data, 
		color = DEFAULT_COLOR,
		colorScheme = DEFAULT_COLOR_SCHEME,
		...props
	}) => {

	
	const filteredData = data.filter((datum) => datum.size !== 0 && datum.sets.length > 0);

	let circles: CircleRecord = {};
	let textCenters: TextCenterRecord = {};

	if (filteredData.length > 0) {
		let solution = venn(filteredData);

		if (normalize) {
			solution = normalizeSolution(solution, orientation);
		}

		circles = scaleSolution(solution, 600, 350, 15);
		textCenters = computeTextCentres(circles, filteredData);
	}

	const setNames = Object.keys(circles);

	const intersections = filteredData
		.map((datum) => {
			if (datum.sets.length <= 1) return null;

			return {
				sets: datum.sets,
				path: intersectionAreaPath(datum.sets.map((set) => circles[set])),
				text: datum.label || datum.sets.join('∩'),
			};
		})
		.filter(Boolean);

	const circlesData = Object.entries(circles).map(([key, circle]) => ({
		set: key,
		x: circle.x,
		y: circle.y,
		size: Math.pow(circle.radius * 2, 2),
		text: key,
		textX: textCenters[key].x,
		textY: textCenters[key].y,
	}));

	spec.data = spec.data ?? [];
	spec.data?.push({ name: 'circles', values: circlesData });
	spec.data?.push({ name: 'intersections', values: intersections });

	// spec.data = addData(spec.data ?? [], props);

	spec.marks = spec.marks ?? [];
	spec.marks?.push({
		type: 'symbol',
		from: { data: 'circles' },
		encode: {
			enter: {
				x: { field: 'x' },
				y: { field: 'y' },
				size: { field: 'size' },
				shape: { value: 'circle' },
				fillOpacity: { value: 1 },
				fill: { scale: COLOR_SCALE, field: 'set' },
				//tooltip: [{ field: 'text' }],
			},
			hover: {
				fillOpacity: { value: 0.5 },
			},
			update: {
				fillOpacity: { value: 1 },
			},
		},
	});

	spec.marks?.push({
		type: 'path',
		from: { data: 'intersections' },
		encode: {
			enter: {
				path: { field: 'path' },
				fill: { value: 'grey' },
				fillOpacity: { value: 0 },
				//tooltip: [{ field: 'text' }],
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
	spec.marks?.push({
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
		  }
		}
	  });

	// Create a signal for the color field
	// tells the chart  component which field in data should be used for colorEncoding
	// So, helps understand which data field contain the categories that should be assigned colors and displayed in the legend
	// spec.signals = spec.signals ?? [];

	// spec.signals.push({
	// 	name: 'colorField',
	// 	value: 'set'
	// });

	// });



	// spec.legends = spec.legends ?? [];

	// // Add legend for color scale
	// spec.legends.push({
	// 	fill: 'color',
	// 	orient: 'right'
		//title: 'Sets'
	// });
	spec.data = transformTable(spec.data ?? [], props);
	spec.scales = addScales(spec.scales ?? [], props);
});

// export const addData = produce<Data[], [VennProps]>((data, props) => {
// 	const filteredTableIndex = data.findIndex((d) => d.name === FILTERED_TABLE);

export const addScales = produce<Scale[], [VennProps]>((scales, props) => {
	//const { color } = props;
	addFieldToFacetScaleDomain(scales, COLOR_SCALE, 'set');
	// scales.push({
	// 	name: COLOR_SCALE,
	// 	type: 'ordinal',
	// 	domain: { data: 'circles', field: 'set' },
	// 	range: {signal: 'colors'}
	// });
})

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
})
