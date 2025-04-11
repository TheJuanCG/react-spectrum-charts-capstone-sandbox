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
import { Venn, VennProps } from '@components/Venn';
import useChartProps from '@hooks/useChartProps';
import { StoryFn } from '@storybook/react';
import { bindWithProps } from '@test-utils';
import { Chart } from 'Chart';

import { ChartProps } from '../../../types';
import { Legend } from '@components/Legend';

export default {
  title: "RSC/Venn",
  component: Venn
}

const defaultChartProps: ChartProps = {
	data: [
		{ sets: ['A'], size: 6 },
		{ sets: ['B'], size: 12 },
		{ sets: ['C'], size: 18 },
		{ sets: ['A', 'B'], size: 2 },
		{ sets: ['A', 'C'], size: 4 },
		{ sets: ['B', 'C'], size: 6 },
		{ sets: ['A', 'B'], size: 4 },
		{ sets: ['A', 'B', 'C'], size: 1 }
	],

	// data: [
	// 	{count: 6, set: 'A'},
	// 	{count: 12, set: 'B'},
	// 	{count: 18, set: 'C'},
	// ],

	height: 450,
	width: 600,
};

const VennStory: StoryFn<VennProps> = (args) => {
	const chartProps = useChartProps({ ...defaultChartProps });
	return (
    <Chart {...chartProps} debug>
      <Venn orientation={-Math.PI / 2} normalize />
	  <Legend highlight/>
    </Chart>
	);

};

const Basic = bindWithProps(VennStory);

export { Basic };
