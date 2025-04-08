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

import type { ColorScheme, HighlightedItem } from '../../types';

export const addVenn = produce<
	Spec,
	[
		VennProps & {
			colorScheme?: ColorScheme;
			highlightedItem?: HighlightedItem;
			index?: number;
			idKey: string;
			data: any;
		}
	]
>((spec, { normalize, orientation, data }) => {
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

	const intersections = filteredData
		.map((datum) => {
			if (datum.sets.length <= 1) return null;

			return {
				sets: datum,
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

	spec.scales = spec.scales ?? [];
	spec.scales?.push({
		name: 'color',
		type: 'ordinal',
		domain: { data: 'circles', field: 'set' },
		range: 'category',
	});

	spec.marks?.push({
		type: 'text',
		from: { data: 'circles' },
		encode: {
			enter: {
				x: { field: 'textX' },
				y: { field: 'textY' },
				text: { field: 'text' },
				fontSize: { value: 14 },
				fill: { scale: 'color', field: 'set' },
				fontWeight: { value: 'normal' },
			},
		},
	});
});
