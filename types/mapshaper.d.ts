// mapshaper ships no types. scripts/build-india-geo.ts is the only consumer
// and needs just the one entry point.
declare module 'mapshaper' {
  const mapshaper: {
    runCommands(commands: string): Promise<void>;
  };
  export default mapshaper;
}
