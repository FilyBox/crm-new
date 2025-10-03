import { Card } from '@documenso/ui/primitives/card';
import { FeatureCard } from '@documenso/ui/primitives/card-fancy';
import { HoverExpand_001 } from '@documenso/ui/primitives/expand-on-hover';

const images = [
  {
    src: 'https://tse2.mm.bing.net/th/id/OIP._uiLNMmvsh62UTrpL-5grAHaHa?rs=1&pid=ImgDetMain&o=7&rm=3',
    alt: 'Illustrations by my fav AarzooAly',
    code: '# 23',
  },
  {
    src: 'https://tse2.mm.bing.net/th/id/OIP._uiLNMmvsh62UTrpL-5grAHaHa?rs=1&pid=ImgDetMain&o=7&rm=3',
    alt: 'Illustrations by my fav AarzooAly',
    code: '# 23',
  },
  {
    src: 'https://tse2.mm.bing.net/th/id/OIP._uiLNMmvsh62UTrpL-5grAHaHa?rs=1&pid=ImgDetMain&o=7&rm=3',
    alt: 'Illustrations by my fav AarzooAly',
    code: '# 23',
  },
  {
    src: 'https://tse2.mm.bing.net/th/id/OIP._uiLNMmvsh62UTrpL-5grAHaHa?rs=1&pid=ImgDetMain&o=7&rm=3',
    alt: 'Illustrations by my fav AarzooAly',
    code: '# 23',
  },
  {
    src: 'https://tse2.mm.bing.net/th/id/OIP._uiLNMmvsh62UTrpL-5grAHaHa?rs=1&pid=ImgDetMain&o=7&rm=3',
    alt: 'Illustrations by my fav AarzooAly',
    code: '# 23',
  },
  {
    src: 'https://tse2.mm.bing.net/th/id/OIP._uiLNMmvsh62UTrpL-5grAHaHa?rs=1&pid=ImgDetMain&o=7&rm=3',
    alt: 'Illustrations by my fav AarzooAly',
    code: '# 23',
  },
  {
    src: 'https://tse2.mm.bing.net/th/id/OIP._uiLNMmvsh62UTrpL-5grAHaHa?rs=1&pid=ImgDetMain&o=7&rm=3',
    alt: 'Illustrations by my fav AarzooAly',
    code: '# 23',
  },
  {
    src: 'https://tse2.mm.bing.net/th/id/OIP._uiLNMmvsh62UTrpL-5grAHaHa?rs=1&pid=ImgDetMain&o=7&rm=3',
    alt: 'Illustrations by my fav AarzooAly',
    code: '# 23',
  },
  {
    src: 'https://tse2.mm.bing.net/th/id/OIP._uiLNMmvsh62UTrpL-5grAHaHa?rs=1&pid=ImgDetMain&o=7&rm=3',
    alt: 'Illustrations by my fav AarzooAly',
    code: '# 23',
  },
];
export default function DocumentPage() {
  return (
    <main className="flex min-h-[100dvh] w-full p-6">
      <FeatureCard className="flex h-full w-full flex-1 flex-col justify-center">
        <h1 className="block max-w-[20rem] truncate text-2xl font-semibold sm:mt-4 md:max-w-[30rem] md:text-3xl">
          landing page
        </h1>
        <HoverExpand_001 className="" images={images} />
      </FeatureCard>
    </main>
  );
}
