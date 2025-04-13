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
import { ChartData } from 'types';
import {
	type CircleRecord,
	type TextCenterRecord,
	computeTextCentres,
	intersectionAreaPath,
	normalizeSolution,
	scaleSolution,
	venn,
} from 'venn-helper';

export const getVennSolution = ({
	data,
	orientation=Math.PI,
	normalize=false,
}: {
	data: ChartData;
	orientation: number | undefined;
	normalize: boolean | undefined;
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

	return { circles: circlesData, intersections };
};
