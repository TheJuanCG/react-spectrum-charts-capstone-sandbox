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
import { hasPopover, isInteractive } from '@specBuilder/marks/markUtils';
import {
	type CircleRecord,
	type TextCenterRecord,
	computeTextCentres,
	intersectionAreaPath,
	normalizeSolution,
	scaleSolution,
	venn,
} from 'venn-helper';

import { ClickableChartProps, HighlightedItem, MarkChildElement, VennProps, VennSpecProps } from '../../types';
import { SET_ID_DELIMITER, VENN_DEFAULT_STYLES } from './vennDefaults';

export const getVennSolution = (props: VennSpecProps) => {
	const { data, orientation, metric, setField } = props;

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

		if (orientation) {
			solution = normalizeSolution(solution, orientation);
		}

		circles = scaleSolution(solution, props.chartWidth, props.chartHeight / 1.4, props.style.padding);
		textCenters = computeTextCentres(circles, filteredData);
	}

	const allIntersections = filteredData.map((datum) => {
		// we join by comma here to because its the output of venn-helper
		const setName = datum.sets.join(',');
		// Added size to the intersection data
		const { x: textX, y: textY } = textCenters[setName];
		return {
			set_id: datum.sets.join(SET_ID_DELIMITER),
			sets: datum.sets,
			path: intersectionAreaPath(datum.sets.map((set) => circles[set])),
			textY,
			textX,
			size: datum.size,
		};
	});

	const intersections = allIntersections.filter((datum) => datum.sets.length > 1);

	const circlesData = Object.entries(circles).map(([key, circle]) => ({
		set_id: key,
		x: circle.x,
		y: circle.y,
		// the size represents the radius, to scale we need to convert to the area of the square
		size: Math.pow(circle.radius * 2, 2),
		textX: textCenters[key].x,
		textY: textCenters[key].y,
	}));

	return { circles: circlesData, intersections, allIntersections };
};

export function mergeStylesWithDefaults(style: VennProps['style']) {
	return {
		fontSize: style?.fontSize ?? VENN_DEFAULT_STYLES.fontSize,
		padding: style?.padding ?? VENN_DEFAULT_STYLES.padding,
		fontWeight: style?.fontWeight ?? VENN_DEFAULT_STYLES.fontWeight,
		intersectionFill: style?.intersectionFill ?? VENN_DEFAULT_STYLES.intersectionFill,
		color: style?.color ?? VENN_DEFAULT_STYLES.color,
	} satisfies Required<VennProps['style']>;
}

export const getInteractiveMarkName = (
	children: MarkChildElement[],
	markName: string,
	highlightedItem?: HighlightedItem,
): string | undefined => {
	if (isInteractive(children) || highlightedItem !== undefined) {
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
