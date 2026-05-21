function App() {
  return (
    <div className="flex h-full w-full items-center justify-center bg-space-900">
      <div className="text-center">
        <h1 className="text-6xl font-semibold tracking-tight text-neon-400">
          moirai
        </h1>
        <p className="mt-3 font-mono text-sm uppercase tracking-widest text-cyan-400">
          the fates of what we build
        </p>
        <div className="mt-6 flex justify-center gap-2">
          <span className="h-3 w-3 rounded-full bg-neon-400" />
          <span className="h-3 w-3 rounded-full bg-cyan-400" />
          <span className="h-3 w-3 rounded-full bg-violet-400" />
          <span className="h-3 w-3 rounded-full bg-rose-400" />
          <span className="h-3 w-3 rounded-full bg-gold-400" />
        </div>
      </div>
    </div>
  );
}

export default App;
