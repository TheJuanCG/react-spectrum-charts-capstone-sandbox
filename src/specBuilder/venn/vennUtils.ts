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
import { MarkChildElement, VennSpecProps } from 'types';
import {
	type CircleRecord,
	type TextCenterRecord,
	computeTextCentres,
	intersectionAreaPath,
	normalizeSolution,
	scaleSolution,
	venn,
} from 'venn-helper';
import { HighlightedItem } from 'types';
import { hasPopover, isInteractive } from '@specBuilder/marks/markUtils';

export const getVennSolution = (props: VennSpecProps) => {
	const { data, orientation, normalize, metric, setField } = props;

	// map to object that venn-helper library expects
	// or condition is to limit it to just 1 loop to map
	let filteredData =
		setField || metric
			? data.map((datum) => {
					const ret = {
						...datum,
						sets: setField ? [...datum[setField]] : [...datum.sets],
						size: metric ? datum[metric] : datum.size,
					};

					if (setField) delete ret[setField];
					if (metric) delete ret[metric];

					return ret;
			  })
			: data;

	filteredData = filteredData.filter((datum) => datum.size !== 0 && datum.sets.length > 0);

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

	const allIntersections = filteredData.map((datum) => {
		const setName = datum.sets.join(',');
		// Added size to the intersection data
		const { x: textX, y: textY } = textCenters[setName];
		return {
			sets: datum.sets,
			path: intersectionAreaPath(datum.sets.map((set) => circles[set])),
			text: datum.label || datum.sets.join('∩'),
			textY,
			textX,
			size: datum.size
		};
	});

	const intersections = allIntersections.filter((datum) => datum.sets.length > 1);

	const circlesData = Object.entries(circles).map(([key, circle]) => ({
		set: key,
		x: circle.x,
		y: circle.y,
		// the size represents the radius, to scale we need to convert to the area of the square
		size: Math.pow(circle.radius * 2, 2),
		text: key,
		textX: textCenters[key].x,
		textY: textCenters[key].y,
	}));

	return { circles: circlesData, intersections, allIntersections };
};

export const getInteractiveMarkName = (
	children: MarkChildElement[],
	markName: string,
	highlightedItem?: HighlightedItem,
	props?: any
  ): string | undefined => {
	if (isInteractive(children, props) || highlightedItem !== undefined) {
	  return markName;
	}
	return undefined;
  };
  
  export const getPopoverMarkName = (children: MarkChildElement[], markName: string): string | undefined => {
	if (hasPopover(children)) {
	  return markName;
	}
	return undefined;
  };
