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
import { ChartPopover } from '@components/ChartPopover';
import { ChartTooltip } from '@components/ChartTooltip';
import { Legend } from '@components/Legend';
import { Venn } from '@components/Venn';
import useChartProps from '@hooks/useChartProps';
import { StoryFn } from '@storybook/react';
import { bindWithProps } from '@test-utils';
import { Chart } from 'Chart';

import { Content } from '@adobe/react-spectrum';

import { ChartProps, Datum, VennProps } from '../../../types';

export default {
	title: 'RSC/Venn',
	component: Venn,
};

const defaultChartProps: ChartProps = {
	data: [
		{ sets: ['A'], radius: 12 },
		{ sets: ['B'], radius: 12 },
		{ sets: ['C'], radius: 12 },
		{ sets: ['A', 'B'], radius: 2 },
		{ sets: ['A', 'C'], radius: 2 },
		{ sets: ['B', 'C'], radius: 2 },
		{ sets: ['A', 'B', 'C'], radius: 1 },
	],

	height: 350,
	width: 350,
};

const BasicVennStory: StoryFn<VennProps> = (args) => {
	const chartProps = useChartProps({ ...defaultChartProps });
	return (
		<Chart {...chartProps} debug>
			<Venn orientation={Math.PI / 2} {...args} metric="radius" />
		</Chart>
	);
};

const VennStoryWithLegend: StoryFn<VennProps> = (args) => {
	const chartProps = useChartProps({ ...defaultChartProps });
	return (
		<Chart {...chartProps} debug>
			<Venn orientation={Math.PI / 2} {...args} metric="radius" />
			<Legend highlight />
		</Chart>
	);
};

const dialogContent = (datum: Datum) => {
	return (
		<Content>
			<div>{datum['set_id']}</div>
		</Content>
	);
};

const interactiveChildren = [<ChartTooltip key={0}>{dialogContent}</ChartTooltip>];

const VennStory: StoryFn<VennProps> = (args) => {
	const chartProps = useChartProps({ ...defaultChartProps });
	return (
		<Chart {...chartProps} debug>
			<Venn orientation={-Math.PI / 2} {...args} metric="radius">
				<ChartTooltip />
				<ChartPopover>
					{(datum) => (
						console.log('Datum:', datum),
						(
							<Content>
								{datum.sets ? (
									// Intersection
									<>
										<h3 style={{ margin: '0 0 8px 0' }}>Intersection</h3>
										<div>Sets: {datum.sets}</div>
										<hr style={{ margin: '8px 0' }} />
										<div>Size: {datum.radius || datum.size}</div>
									</>
								) : (
									// Single set
									<>
										<h3 style={{ margin: '0 0 8px 0' }}>Set {datum.set}</h3>
										<hr style={{ margin: '8px 0' }} />
										<div>Size: {Math.sqrt(datum.size / 2)}</div>
									</>
								)}
							</Content>
						)
					)}
				</ChartPopover>
			</Venn>
			<Legend highlight />
		</Chart>
	);
};

const Basic = bindWithProps(BasicVennStory);

const WithLegend = bindWithProps(VennStoryWithLegend);

const WithToolTip = bindWithProps(BasicVennStory);
WithToolTip.args = {
	children: interactiveChildren,
};

const popoverContent = [<ChartTooltip key={0} />];

const WithPopover = bindWithProps(VennStory);
WithPopover.args = {
	children: popoverContent,
};

export { Basic, WithToolTip, WithPopover, WithLegend };
