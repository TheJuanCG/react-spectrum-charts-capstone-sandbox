/*
 * Copyright 2024 Adobe. All rights reserved.
 * This file is licensed to you under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License. You may obtain a copy
 * of the License at http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software distributed under
 * the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR REPRESENTATIONS
 * OF ANY KIND, either express or implied. See the License for the specific language
 * governing permissions and limitations under the License.
 */

import { findAllMarksByGroupName, findChart, findMarksByGroupName, render } from '@test-utils';
import { spectrumColors } from '@themes';

import { FeatureMatrix } from './FeatureMatrix.story';

const colors = spectrumColors.light;

describe('FeatureMatrix', () => {
	test('Single series should render correctly', async () => {
		render(<FeatureMatrix {...FeatureMatrix.args} />);

		const chart = await findChart();
		expect(chart).toBeInTheDocument();

		const points = await findAllMarksByGroupName(chart, 'scatter0');
		expect(points).toHaveLength(6);

		// point styling
		const point = points[0];
		expect(point).toHaveAttribute('fill', colors['categorical-100']);
		expect(point).toHaveAttribute('fill-opacity', '1');
		expect(point).toHaveAttribute('stroke-width', '0');

		// trendline styling
		const trendline = await findMarksByGroupName(chart, 'scatter0Trendline0');
		expect(trendline).toBeInTheDocument();
		expect(trendline).toHaveAttribute('stroke', colors['categorical-100']);
		expect(trendline).toHaveAttribute('stroke-width', '1');
		expect(trendline).toHaveAttribute('stroke-dasharray', '');
	});
});
