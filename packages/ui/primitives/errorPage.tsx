import { MinimalCard, MinimalCardContent } from './minimal-card';

export default function ErrorPage({ error }: { error?: string }) {
  return (
    <main className="mx-auto flex h-full w-full flex-col items-center justify-center gap-5 bg-[#F7F7F7] dark:bg-[#1f1e1e]">
      <MinimalCard className="h-full max-h-[100dvh] max-w-[90vw]">
        <MinimalCardContent className="relative flex h-full w-full flex-col items-center justify-center gap-8 overflow-hidden rounded-[22px] bg-red-500 text-white drop-shadow-[0_1.2px_1.2px_rgba(0,0,0,0.8)]">
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
