import { FC } from 'react';

import { MarkProps } from 'types';

export interface VennProps extends MarkProps {
	/** angle for orientation of the venn diagram*/
	orientation: number;
	/** wethere the Venn is normalized through chart width*/
	normalize: boolean;
}

const Venn: FC<VennProps> = ({ orientation, normalize }) => {
	return null;
};

Venn.displayName = 'Venn';

export { Venn };
