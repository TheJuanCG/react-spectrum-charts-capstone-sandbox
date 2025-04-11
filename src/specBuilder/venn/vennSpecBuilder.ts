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
import { VennProps } from '@components/Venn';
import { produce } from 'immer';
import { Spec } from 'vega';
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
import { COLOR_SCALE, DEFAULT_COLOR } from '@constants';
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
				fillOpacity: { value: 0.3 },
				fill: { scale: 'color', field: 'set' },
				tooltip: [{ field: 'text' }],
			},
			hover: {
				fillOpacity: { value: 0.5 },
			},
			update: {
				fillOpacity: { value: 0.3 },
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
				tooltip: [{ field: 'text' }],
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

	// Add color scale (you already have this)
	spec.scales = spec.scales ?? [];
	spec.scales?.push({
	name: 'color',
	type: 'ordinal',
	domain: { data: 'circles', field: 'set' },
	range: 'category',
	});

	// Create a signal for the color field
	// tells the chart  component which field in data should be used for colorEncoding
	// So, helps understand which data field contain the categories that should be assigned colors and displayed in the legend
	spec.signals = spec.signals ?? [];

	spec.signals.push({
		name: 'colorField',
		value: 'set'
	});

	// });

	// Register field for Legend integration
	//addFieldToFacetScaleDomain(spec.scales, COLOR_SCALE, color);  // Add this line

	// Add invisible legend marker
	spec.legends = spec.legends ?? [];
	spec.legends.push({
		fill: 'color',
		orient: 'right',  // Position it at the top
		title: 'Sets',  // Add a title
		labelFont: "adobe-clean, 'Source Sans Pro', -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Air', 'Helvetica Neue', 'Helvetica', 'Ubuntu', 'Trebuchet MS', 'Lucida Grande', sans-serif",
		labelFontSize: 14,
		labelColor: { value: 'rgb(235, 235, 235)' },
		titleFont: "adobe-clean, 'Source Sans Pro', -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Air', 'Helvetica Neue', 'Helvetica', 'Ubuntu', 'Trebuchet MS', 'Lucida Grande', sans-serif",
		titleFontSize: 16,
		titleColor: { value: 'rgb(235, 235, 235)' },
		symbolType: 'circle',
		symbolSize: 100,
		symbolFillOpacity: 0.7,
		padding: 10,
		offset: 10,
		// No opacity encodings here since we want it visible
	});
});

