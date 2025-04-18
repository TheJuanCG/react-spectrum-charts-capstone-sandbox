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
import { COLOR_SCALE, DEFAULT_COLOR, DEFAULT_COLOR_SCHEME, TABLE } from '@constants';
import { getFilteredTableData } from '@specBuilder/data/dataUtils';
import { getMarkOpacity, getTooltip, getTooltipProps, hasInteractiveChildren } from '@specBuilder/marks/markUtils';
// Added in these to match bar spec builder
import { addFieldToFacetScaleDomain } from '@specBuilder/scale/scaleSpecBuilder';
import { addHighlightedItemSignalEvents } from '@specBuilder/signal/signalSpecBuilder';
import { getColorValue } from '@specBuilder/specUtils';
import { sanitizeMarkChildren, toCamelCase } from '@utils';
import { produce } from 'immer';
import { Data, FilterTransform, FormulaTransform, LookupTransform, Mark, Scale, Signal, Spec } from 'vega';

import { VennProps } from '../../types';
import type { ChartData, ColorScheme, HighlightedItem, VennSpecProps } from '../../types';
import { SET_ID_DELIMITER, VENN_DEFAULT_STYLES } from './vennDefaults';
import { getVennSolution, mergeStylesWithDefaults } from './vennUtils';

export const addVenn = produce<
  Spec,
  [
    VennProps & {
      color: string;
      colorScheme?: ColorScheme;
      highlightedItem?: HighlightedItem;
      index?: number;
      idKey: string;
      data: ChartData;
      chartWidth?: number;
      chartHeight?: number;
    }
  ]
>(
  (
    spec,
    {
      orientation = Math.PI,
      name,
      metric,
      children,
      index = 0,
      color = DEFAULT_COLOR,
      colorScheme = DEFAULT_COLOR_SCHEME,
      data,
      chartWidth = 100,
      chartHeight = 100,
      style = VENN_DEFAULT_STYLES,
      ...props
    }
  ) => {
    const vennProps: VennSpecProps = {
      children: sanitizeMarkChildren(children),
      name: toCamelCase(name ?? `venn${index}`),
      dimension: '',
      markType: 'symbol',
      index,
      colorScheme,
      color,
      orientation,
      data: data,
      metric: metric,
      chartHeight,
      chartWidth,
      style: mergeStylesWithDefaults(style),
      ...props,
    };
    spec.data = addData(spec.data ?? [], vennProps);
    spec.marks = addMarks(spec.marks ?? [], vennProps);
    spec.scales = addScales(spec.scales ?? [], vennProps);
    spec.signals = addSignals(spec.signals ?? [], vennProps);
  }
);

export const addData = produce<Data[], [VennSpecProps]>((data, props) => {
  const { circles, intersections } = getVennSolution(props);

  data.push({
    name: 'circles',
    values: circles,
    transform: [{ type: 'formula', as: 'strokeSize', expr: 'datum.size * 1' }, ...getTableJoinTransforms()],
  });

  data.push({
    name: 'intersections',
    values: intersections,
    transform: getTableJoinTransforms(),
  });

  const filteredTable = getFilteredTableData(data);
  filteredTable.transform = filteredTable.transform ?? [];
  filteredTable.transform?.push(...getFilteredTableTransforms());

  const tableIndex = data.findIndex((d) => d.name === TABLE);
  data[tableIndex].transform = data[tableIndex].transform ?? [];
  data[tableIndex].transform?.push(...getTableTransforms());
});

