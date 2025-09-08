import { MinimalCard, MinimalCardContent } from './minimal-card';

export default function ErrorPage({ error }: { error?: string }) {
  return (
    <main className="mx-auto flex h-full min-h-[80dvh] w-full flex-col items-center justify-center gap-5">
      <MinimalCard className="h-full min-h-[80dvh] max-w-[90vw] bg-amber-400">
        <MinimalCardContent className="relative flex h-full min-h-[80dvh] w-full flex-col items-center justify-center gap-8 overflow-hidden rounded-[22px] bg-red-500 text-white drop-shadow-[0_1.2px_1.2px_rgba(0,0,0,0.8)]">
          <h1
            className="h-fit text-center text-7xl font-bold sm:text-9xl md:text-[200px]"
            style={{
              WebkitTextFillColor: 'transparent',
              WebkitTextStrokeWidth: '4px',
              WebkitTextStrokeColor: 'rgba(255, 255, 255, 0.8)',
            }}
          >
            Ooops!
          </h1>
          <div className="mt-5 text-center">
            <p className="text-lg font-semibold">Parece que algo salió mal.</p>
            <p className="text-base">{error || 'No se pudo cargar la página'}</p>
          </div>
        </MinimalCardContent>
      </MinimalCard>
    </main>
  );
}
