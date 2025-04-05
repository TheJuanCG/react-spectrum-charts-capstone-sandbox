import { VennProps } from '@components/Venn';
import { produce } from 'immer';
import { ColorScheme, HighlightedItem } from 'types';
import { Spec } from 'vega';
import { vegaChart } from "venn-helper"

export const addVenn = produce<
  Spec,
  [VennProps & { colorScheme?: ColorScheme; highlightedItem?: HighlightedItem; index?: number; idKey: string }]
>((spec, { children, }) => {
  spec.data = 

});
