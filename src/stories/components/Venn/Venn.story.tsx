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
import { ChartTooltip } from '@components/ChartTooltip';
import { Legend } from '@components/Legend';
import { Venn } from '@components/Venn';
import useChartProps from '@hooks/useChartProps';
import { StoryFn } from '@storybook/react';
import { bindWithProps } from '@test-utils';
import { Chart } from 'Chart';

import { ChartProps, Datum, VennProps } from '../../../types';
import { Content } from '@adobe/react-spectrum';

export default {
	title: 'RSC/Venn',
	component: Venn,
};

const defaultChartProps: ChartProps = {
	data: [
		{ sets: ['A'], radius: 6, label: "" },
		{ sets: ['B'], radius: 12, label: "" },
		{ sets: ['C'], radius: 18, label: "" },
		{ sets: ['A', 'B'], radius: 2 },
		{ sets: ['A', 'C'], radius: 4 },
		{ sets: ['B', 'C'], radius: 6 },
		{ sets: ['A', 'B'], radius: 4 },
		{ sets: ['A', 'B', 'C'], radius: 1 },
	],

	height: 450,
	width: 600,
};

const VennStory: StoryFn<VennProps> = (args) => {
	const chartProps = useChartProps({ ...defaultChartProps });
	return (
		<Chart {...chartProps} debug>
			<Venn orientation={-Math.PI / 2} normalize {...args} metric="radius" />
			<Legend highlight />
		</Chart>
	);
};

const dialogContent = (datum: Datum) => {
	return (
		<Content>
			<div>{datum.text}</div>
		</Content>
	);
};

const interactiveChildren = [<ChartTooltip key={0}>{dialogContent}</ChartTooltip>];

const Basic = bindWithProps(VennStory);

const WithToolTip = bindWithProps(VennStory);
WithToolTip.args = {
	children: interactiveChildren,
};

export { Basic, WithToolTip };