export const addMarks = produce<Mark[], [VennSpecProps]>((marks, props) => {
  marks.push({
    type: 'symbol',
    name: props.name,
    from: { data: 'circles' },
    encode: {
      enter: {
        x: { field: 'x' },
        y: { field: 'y' },
        tooltip: getTooltip(props.children, props.name),
        size: { field: 'size' },
        shape: { value: 'circle' },
        fill: { scale: COLOR_SCALE, field: 'set_id' },
      },
      update: {
        opacity: getMarkOpacity(props, 0.3),
      },
    },
  });

  marks.push({
    type: 'symbol',
    name: `${props.name}_stroke`,
    from: { data: 'circles' },
    interactive: false,
    encode: {
      enter: {
        x: { field: 'x' },
        y: { field: 'y' },
        size: { field: 'strokeSize' },
        shape: { value: 'circle' },
        fill: { scale: COLOR_SCALE, field: 'set_id' },
      },
      update: {
        stroke: { scale: COLOR_SCALE, field: 'set_id' },
        strokeWidth: { value: 1 },
        fillOpacity: { value: 0 },
        opacity: getMarkOpacity(props),
      },
    },
  });

  marks.push({
    type: 'path',
    from: { data: 'intersections' },
    name: `${props.name}_intersections`,
    encode: {
      enter: {
        path: { field: 'path' },
        fill: { value: getColorValue('static-blue', props.colorScheme) },
        tooltip: getTooltip(props.children, `${props.name}`),
      },

      hover: hasInteractiveChildren(props.children)
        ? {
          fillOpacity: { value: 1 },
        }
        : {},

      update: {
        fillOpacity: { value: 0 },
      },
    },
  });

  // This is how we add text to the circles
  marks.push({
    type: 'text',
    from: { data: 'circles' },
    interactive: false,
    encode: {
      enter: {
        x: { field: 'textX' },
        y: { field: 'textY' },
        text: { field: `table_data.label` },
        fontSize: { value: props.style.fontSize },
        fill: { value: props.style.color },
        fontWeight: { value: props.style?.fontWeight },
        align: { value: 'center' },
        baseline: { value: 'middle' },
      },
    },
  });

  marks.push({
    type: 'text',
    from: { data: 'intersections' },
    interactive: false,
    encode: {
      enter: {
        x: { field: 'textX' },
        y: { field: 'textY' },
        text: { field: `table_data.label` },
        fontSize: { value: props.style.fontSize },
        fill: { value: props.style.color },
        fontWeight: { value: props.style?.fontWeight },
        align: { value: 'center' },
        baseline: { value: 'middle' },
      },
    },
  });
});

export const addScales = produce<Scale[], [VennSpecProps]>((scales, _props) => {
  addFieldToFacetScaleDomain(scales, COLOR_SCALE, 'set_legend');
});

export const getTableTransforms = (): (FormulaTransform | FilterTransform)[] => [
  {
    type: 'formula',
    as: 'set_id',
    expr: `join(datum.sets, '${SET_ID_DELIMITER}')`,
  },
  {
    type: 'formula',
    as: 'set_legend',
    expr: `length(datum.sets) > 1 ? datum.sets[0]: join(datum.sets, '${SET_ID_DELIMITER}')`,
  },
];

export const getFilteredTableTransforms = (): (FilterTransform | FormulaTransform)[] => [
  {
    type: 'formula',
    as: 'set_legend',
    expr: `join(datum.sets, '${SET_ID_DELIMITER}')`,
  },
  {
    type: 'filter',
    expr: `datum.sets.length <= 1`,
  },
];

const getTableJoinTransforms = (): (LookupTransform | FormulaTransform)[] => [
  {
    type: 'lookup',
    key: 'set_id',
    fields: ['set_id'],
    from: TABLE,
    as: ['table_data'],
  },
  { type: 'formula', as: 'rscSeriesId', expr: 'datum.table_data.set_id' },
  { type: 'formula', expr: 'datum.table_data.rscMarkId', as: 'rscMarkId' },
];

export const addSignals = produce<Signal[], [VennSpecProps]>((signals, props) => {
  const { children, name, idKey } = props;
  if (!hasInteractiveChildren(children)) return;
  addHighlightedItemSignalEvents(signals, name, idKey, 1, getTooltipProps(children)?.excludeDataKeys);
});
